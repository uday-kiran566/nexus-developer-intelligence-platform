const { GoogleGenAI } = require("@google/genai");
const pool = require("../db");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

// Create embedding
const createEmbedding = async (text) => {
    const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: {
            taskType: "SEMANTIC_SIMILARITY",
            outputDimensionality: EMBEDDING_DIMENSIONS
        }
    });

    const values = response.embeddings?.[0]?.values;

    if (!Array.isArray(values) || values.length === 0) {
        throw new Error("Failed to generate embedding");
    }

    return values.map(Number);
};


// Cosine similarity
const cosineSimilarity = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return 0;
    }

    if (a.length !== b.length || a.length === 0) {
        return 0;
    }

    let dot = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
        const x = Number(a[i]);
        const y = Number(b[i]);

        dot += x * y;
        magnitudeA += x * x;
        magnitudeB += y * y;
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dot / (
        Math.sqrt(magnitudeA) *
        Math.sqrt(magnitudeB)
    );
};


// Store knowledge
const storeKnowledge = async ({
    sourceType,
    sourceId,
    projectId,
    content
}) => {
    const embedding = await createEmbedding(content);

    await pool.query(
        `INSERT INTO knowledge_chunks
        (source_type, source_id, project_id, content, embedding)
        VALUES (?, ?, ?, ?, ?)`,
        [
            sourceType,
            sourceId,
            projectId || null,
            content,
            JSON.stringify(embedding)
        ]
    );
};


// Index project + tasks
const indexProject = async (projectId) => {
    const [projects] = await pool.query(
        `SELECT id, name, description, status
         FROM projects
         WHERE id = ?`,
        [projectId]
    );

    if (projects.length === 0) {
        throw new Error("Project not found");
    }

    const project = projects[0];

    await pool.query(
        `DELETE FROM knowledge_chunks
         WHERE project_id = ?`,
        [projectId]
    );

    const projectContent = `
Project Name: ${project.name}
Description: ${project.description || "No description"}
Status: ${project.status}
`.trim();

    await storeKnowledge({
        sourceType: "PROJECT",
        sourceId: project.id,
        projectId: project.id,
        content: projectContent
    });

    const [tasks] = await pool.query(
        `SELECT id, title, description, status, priority
         FROM tasks
         WHERE project_id = ?
         ORDER BY id`,
        [projectId]
    );

    for (const task of tasks) {
        const taskContent = `
Project: ${project.name}
Task ID: ${task.id}
Task: ${task.title}
Description: ${task.description || "No description"}
Status: ${task.status}
Priority: ${task.priority}
`.trim();

        await storeKnowledge({
            sourceType: "TASK",
            sourceId: task.id,
            projectId: project.id,
            content: taskContent
        });
    }

    return {
        projectId: project.id,
        projectName: project.name,
        tasksIndexed: tasks.length,
        totalChunks: tasks.length + 1
    };
};


// Search project knowledge
const searchKnowledge = async (
    projectId,
    query,
    limit = 5
) => {
    const queryEmbedding = await createEmbedding(query);

    const [chunks] = await pool.query(
        `SELECT
            id,
            source_type,
            source_id,
            content,
            embedding
         FROM knowledge_chunks
         WHERE project_id = ?`,
        [projectId]
    );

    const ranked = chunks
        .map((chunk) => {
            let embedding = [];

            try {
                embedding =
                    typeof chunk.embedding === "string"
                        ? JSON.parse(chunk.embedding)
                        : chunk.embedding;
            } catch {
                embedding = [];
            }

            return {
                id: chunk.id,
                sourceType: chunk.source_type,
                sourceId: chunk.source_id,
                content: chunk.content,
                score: cosineSimilarity(
                    queryEmbedding,
                    embedding
                )
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return ranked;
};

module.exports = {
    createEmbedding,
    indexProject,
    searchKnowledge
};