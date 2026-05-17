# DSA Tracker — Backend API

Node.js / Express / MongoDB REST API that backs the DSA Progress Tracker frontend.

---

## Prerequisites

| Tool | Min version | Install |
|------|-------------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | bundled with Node |
| MongoDB | Local 6+ **or** Atlas free tier | https://www.mongodb.com |

---

## 1 — Install dependencies

```bash
cd backend
npm install
```

---

## 2 — Configure environment variables

Copy the template and fill in your values:

```bash
# Windows PowerShell
Copy-Item .env .env.local    # optional — .env is already the working file
```

Open `backend/.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/dsa_tracker   # or your Atlas URI
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
CLIENT_ORIGIN=http://127.0.0.1:5500               # origin your frontend is served from
```

> **MongoDB Atlas quick-start:** Create a free M0 cluster → Database Access → add a user →
> Network Access → allow your IP → Cluster → Connect → copy the connection string into `MONGO_URI`.

---

## 3 — Start the server

**Development** (auto-restarts on file changes via nodemon):
```bash
npm run dev
```

**Production**:
```bash
npm start
```

You should see:
```
MongoDB connected: localhost
Server running on port 5000
```

Health-check: `GET http://localhost:5000/` → `{ "message": "DSA Tracker API is running." }`

---

## API Reference

### Auth — no token required

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ _id, name, email, token }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ _id, name, email, token }` |

All subsequent requests must include the returned `token` in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

### Questions — JWT required

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/questions` | — | Get all questions for the logged-in user |
| POST | `/api/questions` | `{ title, topic, difficulty, tags?, notes?, isSolved?, leetcodeUrl? }` | Create a question |
| PUT | `/api/questions/:id` | Any subset of Question fields | Update a question |
| DELETE | `/api/questions/:id` | — | Delete a question |

`difficulty` must be one of: `"Easy"` `"Medium"` `"Hard"`

---

### Scraper — JWT required

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/scrape/leetcode` | `{ url: "https://leetcode.com/problems/two-sum/" }` | `{ title, difficulty, tags[] }` |

> **Note:** LeetCode's GraphQL API is undocumented and may occasionally rate-limit requests.
> If you receive a 503, enter the details manually and try again later.

---

## Project Structure

```
backend/
├── config/
│   └── db.js                  # Mongoose connection
├── controllers/
│   ├── authController.js      # register / login logic
│   ├── questionController.js  # CRUD handlers
│   └── scraperController.js   # LeetCode GraphQL fetch
├── middleware/
│   └── authMiddleware.js      # JWT guard (protect)
├── models/
│   ├── User.js                # User schema + password hashing
│   └── Question.js            # Question schema
├── routes/
│   ├── authRoutes.js
│   ├── questionRoutes.js
│   └── scraperRoutes.js
├── .env                       # Environment variables (never commit this)
├── server.js                  # App entry point
└── package.json
```

---

## Security notes

- Passwords are hashed with **bcrypt** (12 salt rounds) — plain-text passwords never touch the database.
- JWTs expire after **7 days** — implement refresh tokens if you need longer sessions.
- Every question query is scoped to `req.user._id` — users cannot read or modify each other's data.
- Add `.env` to your `.gitignore` before pushing to a public repository.
