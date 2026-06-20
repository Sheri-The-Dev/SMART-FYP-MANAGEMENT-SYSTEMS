const { pool } = require('../config/database');
const { logProposalActivity, sendProposalNotification } = require('../utils/proposalNotifications');
const { logAudit, AuditActions } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ACTIVE_PROPOSAL_STATUSES = ['draft', 'pending_member_confirmation', 'submitted', 'revision_requested', 'approved'];
const ACTIVE_MEMBER_STATUSES = ['pending', 'accepted'];

const getCanonicalActiveUserBySapId = async (connection, { sap_id, email }) => {
  const normalizedSapId = String(sap_id || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedSapId) return { ok: false, message: 'SAP ID is required' };

  const [rows] = await connection.execute(
    'SELECT id, sap_id, email FROM users WHERE sap_id = ? AND is_active = true',
    [normalizedSapId]
  );

  if (!rows || rows.length === 0) {
    return { ok: false, message: `User with SAP ID ${normalizedSapId} does not exist.` };
  }

  const user = rows[0];
  if (normalizedEmail && String(user.email || '').toLowerCase() !== normalizedEmail) {
    return { ok: false, message: `SAP ID ${normalizedSapId} does not match the provided email.` };
  }

  return { ok: true, user };
};

const isUserInAnyActiveProposal = async (connection, { userId, sapId, email, excludeProposalId = null }) => {
  const params = [];

  const statusPlaceholders = ACTIVE_PROPOSAL_STATUSES.map(() => '?').join(',');
  const memberStatusPlaceholders = ACTIVE_MEMBER_STATUSES.map(() => '?').join(',');

  const excludeClause = excludeProposalId ? ' AND p.id != ?' : '';

  const sql = `
    SELECT p.id, p.status
    FROM proposals p
    WHERE p.student_id = ? AND p.status IN (${statusPlaceholders})${excludeClause}
    UNION
    SELECT p.id, p.status
    FROM proposals p
    JOIN proposal_members pm ON p.id = pm.proposal_id
    WHERE (pm.sap_id = ? OR pm.email = ?)
      AND pm.status IN (${memberStatusPlaceholders})
      AND p.status IN (${statusPlaceholders})${excludeClause}
  `;

  params.push(userId, ...ACTIVE_PROPOSAL_STATUSES);
  if (excludeProposalId) params.push(excludeProposalId);

  params.push(sapId, email, ...ACTIVE_MEMBER_STATUSES, ...ACTIVE_PROPOSAL_STATUSES);
  if (excludeProposalId) params.push(excludeProposalId);

  const [rows] = await connection.execute(sql, params);
  return rows && rows.length > 0;
};

// ============================================
// PROPOSAL CONTROLLER - STUDENT & SUPERVISOR METHODS
// ============================================

// ============================================
// STUDENT: CREATE PROPOSAL (DRAFT)
// ============================================
exports.createProposal = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { project_title, project_description, supervisor_id, members } = req.body;
    const studentId = req.user.id;

    const parsedSupervisorId = supervisor_id ? parseInt(supervisor_id, 10) : null;
    if (supervisor_id && isNaN(parsedSupervisorId)) {
      return res.status(400).json({ success: false, message: 'Invalid supervisor ID provided.' });
    }

    // 1. Fetch lead user (with batch_id)
    const [leadUserRows] = await connection.execute(
      'SELECT id, sap_id, email, batch_id FROM users WHERE id = ? AND is_active = true',
      [studentId]
    );
    if (!leadUserRows || leadUserRows.length === 0) {
      return res.status(400).json({ success: false, message: 'User not found or inactive.' });
    }
    const leadUser = leadUserRows[0];

    // 2. Already in another active proposal?
    const isLeadAlreadyInActiveProposal = await isUserInAnyActiveProposal(connection, {
      userId: leadUser.id, sapId: leadUser.sap_id, email: leadUser.email
    });
    if (isLeadAlreadyInActiveProposal) {
      return res.status(400).json({ success: false, message: 'You are already part of another active proposal and cannot create a new one.' });
    }

    // 3. Batch enrollment check
    let activeBatchId = null;
    if (leadUser.batch_id) {
      const [batchRows] = await connection.execute(
        'SELECT id, state FROM academic_batches WHERE id = ?', [leadUser.batch_id]
      );
      if (batchRows && batchRows.length > 0) {
        if (batchRows[0].state !== 'Active') {
          return res.status(403).json({
            success: false,
            message: `Your batch is currently in "${batchRows[0].state}" state. Proposals can only be submitted when your batch is Active.`
          });
        }
        activeBatchId = batchRows[0].id;
      }
    }

    // 4. Validate all members BEFORE opening transaction
    const canonicalMembers = [];
    if (members && Array.isArray(members)) {
      const leadSapId = leadUser.sap_id;
      const leadEmail = leadUser.email;
      const sapIdSet = new Set();
      const emailSet = new Set();

      for (const m of members) {
        const nSapId = String(m?.sap_id || '').trim();
        const nEmail = String(m?.email || '').trim().toLowerCase();
        if (nSapId) {
          if (sapIdSet.has(nSapId)) return res.status(400).json({ success: false, message: `Duplicate SAP ID: ${nSapId}` });
          sapIdSet.add(nSapId);
        }
        if (nEmail) {
          if (emailSet.has(nEmail)) return res.status(400).json({ success: false, message: `Duplicate email: ${nEmail}` });
          emailSet.add(nEmail);
        }
      }

      for (const member of members) {
        const canonical = await getCanonicalActiveUserBySapId(connection, member);
        if (!canonical.ok) return res.status(400).json({ success: false, message: canonical.message });

        const { sap_id: mSapId, email: mEmail } = canonical.user;
        if (mSapId === leadSapId || String(mEmail || '').toLowerCase() === String(leadEmail || '').toLowerCase()) {
          return res.status(400).json({ success: false, message: 'You cannot add yourself (Team Lead) as a group member.' });
        }
        const conflict = await isUserInAnyActiveProposal(connection, { userId: canonical.user.id, sapId: mSapId, email: mEmail });
        if (conflict) return res.status(400).json({ success: false, message: `User with SAP ID ${mSapId} is already part of another active proposal.` });

        canonicalMembers.push({ ...member, sap_id: mSapId, email: mEmail });
      }
    }

    // 5. All validations passed — open transaction and write
    await connection.beginTransaction();

    const [proposalResult] = await connection.execute(
      `INSERT INTO proposals (student_id, supervisor_id, project_title, project_description, status, batch_id)
       VALUES (?, ?, ?, ?, 'draft', ?)`,
      [studentId, parsedSupervisorId, project_title, project_description, activeBatchId]
    );
    const proposalId = proposalResult.insertId;

    for (let i = 0; i < canonicalMembers.length; i++) {
      const m = canonicalMembers[i];
      const invitationToken = crypto.randomBytes(32).toString('hex');
      await connection.execute(
        `INSERT INTO proposal_members (proposal_id, sap_id, email, phone_number, department, display_order, invitation_token, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [proposalId, m.sap_id, m.email, m.phone_number || null, m.department || null, i, invitationToken]
      );
    }

    await logProposalActivity(connection, {
      proposalId, userId: studentId, userRole: req.user.role,
      action: 'PROPOSAL_CREATED',
      newValue: { project_title, status: 'draft', batch_id: activeBatchId },
      ipAddress: req.ip
    });

    await connection.commit();

    res.status(201).json({ success: true, message: 'Proposal draft created successfully', data: { id: proposalId } });

  } catch (error) {
    await connection.rollback();
    console.error('Create proposal error:', error);
    res.status(500).json({ success: false, message: 'Failed to create proposal', error: error.message });
  } finally {
    connection.release();
  }
};


// ============================================
// STUDENT: GET MY PROPOSALS
// ============================================

exports.getMyProposals = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const studentId = req.user.id;
    const userSapId = req.user.sap_id || '';
    const userEmail = req.user.email;

    // 1. Get the student's current batch
    const [userRows] = await connection.execute('SELECT batch_id FROM users WHERE id = ?', [studentId]);
    const currentBatchId = userRows[0]?.batch_id;

    if (!currentBatchId) {
      // If student is not enrolled in any batch, they logically have no current proposals
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. Fetch proposals where user is leader OR member, restricted to current batch
    const [proposals] = await connection.execute(
      `SELECT DISTINCT
        p.*,
        u.username as supervisor_name,
        lead.username as lead_name,
        ab.name as batch_name,
        ab.fyp_phase as batch_phase,
        (SELECT COUNT(*) FROM proposal_members pm2 WHERE pm2.proposal_id = p.id) as member_count,
        (SELECT status FROM proposal_members pm3 WHERE pm3.proposal_id = p.id AND (pm3.sap_id = ? OR pm3.email = ?)) as user_member_status
       FROM proposals p
       LEFT JOIN users u ON p.supervisor_id = u.id
       LEFT JOIN users lead ON p.student_id = lead.id
       LEFT JOIN academic_batches ab ON p.batch_id = ab.id
       LEFT JOIN proposal_members pm ON p.id = pm.proposal_id
       WHERE p.batch_id = ? AND (
           p.student_id = ? 
           OR pm.sap_id = ? 
           OR pm.email = ?
       )
       ORDER BY p.created_at DESC`,
      [userSapId, userEmail, currentBatchId, studentId, userSapId, userEmail]
    );

    // Map through and add is_leader and can_manage flags for the frontend
    const enrichedProposals = proposals.map(p => {
      const isLeader = p.student_id === studentId;
      const isAcceptedMember = p.user_member_status === 'accepted';
      return {
        ...p,
        is_leader: isLeader,
        is_accepted_member: isAcceptedMember,
        can_manage: isLeader || isAcceptedMember
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedProposals
    });

  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your proposals list',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// STUDENT: GET PROPOSAL DETAILS
// ============================================
exports.getProposalDetails = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get proposal with supervisor and lead student info
    const [proposals] = await connection.execute(
      `SELECT 
        p.*,
        u.username as supervisor_name,
        u.email as supervisor_email,
        student.username as student_name,
        student.email as student_email,
        student.sap_id as student_sap_id,
        student.phone as student_phone,
        student.department as student_department
       FROM proposals p
       LEFT JOIN users u ON p.supervisor_id = u.id
       LEFT JOIN users student ON p.student_id = student.id
       WHERE p.id = ?`,
      [proposalId]
    );

    if (proposals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposal = proposals[0];

    // Check access permissions
    // Allow access if:
    // 1. User is Admin
    // 2. User is the Lead Student (student_id)
    // 3. User is the Supervisor (supervisor_id)
    // 4. User is a group member (in proposal_members table)

    // Get member info if user is a student
    let isMember = false;
    if (userRole === 'Student' && proposal.student_id !== userId) {
      const [memberCheck] = await connection.execute(
        'SELECT id FROM proposal_members WHERE proposal_id = ? AND (sap_id = ? OR email = ?)',
        [proposalId, req.user.sap_id || '', req.user.email]
      );
      isMember = memberCheck.length > 0;
    }

    const hasAccess =
      userRole === 'Administrator' ||
      proposal.student_id === userId ||
      proposal.supervisor_id === userId ||
      isMember;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add member status info for the frontend
    const [members] = await connection.execute(
      `SELECT sap_id, email, phone_number, department, display_order, status
       FROM proposal_members
       WHERE proposal_id = ?
       ORDER BY display_order`,
      [proposalId]
    );

    proposal.members = members;
    proposal.is_lead = proposal.student_id === userId;
    proposal.is_member = isMember;

    res.status(200).json({
      success: true,
      data: proposal
    });

  } catch (error) {
    console.error('Get proposal details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve proposal details',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// STUDENT: UPDATE PROPOSAL
// ============================================
exports.updateProposal = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const studentId = req.user.id;

    // 1. STRICTLY extract only allowed fields from request body.
    // This ensures student_id (Team Lead) is NEVER updated even if sent in request.
    const {
      project_title,
      project_description,
      supervisor_id,
      members
    } = req.body;

    const parsedSupervisorId = supervisor_id !== undefined ? (supervisor_id ? parseInt(supervisor_id, 10) : null) : undefined;
    if (parsedSupervisorId !== undefined && supervisor_id && isNaN(parsedSupervisorId)) {
      return res.status(400).json({ success: false, message: 'Invalid supervisor ID provided.' });
    }

    // Get current proposal from database to preserve original Team Lead
    const [currentProposal] = await connection.execute(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (currentProposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposal = currentProposal[0];

    // Verify ownership or group membership (accepted members only)
    const [memberRows] = await connection.execute(
      'SELECT id FROM proposal_members WHERE proposal_id = ? AND (sap_id = ? OR email = ?) AND status = "accepted"',
      [proposalId, req.user.sap_id || '', req.user.email]
    );
    const isMember = memberRows.length > 0;

    if (proposal.student_id !== studentId && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the Team Lead or accepted group members can edit the proposal.'
      });
    }

    if (!['draft', 'revision_requested', 'pending_member_confirmation'].includes(proposal.status)) {
      return res.status(400).json({
        success: false,
        message: 'Proposal cannot be updated in its current status'
      });
    }

    await connection.beginTransaction();

    // Update proposal
    const updateFields = [];
    const updateValues = [];

    if (project_title !== undefined) {
      updateFields.push('project_title = ?');
      updateValues.push(project_title);
    }
    if (project_description !== undefined) {
      updateFields.push('project_description = ?');
      updateValues.push(project_description);
    }
    if (parsedSupervisorId !== undefined) {
      updateFields.push('supervisor_id = ?');
      updateValues.push(parsedSupervisorId);
    }

    if (updateFields.length > 0) {
      // FIX C: Block project title changes for FYP-II
      if (project_title !== undefined && proposal.fyp_part === 'FYP-II') {
        const [originalTitle] = await connection.execute('SELECT project_title FROM proposals WHERE id = ?', [proposalId]);
        if (originalTitle[0].project_title !== project_title) {
          await connection.rollback();
          return res.status(403).json({
            success: false,
            message: 'Project title cannot be changed in FYP-II.'
          });
        }
      }

      updateValues.push(proposalId);
      await connection.execute(
        `UPDATE proposals SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    // Update members if provided
    if (members && Array.isArray(members)) {
      // 1. Ensure team lead is not in the members array
      const [leadUser] = await connection.execute('SELECT sap_id, email FROM users WHERE id = ?', [proposal.student_id]);
      if (leadUser.length > 0) {
        const leadSapId = leadUser[0].sap_id;
        const leadEmail = leadUser[0].email;
        const isLeadInMembers = members.some(m => m.sap_id === leadSapId || String(m.email || '').toLowerCase() === String(leadEmail || '').toLowerCase());
        if (isLeadInMembers) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'You cannot add yourself (Team Lead) as a group member. You are automatically included.'
          });
        }
      }

      const sapIdSet = new Set();
      const emailSet = new Set();

      for (const m of members) {
        const normalizedSapId = String(m?.sap_id || '').trim();
        const normalizedEmail = String(m?.email || '').trim().toLowerCase();

        if (normalizedSapId) {
          if (sapIdSet.has(normalizedSapId)) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: `Duplicate SAP ID found in group members: ${normalizedSapId}`
            });
          }
          sapIdSet.add(normalizedSapId);
        }

        if (normalizedEmail) {
          if (emailSet.has(normalizedEmail)) {
            await connection.rollback();
            return res.status(400).json({
              success: false,
              message: `Duplicate email found in group members: ${normalizedEmail}`
            });
          }
          emailSet.add(normalizedEmail);
        }
      }

      const canonicalMembers = [];
      for (const member of members) {
        const canonical = await getCanonicalActiveUserBySapId(connection, member);
        if (!canonical.ok) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: canonical.message
          });
        }
        canonicalMembers.push({
          ...member,
          sap_id: canonical.user.sap_id,
          email: canonical.user.email,
          user_id: canonical.user.id
        });
      }

      // 2. Check if any NEW member is already part of another active proposal
      // Fetch existing members to sync rather than delete all
      const [existingMembers] = await connection.execute(
        'SELECT sap_id, status, invitation_token FROM proposal_members WHERE proposal_id = ?',
        [proposalId]
      );

      const existingSapIds = existingMembers.map(m => m.sap_id);
      const newSapIds = canonicalMembers.map(m => m.sap_id);

      const membersToRemove = existingSapIds.filter(sap_id => !newSapIds.includes(sap_id));
      const membersToAdd = canonicalMembers.filter(m => !existingSapIds.includes(m.sap_id));
      const membersToUpdate = canonicalMembers.filter(m => existingSapIds.includes(m.sap_id));

      for (const member of membersToAdd) {
        const conflict = await isUserInAnyActiveProposal(connection, {
          userId: member.user_id,
          sapId: member.sap_id,
          email: member.email,
          excludeProposalId: proposalId
        });

        if (conflict) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: `User with SAP ID ${member.sap_id} is already part of another active proposal.`
          });
        }
      }

      // 1. Remove deleted members
      if (membersToRemove.length > 0) {
        const placeholders = membersToRemove.map(() => '?').join(',');
        await connection.execute(
          `DELETE FROM proposal_members WHERE proposal_id = ? AND sap_id IN (${placeholders})`,
          [proposalId, ...membersToRemove]
        );
      }

      // 2. Insert new members
      const newlyAddedMembers = [];
      for (let i = 0; i < membersToAdd.length; i++) {
        const member = membersToAdd[i];
        const invitationToken = crypto.randomBytes(32).toString('hex');

        await connection.execute(
          `INSERT INTO proposal_members 
           (proposal_id, sap_id, email, phone_number, department, display_order, invitation_token, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            proposalId,
            member.sap_id,
            member.email,
            member.phone_number || null,
            member.department || null,
            canonicalMembers.findIndex(m => m.sap_id === member.sap_id),
            invitationToken
          ]
        );
        newlyAddedMembers.push({ ...member, invitation_token: invitationToken });
      }

      // 3. Update display order and info for existing members
      // FIX: If a member was previously rejected, reset them to pending and give new token
      for (let i = 0; i < membersToUpdate.length; i++) {
        const member = membersToUpdate[i];
        const existingData = existingMembers.find(m => m.sap_id === member.sap_id);

        let updateSql = 'UPDATE proposal_members SET email = ?, phone_number = ?, department = ?, display_order = ?';
        let updateParams = [
          member.email,
          member.phone_number || null,
          member.department || null,
          canonicalMembers.findIndex(m => m.sap_id === member.sap_id)
        ];

        // Reset if rejected
        if (existingData && existingData.status === 'rejected') {
          const newToken = crypto.randomBytes(32).toString('hex');
          updateSql += ', status = "pending", invitation_token = ?';
          updateParams.push(newToken);

          // Add to newlyAddedMembers so they get an invitation email
          newlyAddedMembers.push({
            ...member,
            invitation_token: newToken
          });
        }

        updateSql += ' WHERE proposal_id = ? AND sap_id = ?';
        updateParams.push(proposalId, member.sap_id);

        await connection.execute(updateSql, updateParams);
      }

      // 4. Special logic for revision_requested: if new or reset members are pending, 
      // change status to pending_member_confirmation and send invitations immediately
      if (['revision_requested', 'draft'].includes(proposal.status) && newlyAddedMembers.length > 0) {
        await connection.execute(
          'UPDATE proposals SET status = "pending_member_confirmation" WHERE id = ?',
          [proposalId]
        );

        // We'll send emails after commit to ensure data is saved
        req.newlyAddedMembers = newlyAddedMembers;
        req.shouldSendInvitations = true;
      }
    }

    // Log activity with only allowed updated fields
    await logProposalActivity(connection, {
      proposalId: proposalId,
      userId: studentId,
      userRole: req.user.role,
      action: 'PROPOSAL_UPDATED',
      oldValue: proposal,
      newValue: {
        project_title,
        project_description,
        supervisor_id,
        members,
        status: req.shouldSendInvitations ? 'pending_member_confirmation' : proposal.status
      },
      ipAddress: req.ip
    });

    await connection.commit();

    // Send invitations if needed (after commit)
    if (req.shouldSendInvitations && req.newlyAddedMembers) {
      const [leadInfo] = await connection.execute('SELECT username FROM users WHERE id = ?', [proposal.student_id]);
      const leadName = leadInfo[0]?.username || 'Team Lead';

      for (const member of req.newlyAddedMembers) {
        sendProposalNotification({
          type: 'GROUP_INVITATION',
          to: member.email,
          studentName: '',
          leadStudentName: leadName,
          projectTitle: project_title || proposal.project_title,
          proposalId: proposalId,
          token: member.invitation_token
        }).catch(err => console.error('Invitation email error:', err));
      }
    }

    res.status(200).json({
      success: true,
      message: req.shouldSendInvitations
        ? 'Proposal updated and invitations sent to new members. Status changed to pending confirmation.'
        : 'Proposal updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Update proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update proposal',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// STUDENT: UPLOAD PROPOSAL PDF
// ============================================
exports.uploadProposalPDF = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const studentId = req.user.id;

    // Verify ownership
    const [proposal] = await connection.execute(
      'SELECT student_id, status, proposal_pdf FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalData = proposal[0];

    // Verify ownership or group membership (accepted members only)
    const [memberRows] = await connection.execute(
      'SELECT id FROM proposal_members WHERE proposal_id = ? AND (sap_id = ? OR email = ?) AND status = "accepted"',
      [proposalId, req.user.sap_id || '', req.user.email]
    );
    const isMember = memberRows.length > 0;

    if (proposalData.student_id !== studentId && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the Team Lead or accepted group members can upload files.'
      });
    }

    if (proposal[0].status !== 'draft' && proposal[0].status !== 'revision_requested') {
      return res.status(400).json({
        success: false,
        message: 'Cannot upload PDF for submitted proposals'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = `/uploads/proposals/${req.file.filename}`;

    // Delete old PDF if exists
    if (proposal[0].proposal_pdf) {
      const oldFilePath = path.join(__dirname, '../../', proposal[0].proposal_pdf);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update proposal with PDF path
    await connection.execute(
      'UPDATE proposals SET proposal_pdf = ? WHERE id = ?',
      [filePath, proposalId]
    );

    // Log activity
    await logProposalActivity(connection, {
      proposalId: proposalId,
      userId: studentId,
      userRole: req.user.role,
      action: 'PDF_UPLOADED',
      newValue: { file_path: filePath },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'PDF uploaded successfully',
      data: { file_path: filePath }
    });

  } catch (error) {
    console.error('Upload PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload PDF',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// STUDENT: SUBMIT PROPOSAL
// ============================================
exports.submitProposal = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const studentId = req.user.id;

    await connection.beginTransaction();

    // Get proposal details
    const [proposal] = await connection.execute(
      `SELECT p.*, u.email as supervisor_email, u.username as supervisor_name
       FROM proposals p
       LEFT JOIN users u ON p.supervisor_id = u.id
       WHERE p.id = ?`,
      [proposalId]
    );

    if (proposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalData = proposal[0];

    // Verify ownership or group membership (accepted members only)
    const [memberRows] = await connection.execute(
      'SELECT id FROM proposal_members WHERE proposal_id = ? AND (sap_id = ? OR email = ?) AND status = "accepted"',
      [proposalId, req.user.sap_id || '', req.user.email]
    );
    const isMember = memberRows.length > 0;

    if (proposalData.student_id !== studentId && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the Team Lead or accepted group members can submit the proposal.'
      });
    }

    // Verify status
    if (!['draft', 'revision_requested', 'pending_member_confirmation'].includes(proposalData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Proposal has already been submitted and is under review'
      });
    }

    // Verify PDF uploaded
    if (!proposalData.proposal_pdf) {
      return res.status(400).json({
        success: false,
        message: 'Please upload proposal PDF before submitting'
      });
    }

    // Verify supervisor selected
    if (!proposalData.supervisor_id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a supervisor'
      });
    }

    // Check if supervisor is still available
    const [supervisorRows] = await connection.execute(
      'SELECT current_supervisees, max_supervisees, is_accepting_proposals FROM users WHERE id = ?',
      [proposalData.supervisor_id]
    );

    if (supervisorRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected supervisor not found'
      });
    }

    const supervisor = supervisorRows[0];

    // Calculate total students in this proposal (lead + accepted members)
    const [acceptedMembers] = await connection.execute(
      'SELECT COUNT(*) as count FROM proposal_members WHERE proposal_id = ? AND status = "accepted"',
      [proposalId]
    );
    const proposalSize = 1 + (acceptedMembers[0].count || 0);

    if (supervisor.is_accepting_proposals === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected supervisor is no longer accepting new proposals'
      });
    }

    if (supervisor.current_supervisees + proposalSize > supervisor.max_supervisees) {
      return res.status(400).json({
        success: false,
        message: `Selected supervisor does not have enough slots available. Needed: ${proposalSize}, Available: ${supervisor.max_supervisees - supervisor.current_supervisees}`
      });
    }

    // Check if there are group members who haven't confirmed yet
    const [pendingMembers] = await connection.execute(
      'SELECT id, email, sap_id, invitation_token FROM proposal_members WHERE proposal_id = ? AND status = "pending"',
      [proposalId]
    );

    let nextStatus = 'submitted';
    let message = 'Proposal submitted successfully';

    // If there are pending members, go to confirmation flow
    if (pendingMembers.length > 0) {
      nextStatus = 'pending_member_confirmation';
      message = 'Proposal saved successfully. Waiting for remaining group members to confirm.';
    }

    // Update proposal status
    await connection.execute(
      `UPDATE proposals 
       SET status = ?, submission_date = NOW() 
       WHERE id = ?`,
      [nextStatus, proposalId]
    );

    // Get lead student name for notifications
    const [leadInfo] = await connection.execute(
      'SELECT username FROM users WHERE id = ?',
      [proposalData.student_id]
    );
    const leadName = leadInfo[0]?.username || 'Team Lead';

    // Log activity
    await logProposalActivity(connection, {
      proposalId: proposalId,
      userId: studentId,
      userRole: req.user.role,
      action: nextStatus === 'submitted' ? 'PROPOSAL_SUBMITTED' : 'INVITATION_SENT',
      oldValue: { status: proposalData.status },
      newValue: { status: nextStatus },
      ipAddress: req.ip
    });

    await connection.commit();

    if (nextStatus === 'submitted') {
      // Send email notification to supervisor (async)
      sendProposalNotification({
        type: 'PROPOSAL_SUBMITTED',
        to: proposalData.supervisor_email,
        supervisorName: proposalData.supervisor_name,
        studentName: leadName,
        projectTitle: proposalData.project_title,
        proposalId: proposalId
      }).catch(err => console.error('Email notification error:', err));
    } else {
      // Send invitations to pending members
      for (const member of pendingMembers) {
        sendProposalNotification({
          type: 'GROUP_INVITATION',
          to: member.email,
          studentName: '',
          leadStudentName: leadName,
          projectTitle: proposalData.project_title,
          proposalId: proposalId,
          token: member.invitation_token
        }).catch(err => console.error('Invitation email error:', err));
      }
    }

    res.status(200).json({
      success: true,
      message: message
    });

  } catch (error) {
    await connection.rollback();
    console.error('Submit proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit proposal',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// STUDENT: DELETE PROPOSAL
// ============================================
exports.deleteProposal = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const studentId = req.user.id;

    await connection.beginTransaction();

    // Get proposal
    const [proposal] = await connection.execute(
      'SELECT * FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalData = proposal[0];

    // Verify ownership or group membership (accepted members only)
    const [memberRows] = await connection.execute(
      'SELECT id FROM proposal_members WHERE proposal_id = ? AND (sap_id = ? OR email = ?) AND status = "accepted"',
      [proposalId, req.user.sap_id || '', req.user.email]
    );
    const isMember = memberRows.length > 0;

    if (proposalData.student_id !== studentId && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the Team Lead or accepted group members can delete the proposal.'
      });
    }

    if (!['draft', 'pending_member_confirmation'].includes(proposalData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only drafts or pending confirmation proposals can be deleted'
      });
    }

    // Delete PDF file if exists
    if (proposalData.proposal_pdf) {
      const filePath = path.join(__dirname, '../../', proposalData.proposal_pdf);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete proposal (cascade will delete members and logs)
    await connection.execute(
      'DELETE FROM proposals WHERE id = ?',
      [proposalId]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Delete proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete proposal',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: DELETE PROPOSAL (FULL AUTHORITY)
// ============================================
exports.adminDeleteProposal = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }

    await connection.beginTransaction();

    const [proposal] = await connection.execute(
      'SELECT id, proposal_pdf, supervisor_id, status FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (!proposal || proposal.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalData = proposal[0];

    // FIX: If proposal was approved, decrement supervisor workload
    if (proposalData.status === 'approved' && proposalData.supervisor_id) {
      // Calculate total students in group (lead + accepted members)
      const [members] = await connection.execute(
        'SELECT COUNT(*) as count FROM proposal_members WHERE proposal_id = ? AND status = "accepted"',
        [proposalId]
      );
      const studentCount = 1 + (members[0].count || 0);

      await connection.execute(
        'UPDATE users SET current_supervisees = GREATEST(0, current_supervisees - ?) WHERE id = ?',
        [studentCount, proposalData.supervisor_id]
      );
    }

    if (proposalData.proposal_pdf) {
      const filePath = path.join(__dirname, '../../', proposalData.proposal_pdf);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await connection.execute(
      'DELETE FROM proposals WHERE id = ?',
      [proposalId]
    );

    await logAudit({
      userId: req.user.id,
      action: AuditActions.PROPOSAL_DELETED,
      entityType: 'proposal',
      entityId: proposalId,
      details: { proposalId: proposalId },
      ipAddress: req.ip
    });

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Admin delete proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete proposal',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// SUPERVISOR: GET ASSIGNED PROPOSALS
// ============================================
exports.getSupervisorProposals = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const supervisorId = req.user.id;
    const { status, supervisor_id: querySupervisorId } = req.query;

    const parsedQuerySupervisorId = querySupervisorId ? parseInt(querySupervisorId, 10) : null;
    if (querySupervisorId && isNaN(parsedQuerySupervisorId)) {
      return res.status(400).json({ success: false, message: 'Invalid supervisor ID provided.' });
    }

    let query = `
      SELECT 
        p.*,
        u.username as student_name,
        u.email as student_email,
        COUNT(pm.id) as member_count
      FROM proposals p
      LEFT JOIN users u ON p.student_id = u.id
      LEFT JOIN proposal_members pm ON p.id = pm.proposal_id
      WHERE p.supervisor_id = ?
    `;

    const params = [supervisorId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    // If querySupervisorId is provided, and it's different from the authenticated supervisorId
    // (e.g., admin querying specific supervisor's proposals), then use it.
    // Otherwise, assume the authenticated supervisorId.
    if (parsedQuerySupervisorId && parsedQuerySupervisorId !== supervisorId) {
      query += ' AND p.supervisor_id = ?';
      params.splice(0, 1, parsedQuerySupervisorId); // Replace supervisorId with querySupervisorId
    } else {
      query += ` AND p.status NOT IN ('draft', 'pending_member_confirmation')`;
    }

    query += ' GROUP BY p.id ORDER BY p.submission_date DESC';

    const [proposals] = await connection.execute(query, params);

    res.status(200).json({
      success: true,
      data: proposals
    });

  } catch (error) {
    console.error('Get supervisor proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve proposals',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// SUPERVISOR: APPROVE PROPOSAL
// ============================================
exports.approveProposal = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const supervisorId = req.user.id;

    await connection.beginTransaction();

    // Get proposal
    const [proposal] = await connection.execute(
      `SELECT p.*, u.email as student_email, u.username as student_name
       FROM proposals p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.id = ?`,
      [proposalId]
    );

    if (proposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalData = proposal[0];

    // Verify supervisor
    if (proposalData.supervisor_id !== supervisorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check status
    if (proposalData.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve submitted proposals'
      });
    }

    // Update status
    await connection.execute(
      `UPDATE proposals 
       SET status = 'approved', response_date = NOW() 
       WHERE id = ?`,
      [proposalId]
    );

    // Calculate total accepted members + 1 (the leader) to increment workload
    const [memberCountResult] = await connection.execute(
      `SELECT COUNT(*) as count FROM proposal_members WHERE proposal_id = ? AND status = 'accepted'`,
      [proposalId]
    );
    const totalStudents = 1 + (memberCountResult[0].count || 0);

    // Increment supervisor workload based on accepted group size
    await connection.execute(
      'UPDATE users SET current_supervisees = current_supervisees + ? WHERE id = ?',
      [totalStudents, proposalData.supervisor_id]
    );

    // Check workload thresholds
    const [supervisorData] = await connection.execute(
      'SELECT current_supervisees, max_supervisees FROM users WHERE id = ?',
      [proposalData.supervisor_id]
    );

    if (supervisorData.length > 0) {
      const { current_supervisees, max_supervisees } = supervisorData[0];
      const limit = max_supervisees || 5;

      if (current_supervisees > limit) {
        await logAudit({
          userId: proposalData.supervisor_id,
          action: AuditActions.CAPACITY_EXCEEDED,
          entityType: 'supervisor',
          entityId: proposalData.supervisor_id,
          details: { current: current_supervisees, max: limit, proposalId: proposalId },
          ipAddress: req.ip
        });
      } else if (current_supervisees >= limit * 0.8) {
        await logAudit({
          userId: proposalData.supervisor_id,
          action: AuditActions.CAPACITY_REACHED,
          entityType: 'supervisor',
          entityId: proposalData.supervisor_id,
          details: { current: current_supervisees, max: limit, proposalId: proposalId },
          ipAddress: req.ip
        });
      }
    }

    // Log activity
    await logProposalActivity(connection, {
      proposalId: proposalId,
      userId: supervisorId,
      userRole: req.user.role,
      action: 'PROPOSAL_APPROVED',
      oldValue: { status: 'submitted' },
      newValue: { status: 'approved' },
      ipAddress: req.ip
    });

    await connection.commit();

    // Send email notification to student
    sendProposalNotification({
      type: 'PROPOSAL_APPROVED',
      to: proposalData.student_email,
      studentName: proposalData.student_name,
      supervisorName: req.user.username,
      projectTitle: proposalData.project_title,
      proposalId: proposalId
    }).catch(err => console.error('Email notification error:', err));

    res.status(200).json({
      success: true,
      message: 'Proposal approved successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Approve proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve proposal',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// SUPERVISOR: REJECT PROPOSAL
// ============================================
exports.rejectProposal = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const { feedback } = req.body;
    const supervisorId = req.user.id;

    await connection.beginTransaction();

    // Get proposal
    const [proposal] = await connection.execute(
      `SELECT p.*, u.email as student_email, u.username as student_name
       FROM proposals p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.id = ?`,
      [proposalId]
    );

    if (proposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalData = proposal[0];

    // Verify supervisor
    if (proposalData.supervisor_id !== supervisorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check status
    if (proposalData.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject submitted proposals'
      });
    }

    // Update status and add feedback
    await connection.execute(
      `UPDATE proposals 
       SET status = 'rejected', 
           supervisor_feedback = ?, 
           response_date = NOW() 
       WHERE id = ?`,
      [feedback, proposalId]
    );

    // Log activity
    await logProposalActivity(connection, {
      proposalId: proposalId,
      userId: supervisorId,
      userRole: req.user.role,
      action: 'PROPOSAL_REJECTED',
      oldValue: { status: 'submitted' },
      newValue: { status: 'rejected', feedback },
      ipAddress: req.ip
    });

    await connection.commit();

    // Send email notification to student
    sendProposalNotification({
      type: 'PROPOSAL_REJECTED',
      to: proposalData.student_email,
      studentName: proposalData.student_name,
      supervisorName: req.user.username,
      projectTitle: proposalData.project_title,
      proposalId: proposalId,
      feedback: feedback
    }).catch(err => console.error('Email notification error:', err));

    res.status(200).json({
      success: true,
      message: 'Proposal rejected'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Reject proposal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject proposal',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
// ============================================
// SUPERVISOR: REQUEST REVISION
// ============================================
exports.requestRevision = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.id, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }
    const { feedback } = req.body;
    const supervisorId = req.user.id;

    await connection.beginTransaction();

    // Get proposal
    const [proposal] = await connection.execute(
      `SELECT p.*, u.email as student_email, u.username as student_name
       FROM proposals p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.id = ?`,
      [proposalId]
    );

    if (proposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    const proposalData = proposal[0];

    // Verify supervisor
    if (proposalData.supervisor_id !== supervisorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check status
    if (proposalData.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Can only request revision for submitted proposals'
      });
    }

    // Update status and add feedback
    await connection.execute(
      `UPDATE proposals 
       SET status = 'revision_requested', 
           supervisor_feedback = ?, 
           response_date = NOW() 
       WHERE id = ?`,
      [feedback, proposalId]
    );

    // Log activity
    await logProposalActivity(connection, {
      proposalId: proposalId,
      userId: supervisorId,
      userRole: req.user.role,
      action: 'REVISION_REQUESTED',
      oldValue: { status: 'submitted' },
      newValue: { status: 'revision_requested', feedback },
      ipAddress: req.ip
    });

    await connection.commit();

    // Send email notification to student
    sendProposalNotification({
      type: 'REVISION_REQUESTED',
      to: proposalData.student_email,
      studentName: proposalData.student_name,
      supervisorName: req.user.username,
      projectTitle: proposalData.project_title,
      proposalId: proposalId,
      feedback: feedback
    }).catch(err => console.error('Email notification error:', err));

    res.status(200).json({
      success: true,
      message: 'Revision requested successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Request revision error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request revision',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// COMMON: GET AVAILABLE SUPERVISORS
// ============================================
exports.getAvailableSupervisors = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const [supervisors] = await connection.execute(
      `SELECT 
        id,
        username,
        email,
        department,
        max_supervisees,
        current_supervisees,
        is_accepting_proposals,
        availability_status,
        (max_supervisees - current_supervisees) as available_slots
       FROM users
       WHERE role = 'Teacher' 
       AND is_active = 1
       AND (availability_status IS NULL OR availability_status != 'Unavailable')
       ORDER BY username`
    );

    res.status(200).json({
      success: true,
      data: supervisors
    });

  } catch (error) {
    console.error('Get available supervisors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supervisors',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

exports.downloadTemplate = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Get active template
    const [templates] = await connection.execute(
      'SELECT * FROM proposal_templates WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No template available'
      });
    }

    const template = templates[0];
    const filePath = path.join(__dirname, '../../', template.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('Template file not found at path:', filePath);
      return res.status(404).json({
        success: false,
        message: 'Template file not found'
      });
    }

    // Set proper headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${template.template_name}.pdf"`);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Failed to download template',
          error: error.message
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Download template error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to download template',
        error: error.message
      });
    }
  } finally {
    connection.release();
  }
};

exports.getCurrentTemplate = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Get active template (without file content, just metadata)
    const [templates] = await connection.execute(
      `SELECT 
        id,
        template_name,
        file_path,
        uploaded_by,
        created_at,
        is_active
       FROM proposal_templates 
       WHERE is_active = 1 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No template available'
      });
    }

    res.status(200).json({
      success: true,
      data: templates[0]
    });

  } catch (error) {
    console.error('Get current template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve template',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: UPLOAD TEMPLATE
// ============================================
exports.uploadTemplate = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const adminId = req.user.id;
    const { template_name } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    await connection.beginTransaction();

    const filePath = `/uploads/proposals/${req.file.filename}`;
    const displayName = template_name || 'Proposal Template';

    // Deactivate old templates
    await connection.execute(
      'UPDATE proposal_templates SET is_active = 0'
    );

    // Insert new template
    const [result] = await connection.execute(
      `INSERT INTO proposal_templates 
       (template_name, file_path, uploaded_by, is_active) 
       VALUES (?, ?, ?, 1)`,
      [displayName, filePath, adminId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Template uploaded successfully',
      data: {
        id: result.insertId,
        template_name: displayName,
        file_path: filePath
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Upload template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload template',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: DELETE TEMPLATE
// ============================================
exports.deleteTemplate = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Template ID is required and must be a valid number.' });
    }

    // Get template
    const [templates] = await connection.execute(
      'SELECT * FROM proposal_templates WHERE id = ?',
      [templateId]
    );

    if (templates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const template = templates[0];

    // Delete file from disk
    const filePath = path.join(__dirname, '../../', template.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await connection.execute(
      'DELETE FROM proposal_templates WHERE id = ?',
      [templateId]
    );

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: GET ALL PROPOSALS
// ============================================
exports.getAllProposals = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { status, supervisor_id } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    const parsedSupervisorId = supervisor_id ? parseInt(supervisor_id, 10) : null;
    if (supervisor_id && isNaN(parsedSupervisorId)) {
      return res.status(400).json({ success: false, message: 'Invalid supervisor ID provided.' });
    }

    let query = `
      SELECT 
        p.*,
        student.username as student_name,
        student.email as student_email,
        supervisor.username as supervisor_name,
        supervisor.email as supervisor_email,
        COUNT(pm.id) as member_count
      FROM proposals p
      LEFT JOIN users student ON p.student_id = student.id
      LEFT JOIN users supervisor ON p.supervisor_id = supervisor.id
      LEFT JOIN proposal_members pm ON p.id = pm.proposal_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (parsedSupervisorId) {
      query += ' AND p.supervisor_id = ?';
      params.push(parsedSupervisorId);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [proposals] = await connection.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM proposals WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (parsedSupervisorId) {
      countQuery += ' AND supervisor_id = ?';
      countParams.push(parsedSupervisorId);
    }

    const [countResult] = await connection.execute(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: proposals,
      pagination: {
        total: countResult[0].total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get all proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve proposals',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: GET PROPOSAL ANALYTICS
// ============================================
exports.getProposalAnalytics = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Total proposals
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM proposals'
    );

    // Proposals by status
    const [byStatus] = await connection.execute(
      `SELECT status, COUNT(*) as count 
       FROM proposals 
       GROUP BY status`
    );

    // Proposals by supervisor
    const [bySupervisor] = await connection.execute(
      `SELECT 
        u.username as supervisor_name,
        u.id as supervisor_id,
        COUNT(p.id) as proposal_count,
        SUM(CASE WHEN p.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN p.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN p.status = 'submitted' THEN 1 ELSE 0 END) as pending_count
       FROM users u
       LEFT JOIN proposals p ON u.id = p.supervisor_id
       WHERE u.role = 'Teacher'
       GROUP BY u.id, u.username
       ORDER BY proposal_count DESC`
    );

    // Recent submissions (last 30 days)
    const [recentSubmissions] = await connection.execute(
      `SELECT 
        DATE(submission_date) as date,
        COUNT(*) as count
       FROM proposals
       WHERE submission_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(submission_date)
       ORDER BY date DESC`
    );

    // Average response time (in days)
    const [avgResponseTime] = await connection.execute(
      `SELECT 
        AVG(DATEDIFF(response_date, submission_date)) as avg_days
       FROM proposals
       WHERE response_date IS NOT NULL 
       AND submission_date IS NOT NULL`
    );

    // Supervisor workload
    const [supervisorWorkload] = await connection.execute(
      `SELECT 
        id,
        username,
        email,
        department,
        max_supervisees,
        current_supervisees,
        is_accepting_proposals,
        (max_supervisees - current_supervisees) as available_slots
       FROM users
       WHERE role = 'Teacher'
       ORDER BY current_supervisees DESC`
    );

    res.status(200).json({
      success: true,
      data: {
        total: totalResult[0].total,
        byStatus,
        bySupervisor,
        recentSubmissions,
        avgResponseTime: Math.round(avgResponseTime[0].avg_days || 0),
        supervisorWorkload
      }
    });

  } catch (error) {
    console.error('Get proposal analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: GET PROPOSAL ACTIVITY LOGS
// ============================================
exports.getProposalActivityLogs = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const proposalId = parseInt(req.params.proposalId, 10);
    if (isNaN(proposalId)) {
      return res.status(400).json({ success: false, message: 'Proposal ID is required and must be a valid number.' });
    }

    // Verify proposal exists
    const [proposal] = await connection.execute(
      'SELECT id, project_title FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Get activity logs
    const [logs] = await connection.execute(
      `SELECT 
        pal.*,
        u.username,
        u.email
       FROM proposal_activity_logs pal
       LEFT JOIN users u ON pal.user_id = u.id
       WHERE pal.proposal_id = ?
       ORDER BY pal.created_at DESC`,
      [proposalId]
    );

    res.status(200).json({
      success: true,
      data: {
        proposal: proposal[0],
        logs
      }
    });

  } catch (error) {
    console.error('Get proposal activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============================================
// STUDENT: CONFIRM MEMBER INVITATION
// ============================================
exports.confirmMemberInvitation = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { token } = req.query;
    const userId = req.user.id;
    const userSapId = req.user.sap_id || '';
    const userEmail = req.user.email;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is missing.'
      });
    }

    await connection.beginTransaction();

    // 1. Find the member by token and ensure it belongs to the current user
    const [members] = await connection.execute(
      `SELECT pm.*, p.student_id, p.status as proposal_status, p.project_title, p.batch_id
       FROM proposal_members pm
       JOIN proposals p ON pm.proposal_id = p.id
       WHERE pm.invitation_token = ? AND (pm.sap_id = ? OR pm.email = ?)`
      , [token, userSapId, userEmail]
    );

    if (members.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation token, or not intended for this user.'
      });
    }

    const member = members[0];

    // Check if the member has already accepted or been rejected
    if (member.status === 'accepted') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already accepted this invitation.'
      });
    }

    if (member.status === 'rejected') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'This invitation has already been rejected.'
      });
    }

    // Check if user is already in another active proposal
    const conflict = await isUserInAnyActiveProposal(connection, {
      userId,
      sapId: userSapId,
      email: userEmail,
      excludeProposalId: member.proposal_id
    });
    if (conflict) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You are already part of another active proposal and cannot join this one.'
      });
    }

    // Update member status to accepted
    await connection.execute(
      `UPDATE proposal_members
       SET status = 'accepted', invitation_token = NULL
       WHERE id = ?`
      , [member.id]
    );

    // Update proposal status if it was pending_member_confirmation and all members are now accepted
    const [pendingMembersCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM proposal_members WHERE proposal_id = ? AND status = 'pending'`
      , [member.proposal_id]
    );

    if (pendingMembersCount[0].count === 0 && member.proposal_status === 'pending_member_confirmation') {
      await connection.execute(
        `UPDATE proposals SET status = 'submitted', submission_date = NOW() WHERE id = ?`
        , [member.proposal_id]
      );

      // Get supervisor info for email
      const [supervisorInfo] = await connection.execute(
        `SELECT u.username, u.email FROM proposals p JOIN users u ON p.supervisor_id = u.id WHERE p.id = ?`
        , [member.proposal_id]
      );
      const supervisorName = supervisorInfo[0]?.username || 'Supervisor';
      const supervisorEmail = supervisorInfo[0]?.email;

      // Send email to supervisor
      if (supervisorEmail) {
        sendProposalNotification({
          type: 'PROPOSAL_SUBMITTED',
          to: supervisorEmail,
          supervisorName: supervisorName,
          studentName: req.user.username, // The user accepting the invitation
          projectTitle: member.project_title,
          proposalId: member.proposal_id
        }).catch(err => console.error('Email notification error:', err));
      }
    }

    await logProposalActivity(connection, {
      proposalId: member.proposal_id,
      userId: userId,
      userRole: req.user.role,
      action: 'MEMBER_ACCEPTED_INVITATION',
      newValue: { member_sap_id: member.sap_id, member_email: member.email },
      ipAddress: req.ip
    });

    await connection.commit();

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully! Your proposal status has been updated.'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Confirm member invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm invitation',
      error: error.message
    });
  } finally {
    connection.release();
  }
};
