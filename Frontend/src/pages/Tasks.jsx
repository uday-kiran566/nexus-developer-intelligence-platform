import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const PROJECT_ID = 1;

const COLUMNS = [
    { id: "TODO", name: "To Do" },
    { id: "IN_PROGRESS", name: "In Progress" },
    { id: "IN_REVIEW", name: "In Review" },
    { id: "DONE", name: "Done" }
];

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [labels, setLabels] = useState([]);
    const [taskLabels, setTaskLabels] = useState({});
    const [dependencies, setDependencies] = useState({});
    const [selectedDependency, setSelectedDependency] = useState({});

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");

    const [openComments, setOpenComments] = useState(null);
    const [comments, setComments] = useState({});
    const [commentText, setCommentText] = useState("");

    const [openDetails, setOpenDetails] = useState(null);

    const [draggedTask, setDraggedTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // -----------------------------
    // GET TASKS
    // -----------------------------
    const fetchTasks = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/tasks/project/${PROJECT_ID}`,
                config
            );

            setTasks(response.data.tasks || []);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                "Failed to load tasks"
            );
        }
    };

    // -----------------------------
    // GET PROJECT LABELS
    // -----------------------------
    const fetchLabels = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/labels/project/${PROJECT_ID}`,
                config
            );

            setLabels(response.data.labels || []);
        } catch (err) {
            console.error("LABEL LOAD ERROR:", err);
        }
    };

    // -----------------------------
    // GET LABELS FOR ONE TASK
    // -----------------------------
    const fetchTaskLabels = async (taskId) => {
        try {
            const response = await axios.get(
                `${API_URL}/labels/task/${taskId}`,
                config
            );

            setTaskLabels((old) => ({
                ...old,
                [taskId]: response.data.labels || []
            }));
        } catch (err) {
            console.error("TASK LABEL ERROR:", err);
        }
    };

    // -----------------------------
    // GET DEPENDENCIES
    // -----------------------------
    const fetchDependencies = async (taskId) => {
        try {
            const response = await axios.get(
                `${API_URL}/dependencies/task/${taskId}`,
                config
            );

            setDependencies((old) => ({
                ...old,
                [taskId]: response.data.dependencies || []
            }));
        } catch (err) {
            console.error("DEPENDENCY LOAD ERROR:", err);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchLabels();
    }, []);

    // -----------------------------
    // CREATE TASK
    // -----------------------------
    const createTask = async (event) => {
        event.preventDefault();

        if (!title.trim()) {
            setError("Task title is required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await axios.post(
                `${API_URL}/tasks`,
                {
                    project_id: PROJECT_ID,
                    title: title.trim(),
                    description: description.trim(),
                    status: "TODO",
                    priority
                },
                config
            );

            setTitle("");
            setDescription("");
            setPriority("MEDIUM");

            await fetchTasks();

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to create task"
            );
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // UPDATE STATUS
    // -----------------------------
    const updateTaskStatus = async (task, newStatus) => {
        try {
            await axios.put(
                `${API_URL}/tasks/${task.id}`,
                {
                    title: task.title,
                    description: task.description || "",
                    status: newStatus,
                    priority: task.priority || "MEDIUM",
                    assigned_to: task.assigned_to || null,
                    due_date: task.due_date || null
                },
                config
            );

            setTasks((old) =>
                old.map((item) =>
                    item.id === task.id
                        ? { ...item, status: newStatus }
                        : item
                )
            );

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to update task"
            );
        }
    };

    // -----------------------------
    // DELETE TASK
    // -----------------------------
    const deleteTask = async (taskId) => {
        try {
            await axios.delete(
                `${API_URL}/tasks/${taskId}`,
                config
            );

            setTasks((old) =>
                old.filter((task) => task.id !== taskId)
            );

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to delete task"
            );
        }
    };

    // -----------------------------
    // COMMENTS
    // -----------------------------
    const fetchComments = async (taskId) => {
        try {
            const response = await axios.get(
                `${API_URL}/comments/task/${taskId}`,
                config
            );

            setComments((old) => ({
                ...old,
                [taskId]: response.data.comments || []
            }));

        } catch (err) {
            console.error(err);
            setError("Failed to load comments");
        }
    };

    const toggleComments = async (taskId) => {
        if (openComments === taskId) {
            setOpenComments(null);
            return;
        }

        setOpenComments(taskId);

        if (!comments[taskId]) {
            await fetchComments(taskId);
        }
    };

    const addComment = async (taskId) => {
        if (!commentText.trim()) {
            return;
        }

        try {
            setCommentLoading(true);

            await axios.post(
                `${API_URL}/comments`,
                {
                    task_id: taskId,
                    content: commentText.trim()
                },
                config
            );

            setCommentText("");

            await fetchComments(taskId);

        } catch (err) {
            console.error(err);
            setError("Failed to add comment");
        } finally {
            setCommentLoading(false);
        }
    };

    // -----------------------------
    // ADD LABEL
    // -----------------------------
    const addLabel = async (taskId, labelId) => {
        if (!labelId) {
            return;
        }

        try {
            await axios.post(
                `${API_URL}/labels/task`,
                {
                    task_id: taskId,
                    label_id: Number(labelId)
                },
                config
            );

            await fetchTaskLabels(taskId);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to add label"
            );
        }
    };

    // -----------------------------
    // ADD DEPENDENCY
    // -----------------------------
    const addDependency = async (taskId) => {
        const dependencyTaskId =
            selectedDependency[taskId];

        if (!dependencyTaskId) {
            return;
        }

        if (Number(dependencyTaskId) === Number(taskId)) {
            setError("A task cannot depend on itself");
            return;
        }

        try {
            await axios.post(
                `${API_URL}/dependencies`,
                {
                    task_id: Number(taskId),
                    depends_on_task_id:
                        Number(dependencyTaskId)
                },
                config
            );

            setSelectedDependency((old) => ({
                ...old,
                [taskId]: ""
            }));

            await fetchDependencies(taskId);

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Failed to add dependency"
            );
        }
    };

    // -----------------------------
    // DRAG & DROP
    // -----------------------------
    const handleDragStart = (task) => {
        setDraggedTask(task);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleDrop = async (status) => {
        if (!draggedTask) {
            return;
        }

        if (draggedTask.status !== status) {
            await updateTaskStatus(
                draggedTask,
                status
            );
        }

        setDraggedTask(null);
    };

    // -----------------------------
    // TASK DETAILS
    // -----------------------------
    const toggleDetails = async (taskId) => {
        if (openDetails === taskId) {
            setOpenDetails(null);
            return;
        }

        setOpenDetails(taskId);

        if (!taskLabels[taskId]) {
            await fetchTaskLabels(taskId);
        }

        if (!dependencies[taskId]) {
            await fetchDependencies(taskId);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                padding: "30px",
                background: "#020617",
                color: "#ffffff"
            }}
        >
            <h1>NEXUS</h1>

            <p style={{ color: "#94a3b8" }}>
                Developer Intelligence Platform
            </p>

            <h2>Task Board</h2>

            {error && (
                <div
                    style={{
                        padding: "12px",
                        marginBottom: "20px",
                        background: "#450a0a",
                        border: "1px solid #ef4444",
                        borderRadius: "8px"
                    }}
                >
                    {error}
                </div>
            )}

            {/* CREATE TASK */}
            <form
                onSubmit={createTask}
                style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "30px",
                    padding: "20px",
                    background: "#0f172a",
                    borderRadius: "10px"
                }}
            >
                <input
                    type="text"
                    placeholder="Task title"
                    value={title}
                    onChange={(e) =>
                        setTitle(e.target.value)
                    }
                    style={{
                        padding: "10px",
                        flex: 1
                    }}
                />

                <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) =>
                        setDescription(e.target.value)
                    }
                    style={{
                        padding: "10px",
                        flex: 2
                    }}
                />

                <select
                    value={priority}
                    onChange={(e) =>
                        setPriority(e.target.value)
                    }
                    style={{
                        padding: "10px"
                    }}
                >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                </select>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "10px 20px"
                    }}
                >
                    {loading
                        ? "Creating..."
                        : "Create Task"}
                </button>
            </form>

            {/* KANBAN */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(4, minmax(240px, 1fr))",
                    gap: "20px",
                    overflowX: "auto"
                }}
            >
                {COLUMNS.map((column) => {
                    const columnTasks = tasks.filter(
                        (task) =>
                            task.status === column.id
                    );

                    return (
                        <div
                            key={column.id}
                            onDragOver={handleDragOver}
                            onDrop={() =>
                                handleDrop(column.id)
                            }
                            style={{
                                minHeight: "450px",
                                padding: "15px",
                                background: "#0f172a",
                                borderRadius: "10px",
                                border:
                                    "1px solid #334155"
                            }}
                        >
                            <h3>{column.name}</h3>

                            {columnTasks.map((task) => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={() =>
                                        handleDragStart(task)
                                    }
                                    style={{
                                        padding: "15px",
                                        marginBottom: "12px",
                                        background:
                                            "#020617",
                                        borderRadius:
                                            "10px",
                                        border:
                                            "1px solid #475569"
                                    }}
                                >
                                    <strong>
                                        {task.title}
                                    </strong>

                                    <p
                                        style={{
                                            color: "#94a3b8"
                                        }}
                                    >
                                        {task.description ||
                                            "No description"}
                                    </p>

                                    <small>
                                        Priority:{" "}
                                        {task.priority}
                                    </small>

                                    {/* STATUS */}
                                    <select
                                        value={task.status}
                                        onChange={(e) =>
                                            updateTaskStatus(
                                                task,
                                                e.target.value
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "10px",
                                            padding: "8px",
                                            background:
                                                "#1e293b",
                                            color:
                                                "#ffffff"
                                        }}
                                    >
                                        {COLUMNS.map(
                                            (item) => (
                                                <option
                                                    key={
                                                        item.id
                                                    }
                                                    value={
                                                        item.id
                                                    }
                                                >
                                                    {item.name}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {/* DETAILS */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleDetails(
                                                task.id
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "10px",
                                            padding: "9px",
                                            background:
                                                "#334155",
                                            color:
                                                "#ffffff",
                                            border: "none",
                                            borderRadius:
                                                "6px"
                                        }}
                                    >
                                        {openDetails === task.id
                                            ? "Hide Details"
                                            : "Labels & Dependencies"}
                                    </button>

                                    {openDetails === task.id && (
                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                                padding: "10px",
                                                background:
                                                    "#0f172a",
                                                borderRadius:
                                                    "8px"
                                            }}
                                        >
                                            {/* LABELS */}
                                            <h4>Labels</h4>

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    gap: "6px",
                                                    flexWrap:
                                                        "wrap"
                                                }}
                                            >
                                                {(taskLabels[
                                                    task.id
                                                ] || []).map(
                                                    (label) => (
                                                        <span
                                                            key={
                                                                label.id
                                                            }
                                                            style={{
                                                                padding:
                                                                    "4px 8px",
                                                                borderRadius:
                                                                    "999px",
                                                                background:
                                                                    label.color ||
                                                                    "#6366f1",
                                                                fontSize:
                                                                    "12px"
                                                            }}
                                                        >
                                                            {
                                                                label.name
                                                            }
                                                        </span>
                                                    )
                                                )}
                                            </div>

                                            <select
                                                defaultValue=""
                                                onChange={(e) =>
                                                    addLabel(
                                                        task.id,
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                style={{
                                                    width:
                                                        "100%",
                                                    marginTop:
                                                        "8px",
                                                    padding:
                                                        "8px",
                                                    background:
                                                        "#020617",
                                                    color:
                                                        "#ffffff"
                                                }}
                                            >
                                                <option
                                                    value=""
                                                >
                                                    Add label...
                                                </option>

                                                {labels.map(
                                                    (label) => (
                                                        <option
                                                            key={
                                                                label.id
                                                            }
                                                            value={
                                                                label.id
                                                            }
                                                        >
                                                            {
                                                                label.name
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            {/* DEPENDENCIES */}
                                            <h4
                                                style={{
                                                    marginTop:
                                                        "15px"
                                                }}
                                            >
                                                Dependencies
                                            </h4>

                                            {(dependencies[
                                                task.id
                                            ] || []).map(
                                                (dependency) => (
                                                    <div
                                                        key={
                                                            dependency.id
                                                        }
                                                        style={{
                                                            padding:
                                                                "7px",
                                                            marginBottom:
                                                                "5px",
                                                            background:
                                                                "#020617",
                                                            borderRadius:
                                                                "5px",
                                                            color:
                                                                "#cbd5e1"
                                                        }}
                                                    >
                                                        Depends on:
                                                        {" "}
                                                        {
                                                            dependency.depends_on_title
                                                        }
                                                    </div>
                                                )
                                            )}

                                            <select
                                                value={
                                                    selectedDependency[
                                                        task.id
                                                    ] || ""
                                                }
                                                onChange={(e) =>
                                                    setSelectedDependency(
                                                        (old) => ({
                                                            ...old,
                                                            [task.id]:
                                                                e.target
                                                                    .value
                                                        })
                                                    )
                                                }
                                                style={{
                                                    width:
                                                        "100%",
                                                    padding:
                                                        "8px",
                                                    background:
                                                        "#020617",
                                                    color:
                                                        "#ffffff"
                                                }}
                                            >
                                                <option
                                                    value=""
                                                >
                                                    Select dependency...
                                                </option>

                                                {tasks
                                                    .filter(
                                                        (item) =>
                                                            item.id !==
                                                            task.id
                                                    )
                                                    .map(
                                                        (item) => (
                                                            <option
                                                                key={
                                                                    item.id
                                                                }
                                                                value={
                                                                    item.id
                                                                }
                                                            >
                                                                #
                                                                {
                                                                    item.id
                                                                }{" "}
                                                                {
                                                                    item.title
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addDependency(
                                                        task.id
                                                    )
                                                }
                                                style={{
                                                    width:
                                                        "100%",
                                                    marginTop:
                                                        "8px",
                                                    padding:
                                                        "8px",
                                                    background:
                                                        "#6366f1",
                                                    color:
                                                        "#ffffff",
                                                    border:
                                                        "none",
                                                    borderRadius:
                                                        "6px"
                                                }}
                                            >
                                                Add Dependency
                                            </button>
                                        </div>
                                    )}

                                    {/* COMMENTS */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleComments(
                                                task.id
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "10px",
                                            padding: "9px",
                                            background:
                                                "#334155",
                                            color:
                                                "#ffffff",
                                            border: "none",
                                            borderRadius:
                                                "6px"
                                        }}
                                    >
                                        {openComments === task.id
                                            ? "Hide Comments"
                                            : "Comments"}
                                    </button>

                                    {openComments === task.id && (
                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                                padding: "10px",
                                                background:
                                                    "#0f172a",
                                                borderRadius:
                                                    "8px"
                                            }}
                                        >
                                            {(comments[
                                                task.id
                                            ] || []).map(
                                                (comment) => (
                                                    <div
                                                        key={
                                                            comment.id
                                                        }
                                                        style={{
                                                            marginBottom:
                                                                "10px",
                                                            padding:
                                                                "8px",
                                                            background:
                                                                "#020617",
                                                            borderRadius:
                                                                "6px"
                                                        }}
                                                    >
                                                        <strong>
                                                            {
                                                                comment.user_name
                                                            }
                                                        </strong>

                                                        <p>
                                                            {
                                                                comment.content
                                                            }
                                                        </p>
                                                    </div>
                                                )
                                            )}

                                            <textarea
                                                value={
                                                    commentText
                                                }
                                                onChange={(e) =>
                                                    setCommentText(
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Write a comment..."
                                                rows="3"
                                                style={{
                                                    width:
                                                        "100%",
                                                    boxSizing:
                                                        "border-box",
                                                    padding:
                                                        "8px",
                                                    background:
                                                        "#020617",
                                                    color:
                                                        "#ffffff"
                                                }}
                                            />

                                            <button
                                                type="button"
                                                disabled={
                                                    commentLoading
                                                }
                                                onClick={() =>
                                                    addComment(
                                                        task.id
                                                    )
                                                }
                                                style={{
                                                    width:
                                                        "100%",
                                                    marginTop:
                                                        "8px",
                                                    padding:
                                                        "8px",
                                                    background:
                                                        "#6366f1",
                                                    color:
                                                        "#ffffff",
                                                    border:
                                                        "none",
                                                    borderRadius:
                                                        "6px"
                                                }}
                                            >
                                                {commentLoading
                                                    ? "Adding..."
                                                    : "Add Comment"}
                                            </button>
                                        </div>
                                    )}

                                    {/* DELETE */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            deleteTask(
                                                task.id
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "10px",
                                            padding: "8px",
                                            background:
                                                "#dc2626",
                                            color:
                                                "#ffffff",
                                            border: "none",
                                            borderRadius:
                                                "6px"
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}

                            {columnTasks.length === 0 && (
                                <div
                                    style={{
                                        padding:
                                            "30px 10px",
                                        textAlign:
                                            "center",
                                        color:
                                            "#64748b"
                                    }}
                                >
                                    Drop tasks here
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Tasks;
