const { pool } = require('../config/database');
const { logActivity } = require('../utils/logger');

// ============================================
// ADMIN: CREATE PROJECT
// ============================================
exports.createProject = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      title,
      year,
      abstract,
      department,
      supervisor_name,
      supervisor_id,
      technology_type,
      final_grade,
      keywords,
      student_names
    } = req.body;

    // Validation
    if (!title || !year || !abstract || !department || !supervisor_name) {
      return res.status(400).json({
        success: false,
        message: 'Title, year, abstract, department, and supervisor name are required'
      });
    }

    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    // Validate supervisor_id if provided (must exist in users table)
    let validatedSupervisorId = toNullIfEmpty(supervisor_id);
    if (validatedSupervisorId !== null) {
      const [supervisorExists] = await connection.execute(
        'SELECT id FROM users WHERE id = ?',
        [validatedSupervisorId]
      );
      
      // If supervisor doesn't exist, set to NULL instead of failing
      if (supervisorExists.length === 0) {
        console.warn(`Supervisor ID ${validatedSupervisorId} not found in users table. Setting to NULL.`);
        validatedSupervisorId = null;
      }
    }

    // Clean and prepare data
    const cleanedData = {
      title: title.trim(),
      year: year,
      abstract: abstract.trim(),
      department: department.trim(),
      supervisor_name: supervisor_name.trim(),
      supervisor_id: validatedSupervisorId,
      technology_type: toNullIfEmpty(technology_type),
      final_grade: toNullIfEmpty(final_grade),
      keywords: toNullIfEmpty(keywords),
      student_names: toNullIfEmpty(student_names)
    };

    const [result] = await connection.execute(
      `INSERT INTO archived_projects 
       (title, year, abstract, department, supervisor_name, supervisor_id, 
        technology_type, final_grade, keywords, student_names, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanedData.title,
        cleanedData.year,
        cleanedData.abstract,
        cleanedData.department,
        cleanedData.supervisor_name,
        cleanedData.supervisor_id,
        cleanedData.technology_type,
        cleanedData.final_grade,
        cleanedData.keywords,
        cleanedData.student_names,
        req.user.id
      ]
    );

    await logActivity(
      req.user.id,
      'CREATE_PROJECT',
      'archived_projects',
      result.insertId,
      null,
      { title: cleanedData.title, year: cleanedData.year, department: cleanedData.department }
    );

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Create project error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: BULK IMPORT PROJECTS (CSV/Excel)
// ============================================
exports.bulkImportProjects = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { projects } = req.body; // Array of project objects

    if (!Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or empty projects array'
      });
    }

    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    // Validation results
    const validationResults = {
      total: projects.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      try {
        // Validate required fields
        if (!project.title || !project.year || !project.abstract || 
            !project.department || !project.supervisor_name) {
          throw new Error('Missing required fields');
        }

        // Trim required fields
        const title = project.title.trim();
        const abstract = project.abstract.trim();
        const department = project.department.trim();
        const supervisor_name = project.supervisor_name.trim();

        // Additional validation
        if (title.length < 5) {
          throw new Error('Title must be at least 5 characters');
        }

        if (abstract.length < 50) {
          throw new Error('Abstract must be at least 50 characters');
        }

        // Validate year format
        if (!/^\d{4}$/.test(project.year)) {
          throw new Error('Invalid year format (must be 4 digits)');
        }

        const year = parseInt(project.year);
        if (year < 1900 || year > 2100) {
          throw new Error('Year must be between 1900 and 2100');
        }

        // Validate supervisor_id if provided (must exist in users table)
        let validatedSupervisorId = toNullIfEmpty(project.supervisor_id);
        if (validatedSupervisorId !== null) {
          const [supervisorExists] = await connection.execute(
            'SELECT id FROM users WHERE id = ?',
            [validatedSupervisorId]
          );
          
          // If supervisor doesn't exist, set to NULL instead of failing
          if (supervisorExists.length === 0) {
            console.warn(`Row ${i + 1}: Supervisor ID ${validatedSupervisorId} not found. Setting to NULL.`);
            validatedSupervisorId = null;
          }
        }

        // Insert project with properly cleaned data
        await connection.execute(
          `INSERT INTO archived_projects 
           (title, year, abstract, department, supervisor_name, supervisor_id,
            technology_type, final_grade, keywords, student_names, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            title,
            year,
            abstract,
            department,
            supervisor_name,
            validatedSupervisorId,
            toNullIfEmpty(project.technology_type),
            toNullIfEmpty(project.final_grade),
            toNullIfEmpty(project.keywords),
            toNullIfEmpty(project.student_names),
            req.user.id
          ]
        );

        validationResults.successful++;
      } catch (error) {
        validationResults.failed++;
        validationResults.errors.push({
          row: i + 1,
          title: project.title || 'Unknown',
          error: error.message
        });
        console.error(`Bulk import error at row ${i + 1}:`, error.message);
      }
    }

    await connection.commit();

    await logActivity(
      req.user.id,
      'BULK_IMPORT_PROJECTS',
      'archived_projects',
      null,
      null,
      validationResults
    );

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${validationResults.successful} successful, ${validationResults.failed} failed`,
      data: validationResults
    });
  } catch (error) {
    await connection.rollback();
    console.error('Bulk import error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: 'Failed to import projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// ============================================
// SEARCH PROJECTS (All Roles)
// ============================================
// ============================================
// SEARCH PROJECTS (All Roles) - FIXED VERSION
// ============================================
// CRITICAL FIXES:
// 1. Allow empty WHERE clause to load ALL projects
// 2. Simplified parameter handling for count query
// 3. Better error logging
exports.searchProjects = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      keyword,
      supervisor,
      year,
      department,
      technology,
      grade,
      operator = 'AND',
      page = 1,
      limit = 10,
      sortBy = 'relevance'
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (keyword) {
      conditions.push(`(
        title LIKE ? OR 
        abstract LIKE ? OR 
        keywords LIKE ? OR
        student_names LIKE ?
      )`);
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern, keywordPattern);
    }

    if (supervisor) {
      conditions.push('supervisor_name LIKE ?');
      params.push(`%${supervisor}%`);
    }

    if (year) {
      conditions.push('year = ?');
      params.push(year);
    }

    if (department) {
      conditions.push('department = ?');
      params.push(department);
    }

    if (technology) {
      conditions.push('technology_type LIKE ?');
      params.push(`%${technology}%`);
    }

    if (grade) {
      conditions.push('final_grade = ?');
      params.push(grade);
    }

    // CRITICAL FIX: Allow empty WHERE clause to load all projects
    // Previous bug: The function required at least one filter
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(` ${operator} `)}`
      : '';

    // Order by clause
    let orderByClause;
    switch (sortBy) {
      case 'year':
        orderByClause = 'ORDER BY year DESC, created_at DESC';
        break;
      case 'title':
        orderByClause = 'ORDER BY title ASC';
        break;
      case 'relevance':
      default:
        orderByClause = keyword
          ? `ORDER BY 
             CASE 
               WHEN title LIKE ? THEN 1
               WHEN abstract LIKE ? THEN 2
               ELSE 3
             END, year DESC`
          : 'ORDER BY year DESC, created_at DESC';
        if (keyword) {
          params.push(`%${keyword}%`, `%${keyword}%`);
        }
        break;
    }

    // CRITICAL FIX: Simplified parameter handling for count query
    // Previous bug: Complex slicing logic caused incorrect parameter arrays
    const countQuery = `SELECT COUNT(*) as total FROM archived_projects ${whereClause}`;
    let countParams = [];
    
    // Build correct param array for count query
    if (conditions.length > 0) {
      let paramIndex = 0;
      conditions.forEach((condition) => {
        if (condition.includes('LIKE ? OR')) {
          // Keyword search uses 4 parameters
          countParams.push(...params.slice(paramIndex, paramIndex + 4));
          paramIndex += 4;
        } else {
          // Other filters use 1 parameter
          countParams.push(params[paramIndex]);
          paramIndex += 1;
        }
      });
    }
    
    const [countResult] = await connection.execute(countQuery, countParams);
    const total = countResult[0].total;

    // Get paginated results
    const offset = (page - 1) * limit;
    const searchQuery = `
      SELECT 
        id,
        title,
        year,
        SUBSTRING(abstract, 1, 200) as abstract_preview,
        department,
        supervisor_name,
        technology_type,
        final_grade,
        keywords,
        student_names,
        created_at
      FROM archived_projects
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, parseInt(limit), parseInt(offset)];
    const [projects] = await connection.execute(searchQuery, finalParams);

    // DEBUG LOGGING (remove after testing)
    console.log('Search Debug Info:');
    console.log('- Total projects in DB:', total);
    console.log('- Projects returned:', projects.length);
    console.log('- Filters applied:', { keyword, year, department, supervisor, technology, grade });
    console.log('- WHERE clause:', whereClause || 'NONE (loading all)');

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search projects error:', error);
    console.error('Error stack:', error.stack);
    console.error('Query params:', req.query);
    
    res.status(500).json({
      success: false,
      message: 'Failed to search projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
};

// ============================================
// GET PROJECT DETAILS (All Roles)
// ============================================
exports.getProjectDetails = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    const [projects] = await connection.execute(
      `SELECT * FROM archived_projects WHERE id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: projects[0]
    });
  } catch (error) {
    console.error('Get project details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details'
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: UPDATE PROJECT
// ============================================
exports.updateProject = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      title,
      year,
      abstract,
      department,
      supervisor_name,
      supervisor_id,
      technology_type,
      final_grade,
      keywords,
      student_names
    } = req.body;

    // Get old data for logging
    const [oldData] = await connection.execute(
      'SELECT * FROM archived_projects WHERE id = ?',
      [id]
    );

    if (oldData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await connection.execute(
      `UPDATE archived_projects 
       SET title = ?, year = ?, abstract = ?, department = ?,
           supervisor_name = ?, supervisor_id = ?, technology_type = ?,
           final_grade = ?, keywords = ?, student_names = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title,
        year,
        abstract,
        department,
        supervisor_name,
        supervisor_id || null,
        technology_type || null,
        final_grade || null,
        keywords || null,
        student_names || null,
        id
      ]
    );

    await logActivity(
      req.user.id,
      'UPDATE_PROJECT',
      'archived_projects',
      id,
      oldData[0],
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: DELETE PROJECT
// ============================================
exports.deleteProject = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Get project data before deletion
    const [project] = await connection.execute(
      'SELECT * FROM archived_projects WHERE id = ?',
      [id]
    );

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await connection.execute(
      'DELETE FROM archived_projects WHERE id = ?',
      [id]
    );

    await logActivity(
      req.user.id,
      'DELETE_PROJECT',
      'archived_projects',
      id,
      project[0],
      null
    );

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  } finally {
    connection.release();
  }
};

// ============================================
// ADMIN: GET PROJECT STATISTICS
// ============================================
exports.getProjectStats = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Total projects
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM archived_projects'
    );

    // Projects by year
    const [byYear] = await connection.execute(
      `SELECT year, COUNT(*) as count 
       FROM archived_projects 
       GROUP BY year 
       ORDER BY year DESC 
       LIMIT 10`
    );

    // Projects by department
    const [byDepartment] = await connection.execute(
      `SELECT department, COUNT(*) as count 
       FROM archived_projects 
       GROUP BY department 
       ORDER BY count DESC`
    );

    // Projects by technology
    const [byTechnology] = await connection.execute(
      `SELECT technology_type, COUNT(*) as count 
       FROM archived_projects 
       WHERE technology_type IS NOT NULL 
       GROUP BY technology_type 
       ORDER BY count DESC 
       LIMIT 10`
    );

    // Top supervisors
    const [topSupervisors] = await connection.execute(
      `SELECT supervisor_name, COUNT(*) as count 
       FROM archived_projects 
       GROUP BY supervisor_name 
       ORDER BY count DESC 
       LIMIT 10`
    );

    // Recent uploads
    const [recentUploads] = await connection.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM archived_projects 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`
    );

    res.status(200).json({
      success: true,
      data: {
        total: totalResult[0].total,
        byYear,
        byDepartment,
        byTechnology,
        topSupervisors,
        recentUploads
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  } finally {
    connection.release();
  }
};

// ============================================
// GET FILTER OPTIONS (All Roles)
// ============================================
exports.getFilterOptions = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get unique years
    const [years] = await connection.execute(
      `SELECT DISTINCT year FROM archived_projects ORDER BY year DESC`
    );

    // Get unique departments
    const [departments] = await connection.execute(
      `SELECT DISTINCT department FROM archived_projects ORDER BY department`
    );

    // Get unique technologies
    const [technologies] = await connection.execute(
      `SELECT DISTINCT technology_type 
       FROM archived_projects 
       WHERE technology_type IS NOT NULL 
       ORDER BY technology_type`
    );

    // Get unique grades
    const [grades] = await connection.execute(
      `SELECT DISTINCT final_grade 
       FROM archived_projects 
       WHERE final_grade IS NOT NULL 
       ORDER BY final_grade DESC`
    );

    res.status(200).json({
      success: true,
      data: {
        years: years.map(y => y.year),
        departments: departments.map(d => d.department),
        technologies: technologies.map(t => t.technology_type),
        grades: grades.map(g => g.final_grade)
      }
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve filter options'
    });
  } finally {
    connection.release();
  }
};