const { pool } = require('../config/database');

const getGroupMembers = async (groupId) => {
    try {
        const [results] = await pool.query(
            `SELECT u.id, u.name, u.email 
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?`,
            [groupId]
        );
        return results;
    } catch (error) {
        console.error('Failed to get group members:', error);
        return [];
    }
};

module.exports = {
    getGroupMembers
};