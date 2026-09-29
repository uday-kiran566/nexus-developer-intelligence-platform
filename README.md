# NEXUS — Developer Intelligence Platform

NEXUS is an AI-powered developer productivity platform for managing organizations, projects, tasks, collaboration, and intelligent developer workflows from one place.

## 🚀 Features

- 🔐 JWT-based authentication
- 🏢 Organization management
- 📁 Project management
- ✅ Task management with Kanban workflow
- 🏷️ Task labels
- 🔗 Task dependencies
- 💬 Task comments
- 📋 Activity logs
- 🔔 Notifications
- 🤖 AI Developer Assistant
- 📚 RAG-powered developer assistance
- 🗄️ MySQL database
- 🌐 React frontend
- ⚙️ Node.js + Express backend

## 🛠️ Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Vite

### Backend
- Node.js
- Express.js
- JWT
- bcryptjs
- MySQL2
- dotenv
- CORS

### Database
- MySQL 8

### AI
- Gemini API
- Retrieval-Augmented Generation (RAG)

## 🏗️ Architecture

```text
React Frontend
       ↓
Express REST API
       ↓
Authentication / Business Logic
       ↓
MySQL Database
       ↓
Gemini AI + RAG