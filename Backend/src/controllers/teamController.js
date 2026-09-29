const pool = require("../db");

const createTeam = async (req, res) => {
    try {
        const { organization_id, name } = req.body;

        if (!organization_id || !name) {
            return res.status(400).json({
                success: false,
                message: "Organization ID and team name are required"
            });
        }

        const [result] = await pool.query(
            "INSERT INTO teams (organization_id, name) VALUES (?, ?)",
            [organization_id, name]
        );

        res.status(201).json({
            success: true,
            message: "Team created successfully",
            team: {
                id: result.insertId,
                organization_id,
                name
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

        const [teams] = await pool.query(
            `SELECT *
             FROM teams
             WHERE organization_id = ?
             ORDER BY created_at DESC`,
            [organizationId]
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

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        await pool.query(
            `INSERT INTO team_members
            (team_id, user_id)
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

        const [members] = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                tm.joined_at
             FROM team_members tm
             JOIN users u
             ON tm.user_id = u.id
             WHERE tm.team_id = ?
             ORDER BY tm.joined_at DESC`,
            [teamId]
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