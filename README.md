# NEXUS — Developer Intelligence Platform

**Live Demo:** https://nexus-frontend-6y6j.onrender.com/login

NEXUS is a full-stack developer intelligence platform for managing organizations, projects, tasks, teams, collaboration, activity, notifications, and AI-powered developer workflows.

## 🚀 Features

* JWT-based authentication
* Organization management
* Project management
* Task creation and tracking
* Teams and team members
* Comments and collaboration
* Labels and task dependencies
* Activity tracking
* Notifications
* AI-powered developer workflows
* Knowledge/RAG data support
* Real-time dashboard statistics

## 🛠️ Tech Stack

**Frontend**

* React.js
* Vite
* JavaScript
* HTML5
* CSS3

**Backend**

* Node.js
* Express.js
* REST APIs
* JWT authentication
* bcryptjs

**Database**

* TiDB Cloud
* MySQL-compatible SQL database

**AI**

* Google Gemini API
* Gemini embeddings
* RAG-based knowledge search

**Deployment**

* Netlify
* Netlify Functions
* GitHub

## 🏗️ Architecture

```text
React + Vite
      ↓
Netlify
      ↓
Express API / Netlify Functions
      ↓
TiDB Cloud
      ↓
Google Gemini API
```

## 📊 Current Production Environment

The application is deployed and connected to a cloud database and production AI services.

Production URL:

https://nexus-developer-platform.netlify.app

## 🔐 Authentication

NEXUS uses JWT-based authentication with protected API routes and secure password hashing.

## 🧠 AI Workflow

The AI module uses Google Gemini for developer-focused responses and supports a knowledge-search workflow using embeddings and stored knowledge chunks.

## 📁 Project Structure

```text
NEXUS/
├── Backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   ├── netlify/
│   │   └── functions/
│   └── package.json
│
├── Frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── database/
├── netlify.toml
└── README.md
```

## 🌐 Deployment

The frontend and Express API are deployed through Netlify, with TiDB Cloud providing the production SQL database.

## 👨‍💻 Author

**Uday Kiran**

B.Tech — Computer Science and Engineering
