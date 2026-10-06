const pool = require("../db");

const createTeam = async (req, res) => {
    try {
        const { organization_id, name } = req.body;
        const userId = req.user.userId;

        if (!organization_id || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Organization ID and team name are required"
            });
        }

        const [members] = await pool.query(
            `SELECT id
             FROM organization_members
             WHERE organization_id = ?
               AND user_id = ?`,
            [organization_id, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this organization"
            });
        }

        const [admins] = await pool.query(
            `SELECT id
             FROM organization_members
             WHERE organization_id = ?
               AND user_id = ?
               AND role IN ('ADMIN', 'OWNER')`,
            [organization_id, userId]
        );

        if (admins.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Organization administrator access is required"
            });
        }

        const [result] = await pool.query(
            "INSERT INTO teams (organization_id, name) VALUES (?, ?)",
            [organization_id, name.trim()]
        );

        res.status(201).json({
            success: true,
            message: "Team created successfully",
            team: {
                id: result.insertId,
                organization_id,
                name: name.trim()
            }
        });
    } catch (error) {
        console.error("CREATE TEAM ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create team"
        });
    }
};

const getTeams = async (req, res) => {
    try {
        const { organizationId } = req.params;
        const userId = req.user.userId;

        const [teams] = await pool.query(
            `SELECT t.*
             FROM teams t
             JOIN organization_members om
               ON om.organization_id = t.organization_id
             WHERE t.organization_id = ?
               AND om.user_id = ?
             ORDER BY t.created_at DESC`,
            [organizationId, userId]
        );

        res.json({
            success: true,
            teams
        });
    } catch (error) {
        console.error("GET TEAMS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch teams"
        });
    }
};

const addTeamMember = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { user_id } = req.body;
        const userId = req.user.userId;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const [teams] = await pool.query(
            `SELECT t.organization_id
             FROM teams t
             JOIN organization_members actor_membership
               ON actor_membership.organization_id = t.organization_id
              AND actor_membership.user_id = ?
              AND actor_membership.role IN ('ADMIN', 'OWNER')
             JOIN organization_members target_membership
               ON target_membership.organization_id = t.organization_id
              AND target_membership.user_id = ?
             WHERE t.id = ?`,
            [userId, user_id, teamId]
        );

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found or user is not an organization member"
            });
        }

        await pool.query(
            `INSERT INTO team_members (team_id, user_id)
             VALUES (?, ?)`,
            [teamId, user_id]
        );

        res.status(201).json({
            success: true,
            message: "Team member added successfully"
        });
    } catch (error) {
        console.error("ADD TEAM MEMBER ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add team member"
        });
    }
};

const removeTeamMember = async (req, res) => {
    try {
        const { teamId, memberId } = req.params;
        const userId = req.user.userId;

        const [teams] = await pool.query(
            `SELECT t.id
             FROM teams t
             JOIN organization_members om
               ON om.organization_id = t.organization_id
             WHERE t.id = ?
               AND om.user_id = ?
               AND om.role IN ('ADMIN', 'OWNER')`,
            [teamId, userId]
        );

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found or access denied"
            });
        }

        const [result] = await pool.query(
            "DELETE FROM team_members WHERE team_id = ? AND user_id = ?",
            [teamId, memberId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Team member not found"
            });
        }

        res.json({
            success: true,
            message: "Team member removed successfully"
        });
    } catch (error) {
        console.error("REMOVE TEAM MEMBER ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove team member"
        });
    }
};

const deleteTeam = async (req, res) => {
    let connection;

    try {
        const { teamId } = req.params;
        const userId = req.user.userId;
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [teams] = await connection.query(
            `SELECT t.id
             FROM teams t
             JOIN organization_members om
               ON om.organization_id = t.organization_id
             WHERE t.id = ?
               AND om.user_id = ?
               AND om.role IN ('ADMIN', 'OWNER')`,
            [teamId, userId]
        );

        if (teams.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Team not found or access denied"
            });
        }

        await connection.query(
            "DELETE FROM team_members WHERE team_id = ?",
            [teamId]
        );
        const [result] = await connection.query(
            "DELETE FROM teams WHERE id = ?",
            [teamId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Team deleted successfully"
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("DELETE TEAM ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete team"
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

const getTeamMembers = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.user.userId;

        const [members] = await pool.query(
            `SELECT u.id, u.name, u.email, tm.joined_at
             FROM team_members tm
             JOIN users u
               ON tm.user_id = u.id
             JOIN teams t
               ON t.id = tm.team_id
             JOIN organization_members om
               ON om.organization_id = t.organization_id
             WHERE tm.team_id = ?
               AND om.user_id = ?
             ORDER BY tm.joined_at DESC`,
            [teamId, userId]
        );

        res.json({
            success: true,
            members
        });
    } catch (error) {
        console.error("GET TEAM MEMBERS ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch team members"
        });
    }
};

module.exports = {
    createTeam,
    getTeams,
    addTeamMember,
    removeTeamMember,
    deleteTeam,
    getTeamMembers
};
