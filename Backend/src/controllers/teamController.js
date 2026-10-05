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
    getTeamMembers
};
