# Rhythmic Realm 🎶

> **Rhythms Redefined: Explore, Collaborate, Create Together.**
> Real-time synchronized music streaming & social chat rooms.

---

## 🌟 Key Features

- **Authenticated Real-Time Chat**: Live WebSocket communication powered by Socket.IO with token-based handshake authentication.
- **MongoDB Persistence**: User accounts, hashed passwords (bcrypt), user profile vibes/genres, rooms, and chat message history persist durably.
- **Synchronized Music Player**: Embedded React HTML5 audio player supporting bidirectional room playback sync (play, pause, seek, and track switches).
- **Private & Curated Rooms**: Dynamic room creation (UUID/custom code) and curated artist rooms (NEFFEX, Aurora, Taylor Swift, etc.).
- **Dynamic Backgrounds & Visuals**: Rotating loop videos and custom cover avatars in the player.
- **Robust Architecture**: Automatic graceful fallback to in-memory mode if Redis or external services are not active.

---

## 🏗️ Project Architecture

```
Rhytmic-Realm/
├── backend/                       # Node.js + Express + Socket.IO (Port 3009)
│   ├── models/                    # Mongoose schemas: User, Room, Message
│   ├── middleware/                # JWT authentication for REST and Sockets
│   ├── routes/                    # REST APIs (/api/auth, /api/rooms, /api/songs)
│   ├── tests/                     # Automated node:test test suite
│   ├── server.js                  # Main server & Socket.IO event handlers
│   └── .env.example
│
├── frontend/                      # React SPA Client (Port 3003)
│   ├── src/components/
│   │   ├── Home/                  # Landing, Navbar, About, Footer
│   │   ├── MusicParty/            # Room picker
│   │   ├── CreateRoom/            # Private room generator
│   │   ├── Chat/                  # Real-time chat & player iframe sync
│   │   ├── Signup/                # Sign Up & Sign In with validation
│   │   └── Profile/               # Profile display & editing
│   └── .env.example
│
└── Advance-Music-Player-React-JS/ # Dedicated React Music Player (Port 3000)
    ├── src/                       # HTML5 audio player with iframe postMessage sync
    └── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB community service (`mongodb://127.0.0.1:27017`) or MongoDB Atlas connection URI.
- **Redis** *(Optional)*: Set `ENABLE_REDIS=true` in `backend/.env` for distributed multi-instance Socket.IO clustering; otherwise runs seamlessly in single-instance mode.

---

### Installation & Setup

#### 1. Backend Server Setup
```bash
cd backend
npm install
cp .env.example .env     # (On Windows PowerShell: Copy-Item .env.example .env)
```

Configure `backend/.env`:
```env
PORT=3009
MONGODB_URI=mongodb://127.0.0.1:27017/rhytmic_realm
JWT_SECRET=rhytmic-realm-super-secret-key-change-in-production
FRONTEND_URL=http://localhost:3003
MUSIC_PLAYER_URL=http://localhost:3000
ENABLE_REDIS=false
```

Start the Backend Server:
```bash
npm run dev
# Starts on http://localhost:3009
```

Run Backend Automated Tests:
```bash
npm test
# Executes all 15 automated integration tests across Auth, Rooms, Sockets & Music Sync
```

---

#### 2. Music Player Setup
```bash
cd ../Advance-Music-Player-React-JS
npm install --legacy-peer-deps
cp .env.example .env     # (On Windows PowerShell: Copy-Item .env.example .env)
npm start
# Starts on http://localhost:3000
```

---

#### 3. Main Frontend Setup
```bash
cd ../frontend
npm install --legacy-peer-deps
cp .env.example .env     # (On Windows PowerShell: Copy-Item .env.example .env)
npm start
# Starts on http://localhost:3003
```

---

## 🧪 Testing and Verification

- **Backend Integration Tests**:
  ```bash
  cd backend
  npm test
  ```
  Tests:
  1. User registration, duplicate checks, password length validation
  2. Bcrypt credential verification and login
  3. Protected endpoints and JWT Bearer validation
  4. Profile updating and MongoDB persistence
  5. Room creation and room info retrieval
  6. Song catalog and room-based artist filtering
  7. Socket.IO authentication and room joining
  8. Real-time chat message broadcast and MongoDB message persistence
  9. Shared music state broadcasting

- **Frontend & Music Player Builds**:
  ```bash
  cd frontend && npm run build
  cd ../Advance-Music-Player-React-JS && npm run build
  ```

---

## 🔒 Security Best Practices

- Passwords are encrypted using salted `bcryptjs` hashes.
- Sockets and API endpoints are protected using verified JSON Web Tokens.
- Chat message payloads are rate-limited and input length is restricted to prevent spam.
- In-memory Socket.IO state gracefully falls back if Redis is not configured, avoiding unhandled crashes.
- Sensitive fields like passwords are strictly omitted from API output.
