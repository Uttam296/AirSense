# AirSense — React Frontend (Vite)

This is your original `frontend/` (HTML/CSS/JS) converted to React, wired to
your **existing, unmodified** Express backend. Nothing in your `backend/` or
`machine-learning/` folders needs to change.

## 1. Where this goes

Replace your old `frontend/` folder with this one (or place it alongside as
`frontend-react/` — either works, they don't need to live inside `backend/`).

```
AIRSENSE/
├── backend/              ← unchanged, run exactly as before
├── frontend/              ← this folder (delete old HTML/CSS/JS frontend)
└── machine-learning/      ← unchanged
```

## 2. Install & run

```bash
cd frontend
npm install
npm run dev
```

This starts the React app on **http://localhost:5173** (Vite's default port).

Your backend keeps running the same way it always has, on port 3000:

```bash
cd backend
npm start        # or: node server.js / nodemon server.js
```

Both need to be running at the same time — React (port 5173) calls your
Express API (port 3000) exactly the same way your old `fetch()` calls did.

## 3. What changed vs. your old frontend

- **Nothing on the backend.** No routes, models, or `.env` values were touched.
- **Same API calls, same endpoints, same header format** (`Authorization: token`,
  no `Bearer` prefix) — see `src/services/api.js` for all of them in one place.
- **Same `sessionStorage` for auth** (`token`, `userId`) — logging in on the old
  site and the new site behaves identically.
- HTML pages → React Router pages:
  - `index.html` → `/` (Dashboard)
  - `login.html` → `/login`
  - `signup.html` → `/signup`
  - `profile.html` → `/profile`
- CSS files → CSS Modules (`src/styles/*.module.css`) — same styles, scoped to
  each page so they can't collide.
- Chart.js and Leaflet (map) work exactly as before, just created inside React
  `useEffect` hooks instead of plain `<script>` tags.

## 4. Build for production

```bash
npm run build
```

Outputs a static site to `dist/` — deploy that anywhere (Vercel, Netlify,
Render static site, etc.), and point it at your deployed backend URL by
changing `API_BASE` in `src/services/api.js`.

## 5. If something doesn't load

- Make sure the backend is running on port 3000 (React expects
  `http://localhost:3000/api/...`).
- Check your browser console — CORS errors mean your Express backend needs
  `cors()` enabled for `http://localhost:5173`.
- Login/signup not working? Check your MongoDB connection in `backend/.env`
  the same way you would have before.
