# DSA Progress Tracker

A full-stack web app to track your DSA problem-solving progress — with user accounts, cloud sync, streak tracking, an activity heatmap, filters, bulk actions, and a LeetCode auto-fill scraper.

**Stack:** Vanilla JS + Tailwind CSS frontend · Node.js/Express + MongoDB backend · JWT auth

## Project Structure

```
dsa-progress-tracker/
├── frontend/               # Vanilla HTML/CSS/JS client
│   ├── index.html
│   ├── script.js
│   └── style.css
├── backend/                # Node.js / Express / MongoDB API
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── .env                # Local secrets (not committed)
│   ├── .env.example        # Template — copy to .env and fill in
│   └── package.json
├── package.json            # Root dev scripts (concurrently)
├── .gitignore
└── README.md
```

## Features

- Register / login with JWT authentication
- Add, edit, delete DSA questions
- Mark questions solved / unsolved with one click
- Difficulty breakdown (Easy / Medium / Hard) with progress bars
- Tag system — click a tag to filter instantly
- Search across title, topic, and tags
- Sort and group by topic
- Bulk select — mark solved/unsolved or delete multiple at once
- Activity heatmap (last 52 weeks)
- Active streak counter
- Export / import progress as JSON
- Dark mode
- LeetCode auto-fill via backend scraper

## Setup

### 1. Clone

```bash
git clone <repo-url>
cd dsa-progress-tracker
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # then edit .env with your values
npm install
npm run dev               # starts on http://localhost:5000
```

`.env` values to configure:

| Key | Description |
|-----|-------------|
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Long random string — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PORT` | API port (default `5000`) |
| `CLIENT_ORIGIN` | Comma-separated frontend origins for CORS |

See [backend/README.md](backend/README.md) for more detail.

### 3. Frontend

Open `frontend/index.html` in VS Code with **Live Server** (serves on `http://127.0.0.1:5500`), or any static file server on port 5500.

### 4. One-command dev (optional)

```bash
npm install        # installs concurrently
npm run dev        # starts backend (nodemon) + frontend (live-server)
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/questions` | JWT | List user's questions |
| POST | `/api/questions` | JWT | Add question |
| PUT | `/api/questions/:id` | JWT | Update question |
| DELETE | `/api/questions/:id` | JWT | Delete question |
| POST | `/api/scrape/leetcode` | JWT | Fetch LeetCode problem metadata |

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, Tailwind CSS (CDN), Vanilla JS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken) + bcryptjs |

## Author

**Sushan Rai**
