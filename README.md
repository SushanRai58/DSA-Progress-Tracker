# DSA Progress Tracker

A full-stack web app to track your DSA problem-solving progress — with streak tracking, an activity heatmap, filters, bulk actions, and a LeetCode auto-fill scraper.

## Project Structure

```
dsa-progress-tracker/
├── frontend/               # Vanilla HTML/CSS/JS client
│   ├── index.html
│   ├── script.js
│   └── style.css
├── backend/                # Node.js / Express / MongoDB API
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── questionController.js
│   │   └── scraperController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   └── Question.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── questionRoutes.js
│   │   └── scraperRoutes.js
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Features

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
- User accounts with JWT authentication

## Running Locally

### Frontend

Open `frontend/index.html` directly in your browser — no build step required.

The frontend currently uses `localStorage` for persistence. To connect it to the backend, point API calls at `http://localhost:5000`.

### Backend

See [backend/README.md](backend/README.md) for full setup instructions.

```bash
cd backend
npm install
# configure backend/.env (see backend/README.md)
npm run dev
```

Server runs on `http://localhost:5000`.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | HTML, Tailwind CSS (CDN), Vanilla JS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken) + bcryptjs |

## Author

**Sushan Rai**
