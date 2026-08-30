# 🎵 SAREGAMA — Music Streaming Web App

**SAREGAMA** is a full-stack music streaming web application that lets you search, discover, and stream millions of songs — all for free, with no ads. Built with React and Node.js, it features a beautiful Spotify-inspired UI that works seamlessly on both desktop and mobile.

> 🌐 **Live Demo:** [https://saregama-lmt4.onrender.com](https://saregama-lmt4.onrender.com)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Real-Time Search** | Instantly search millions of songs from YouTube Music's catalog |
| 🎧 **High-Quality Streaming** | Stream audio in the best available quality with a custom audio player |
| 📱 **Mobile Responsive** | Fully optimized for phones with a bottom navigation bar, swipe gestures, and a full-screen expanding player |
| ❤️ **Liked Songs** | Save your favorite tracks to a personal "Liked Songs" library |
| 📜 **Listening History** | Automatically tracks every song you play for easy re-discovery |
| 📝 **Synchronized Lyrics** | View real-time lyrics for the currently playing song (when available) |
| 🎶 **Queue Management** | Add songs to an "Up Next" queue and control playback order |
| 🗂️ **Custom Playlists** | Create, edit, and organize your own playlists |
| 🎨 **Dynamic UI** | Smooth animations, loading skeletons, and gradient backgrounds |
| 🔊 **Full Player Controls** | Play/pause, seek, volume slider, next/previous track |

---

## 🏗️ Architecture Overview

SAREGAMA is a **monorepo** with two main parts:

```
SAREGAMA/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx            # Main application (views, player, routing)
│   │   ├── ExpandedPlayer.jsx # Full-screen player component
│   │   ├── LandingPage.jsx    # Landing/onboarding page
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Tailwind imports
│   └── package.json
│
├── backend/           # Node.js + Express 5
│   ├── index.js       # Main server (API routes, streaming proxy)
│   ├── db.js          # SQLite database schema & initialization
│   ├── routes/
│   │   ├── auth.js    # Authentication endpoints (JWT)
│   │   └── user.js    # User data endpoints (likes, history, playlists)
│   └── package.json
│
├── render.yaml        # Render deployment blueprint
└── package.json       # Root monorepo scripts
```

---

## 🔄 How It Works — Data Flow

Here's what happens when you search for a song and play it:

```
┌─────────────┐    Search Query     ┌──────────────┐    youtubei.js     ┌──────────────┐
│   Browser    │ ──────────────────► │   Express    │ ────────────────► │  YouTube     │
│  (React UI)  │                     │   Backend    │                    │  Music API   │
│              │ ◄────────────────── │              │ ◄──────────────── │              │
│              │   Song Results      │              │   Metadata         │              │
└─────────────┘   (JSON Array)      └──────────────┘   (titles, art)    └──────────────┘

   User clicks "Play"

┌─────────────┐  /api/stream/:id    ┌──────────────┐   youtube-dl-exec  ┌──────────────┐
│   Browser    │ ──────────────────► │   Express    │ ────────────────► │  YouTube     │
│  <audio> tag │                     │  (Proxy)     │                    │  CDN Server  │
│              │ ◄═══════════════════│              │ ◄════════════════ │              │
│              │   Audio Stream      │              │   Raw Audio Data   │              │
│              │   (piped bytes)     │              │   (MP4/WebM)       │              │
└─────────────┘                     └──────────────┘                    └──────────────┘
```

### Step-by-Step Breakdown

1. **Search:** The user types a query in the search bar. The frontend sends a `GET /api/search?q=...` request to the backend.

2. **YouTube Music Lookup:** The backend uses the `youtubei.js` library to query YouTube Music's internal API. It extracts song metadata — title, artist, duration, album art URL, and the unique video ID.

3. **Results Cached & Returned:** The results are cached in-memory (using `node-cache`, TTL = 10 minutes) and sent back to the frontend as a JSON array.

4. **Play Request:** When the user clicks a song, the frontend sets the `<audio>` tag's `src` to `/api/stream/{videoId}`.

5. **Stream Proxy:** The backend receives this request and uses `youtube-dl-exec` (a Node.js wrapper around [yt-dlp](https://github.com/yt-dlp/yt-dlp)) to extract the best-quality audio-only stream URL from YouTube.

6. **Audio Piping:** The backend fetches the raw audio bytes from YouTube's CDN and **pipes them directly** to the browser through the Express response. This proxy approach solves CORS issues and hides the YouTube URL from the client.

7. **Seeking Support:** The player supports seeking via HTTP Range requests — when the user scrubs the progress bar, the browser sends a `Range` header, and the backend forwards it to YouTube's CDN for partial content delivery (HTTP 206).

8. **URL Caching:** Extracted stream URLs are cached for 4 hours (YouTube URLs expire after ~6 hours), making subsequent plays and seeks instant.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/search?q={query}` | Search for songs by title, artist, or keyword |
| `GET` | `/api/browse/{category}` | Browse songs by genre/category (e.g., "bollywood", "pop") |
| `GET` | `/api/stream/{videoId}` | Stream audio for a specific song (proxied from YouTube) |
| `GET` | `/api/lyrics/{videoId}` | Fetch lyrics for a song (when available) |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Login and receive a JWT token |
| `GET` | `/api/me/liked` | Get the authenticated user's liked songs |
| `POST` | `/api/me/liked` | Like/unlike a song |
| `GET` | `/api/me/history` | Get the user's listening history |
| `POST` | `/api/me/history` | Add a song to listening history |
| `GET` | `/api/me/playlists` | Get user's playlists |
| `POST` | `/api/me/playlists` | Create a new playlist |

---

## 🗄️ Database Schema

SAREGAMA uses **SQLite** (via `better-sqlite3`) with WAL mode for fast concurrent reads. The database is stored at `backend/.data/saregama.db`.

| Table | Purpose |
|-------|---------|
| `users` | User accounts (id, email, name) |
| `liked_songs` | Songs a user has liked/favorited |
| `history` | Play history with timestamps |
| `playlists` | User-created playlist metadata |
| `playlist_songs` | Songs belonging to each playlist |
| `podcasts_progress` | Podcast episode progress tracking |
| `audiobooks_progress` | Audiobook chapter progress tracking |
| `downloads` | Offline download records |
| `preferences` | User settings and preferences (JSON) |
| `playback_state` | Saved playback state for session resume |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with hooks-based state management |
| **Vite 8** | Lightning-fast dev server and optimized production builds |
| **Tailwind CSS 4** | Utility-first styling with responsive design |
| **Lucide React** | Beautiful, consistent icon library |
| **Zustand** | Lightweight global state management |
| **React Router 7** | Client-side routing |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express 5** | Web framework for REST API |
| **youtubei.js** | YouTube Music internal API client (search, metadata, lyrics) |
| **youtube-dl-exec** | yt-dlp wrapper for extracting audio stream URLs |
| **better-sqlite3** | Embedded SQLite database |
| **node-cache** | In-memory caching layer (TTL-based) |
| **jsonwebtoken** | JWT-based authentication |
| **dotenv** | Environment variable management |

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** v18 or higher ([download here](https://nodejs.org/))
- **npm** (comes bundled with Node.js)
- **Git** ([download here](https://git-scm.com/))

### ⚡ Quick Start (One Command)

```bash
git clone https://github.com/vaibhavrvalakunde2006-gif/SAREGAMA.git
cd SAREGAMA
npm install
npm run dev
```

This single `npm run dev` command uses `concurrently` to start **both** the backend (port 3001) and frontend dev server (port 5173) at the same time. Open **http://localhost:5173** in your browser and you're good to go!

### 🔧 Manual Start (Two Terminals)

If you prefer to run the backend and frontend separately for easier debugging:

**Terminal 1 — Backend:**
```bash
cd backend
npm install
node index.js
```
> ✅ You should see: `SAREGAMA YouTube Engine running on http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```
> ✅ You should see: `Local: http://localhost:5173/`

### 🏭 Production Build (Local Preview)

To test exactly what gets deployed to Render:

```bash
# From the project root
npm install                       # Install all dependencies
npm run build                     # Build the React frontend into frontend/dist/
npm start                         # Start Express serving the built frontend
```

Open **http://localhost:3001** — the backend now serves the compiled React app as static files (no separate frontend dev server needed).

### 🔑 Environment Variables

Create a `backend/.env` file for configuration (optional):

```env
PORT=3001                         # Server port (default: 3001)
JWT_SECRET=your-secret-key        # Secret key for JWT authentication
```

> **Note:** The app works out of the box without any `.env` file. The YouTube Music API does not require an API key — `youtubei.js` handles authentication internally.

### 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find module 'better-sqlite3'` | Run `npm install` inside the `backend/` folder — this native module needs to compile |
| `EADDRINUSE: port 3001` | Another process is using port 3001. Kill it or set `PORT=3002` in your `.env` |
| Songs don't play locally | Make sure the backend is running (`node index.js`) — the frontend proxies audio through it |
| `yt-dlp` errors | Run `npm update youtube-dl-exec` in `backend/` to get the latest yt-dlp binary |
| Frontend shows blank page | Clear browser cache and restart the Vite dev server (`npm run dev`) |

---

## ☁️ Deployment (Render)

The project includes a `render.yaml` Blueprint for one-click deployment to [Render](https://render.com).

### How Production Works
- The **build command** installs dependencies for both frontend and backend, then builds the React app into `frontend/dist/`.
- The **start command** runs the Express backend, which serves the compiled React app as static files.
- A **persistent disk** (1 GB) is mounted at `backend/.data/` to preserve the SQLite database between deploys.

### Known Limitation
> ⚠️ **YouTube blocks audio streaming from datacenter IPs.** The search, UI, and all other features work perfectly on Render. However, playing songs may fail with a 500 error because YouTube detects and blocks requests originating from cloud server IP addresses. This does **not** happen when running locally on your home network.

---

## 🔮 Future Upgrades

| Upgrade | Description |
|---------|-------------|
| 🎵 **Alternative Audio Source** | Integrate JioSaavn or other music APIs as a fallback for streaming when YouTube blocks datacenter requests |
| 🔐 **OAuth Login** | Add Google/GitHub OAuth for a seamless sign-in experience |
| 🔀 **Shuffle & Repeat** | Add shuffle mode, repeat-one, and repeat-all to the player controls |
| 🎨 **Dynamic Themes** | Extract dominant colors from album art and apply them to the UI in real-time |
| 📲 **PWA Support** | Convert to a Progressive Web App for installable, offline-capable experience |
| 🎙️ **Podcast Integration** | Add podcast search, streaming, and episode progress tracking |
| 📖 **Audiobook Player** | Dedicated audiobook player with chapter navigation and bookmarks |
| 🌐 **Social Features** | Share playlists, see what friends are listening to, and collaborative playlists |
| ⚡ **Component Refactor** | Break down `App.jsx` into smaller, modular components for maintainability |
| 🧪 **Testing** | Add unit and integration tests with Vitest and React Testing Library |
| 🎤 **Karaoke Mode** | Highlight lyrics word-by-word in sync with playback |
| 📊 **Listening Stats** | Personal analytics dashboard showing top artists, genres, and listening time |

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).

---

## 👨‍💻 Author

**Vaibhav R Valakunde**

- GitHub: [@vaibhavrvalakunde2006-gif](https://github.com/vaibhavrvalakunde2006-gif)

---

<p align="center">
  Made with ❤️ and lots of 🎵
</p>
