const { GoogleGenAI } = require("@google/genai");
const {
    indexProject,
    searchKnowledge
} = require("../services/ragService");
const pool = require("../db");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// CHAT WITH NEXUS AI
const chat = async (req, res) => {
    try {
        const {
            message,
            project_id
        } = req.body;

        const userId = req.user.userId;

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        if (!project_id) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required"
            });
        }

        // SECURITY:
        // Verify that the logged-in user belongs to this project
        const [projects] = await pool.query(
            `SELECT p.id
             FROM projects p
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE p.id = ?
               AND pm.user_id = ?`,
            [project_id, userId]
        );

        if (projects.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project"
            });
        }

        // Search ONLY this authorized project
        const relevantChunks = await searchKnowledge(
            Number(project_id),
            message.trim(),
            5
        );

        const context = relevantChunks
            .map((chunk) => chunk.content)
            .join("\n\n");

        const prompt = `
You are NEXUS AI, a developer assistant.

Answer the user's question using the project context below.

PROJECT CONTEXT:
${context || "No relevant project context was found."}

USER QUESTION:
${message.trim()}

Rules:
- Use the project context when it is relevant.
- Do not invent project facts.
- If the context does not contain the answer, clearly say that the information is not available in the project context.
- Give a practical developer-focused answer.
`;

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
            contents: prompt
        });

        res.json({
            success: true,
            answer: response.text,
            sources: relevantChunks.map((chunk) => ({
                type: chunk.sourceType,
                id: chunk.sourceId,
                score: Number(chunk.score.toFixed(4))
            }))
        });

    } catch (error) {
        console.error("RAG CHAT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "AI request failed"
        });
    }
};


// INDEX PROJECT INTO RAG
const indexProjectData = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.userId;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: "Project ID is required"
            });
        }

        // SECURITY:
        // Only a project member can index this project
        const [projects] = await pool.query(
            `SELECT p.id
             FROM projects p
             INNER JOIN project_members pm
                ON p.id = pm.project_id
             WHERE p.id = ?
               AND pm.user_id = ?`,
            [projectId, userId]
        );

        if (projects.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You do not have access to this project"
            });
        }

        const result = await indexProject(
            Number(projectId)
        );

        res.json({
            success: true,
            message: "Project indexed successfully",
            result
        });

    } catch (error) {
        console.error("INDEX PROJECT ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to index project"
        });
    }
};


module.exports = {
    chat,
    indexProjectData
};