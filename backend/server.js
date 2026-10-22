const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");
const { verifySocketToken } = require("./middleware/auth");
const Room = require("./models/Room");
const Message = require("./models/Message");
const { memoryMessages } = require("./models/memoryStore");

// Routers
const authRouter = require("./routes/auth");
const roomsRouter = require("./routes/rooms");

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3003",
  "http://localhost:5173",
  "https://rhytmic-realm.vercel.app",
  "https://rhytmic-realm-tgx5.vercel.app"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.MUSIC_PLAYER_URL) {
  allowedOrigins.push(process.env.MUSIC_PLAYER_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in development
  },
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/rhytmic_realm";

mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI)
  .then(() => console.log(` Connected to MongoDB at ${MONGODB_URI}`))
  .catch((err) => {
    console.error(" MongoDB Connection Error:", err.message);
    console.warn("⚠️ Warning: Running without persistent MongoDB. Ensure local mongod is running for persistence.");
  });

// Setup Socket.IO
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Optional Redis Adapter Setup
if (process.env.ENABLE_REDIS === "true" || process.env.REDIS_URL) {
  try {
    const { createAdapter } = require("@socket.io/redis-adapter");
    const { createClient } = require("redis");
    const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()])
      .then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log(" Socket.IO Redis adapter enabled on", redisUrl);
      })
      .catch((err) => {
        console.warn(" Redis connection failed, falling back to in-memory adapter:", err.message);
      });
  } catch (err) {
    console.warn(" Redis setup skipped or failed:", err.message);
  }
} else {
  console.log("ℹ️ Socket.IO running in single-instance in-memory mode.");
}

const botName = "RythmRealm Bot";

// Built-in Music Catalog
const musicData = [
  {
    songName: 'Chasing',
    songArtist: 'NEFFEX',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/Chasing - NEFFEX.mp3',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image1.jpg'
  },
  {
    songName: 'AURORA - Runaway',
    songArtist: 'Aurora Aksnes',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/AURORA - Runaway (Lyrics).mp3',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image4.jpg'
  },
  {
    songName: 'Catch Me If I Fall',
    songArtist: 'TEGNENT',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/Catch Me If I Fall - NEFFEX.mp3',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image2.jpg'
  },
  {
    songName: 'Inspired (Clean)',
    songArtist: 'NEFFEX',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/Inspired (Clean) - NEFFEX.mp3',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image3.jpg'
  },
  {
    songName: 'Baby doll [ slowed + reverb ]',
    songArtist: 'Kanika Kapoor',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/Baby doll [ slowed + reverb ] __ meet bros ,Kanika Kapoor __ jr santu.mp3',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image5.jpg'
  },
  {
    songName: 'Soch (Slowed+Reverbed)',
    songArtist: 'Hardy Sandhu',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/SOCH(Slowed+Reverbed) __ Hardy Sandhu.webm',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image6.jpg'
  },
  {
    songName: 'Apna Bana Le',
    songArtist: 'Arijit Singh',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/Apna Bana Le - Full Audio _ Bhediya _ Varun Dhawan, Kriti Sanon_ Sachin-Jigar,Arijit Singh,Amitabh B.webm',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image7.jpg'
  }
];

// Mount REST API Routes
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);

// Backward compatibility routes for legacy callers
app.post("/api/signup", (req, res, next) => authRouter.handle(req, res, next));
app.post("/api/login", (req, res, next) => authRouter.handle(req, res, next));

// Songs API with room-based filtering
app.get('/api/songs', (req, res) => {
  const { room } = req.query;

  if (room) {
    const formattedRoom = room.toLowerCase().replace(/-/g, ' ');
    const filtered = musicData.filter(song => {
      const artist = song.songArtist.toLowerCase();
      const name = song.songName.toLowerCase();
      return artist.includes(formattedRoom) || formattedRoom.includes(artist) || name.includes(formattedRoom);
    });

    if (filtered.length > 0) {
      return res.json(filtered);
    }
  }

  // Fallback: return all music
  res.json(musicData);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Authoritative room music state cache in memory for low-latency sync
const roomMusicStates = new Map();

// Rate-limiting map for sockets (prevents chat spam)
const socketRateLimits = new Map();

// Socket.IO Handshake Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      const user = await verifySocketToken(token);
      if (user) {
        socket.user = user;
      }
    }
    next();
  } catch (err) {
    next(); // Proceed as guest
  }
});

// Socket.IO Event Handlers
io.on("connection", (socket) => {
  // Join Room
  socket.on("joinRoom", async ({ username, room }) => {
    // Use authenticated username if available, else provided username
    const verifiedUsername = (socket.user && socket.user.username) ? socket.user.username : (username || 'Guest');
    const targetRoom = room || 'Lounge';

    const user = userJoin(socket.id, verifiedUsername, targetRoom);
    socket.username = verifiedUsername;
    socket.room = targetRoom;

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, `Welcome to RhythmRealm room: ${user.room}!`));

    // Send recent message history from MongoDB
    try {
      const history = await Message.find({ room: user.room })
        .sort({ createdAt: -1 })
        .limit(30);

      const formattedHistory = history.reverse().map(m => ({
        username: m.username,
        text: m.text,
        time: m.time || new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      socket.emit("messageHistory", formattedHistory);
    } catch (err) {
      console.warn("Could not load message history:", err.message);
    }

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit("message", formatMessage(botName, `${user.username} has joined the chat`));

    // Send active users list
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    // Send current authoritative room music state
    let currentState = roomMusicStates.get(user.room);
    if (!currentState) {
      // Initialize room music state from matching song or default
      const defaultSong = musicData[0];
      currentState = {
        songName: defaultSong.songName,
        songArtist: defaultSong.songArtist,
        songSrc: defaultSong.songSrc,
        songAvatar: defaultSong.songAvatar,
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now()
      };
      roomMusicStates.set(user.room, currentState);
    }
    socket.emit("music:stateUpdate", currentState);
  });

  // Chat message event
  socket.on("chatMessage", async (msg) => {
    const user = getCurrentUser(socket.id);
    if (!user || !user.room) return;

    // Rate-limiting check (max 5 messages per 2 seconds)
    const now = Date.now();
    const limitData = socketRateLimits.get(socket.id) || { count: 0, resetAt: now + 2000 };
    if (now > limitData.resetAt) {
      limitData.count = 0;
      limitData.resetAt = now + 2000;
    }
    limitData.count++;
    socketRateLimits.set(socket.id, limitData);

    if (limitData.count > 5) {
      socket.emit("message", formatMessage(botName, "⚠️ You are sending messages too quickly. Please slow down."));
      return;
    }

    // Validation
    const cleanText = (typeof msg === 'string' ? msg : '').trim();
    if (!cleanText || cleanText.length > 1000) return;

    const formatted = formatMessage(user.username, cleanText);

    // Save message to MongoDB or fallback in-memory store
    try {
      if (mongoose.connection.readyState === 1) {
        const newMsg = new Message({
          room: user.room,
          sender: socket.user ? (socket.user._id || socket.user.id) : null,
          username: user.username,
          text: cleanText,
          time: formatted.time
        });
        await newMsg.save();
      } else {
        memoryMessages.push({
          room: user.room,
          username: user.username,
          text: cleanText,
          time: formatted.time,
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.warn("Failed to persist message to MongoDB, saving in memory:", err.message);
      memoryMessages.push({
        room: user.room,
        username: user.username,
        text: cleanText,
        time: formatted.time,
        createdAt: new Date()
      });
    }

    // Broadcast to room
    io.to(user.room).emit("message", formatted);
  });

  // Shared Music Controls
  socket.on("music:play", ({ currentTime }) => {
    const user = getCurrentUser(socket.id);
    if (!user || !user.room) return;

    let state = roomMusicStates.get(user.room) || {};
    state.isPlaying = true;
    if (typeof currentTime === 'number') state.currentTime = currentTime;
    state.lastUpdated = Date.now();
    roomMusicStates.set(user.room, state);

    io.to(user.room).emit("music:stateUpdate", state);
  });

  socket.on("music:pause", ({ currentTime }) => {
    const user = getCurrentUser(socket.id);
    if (!user || !user.room) return;

    let state = roomMusicStates.get(user.room) || {};
    state.isPlaying = false;
    if (typeof currentTime === 'number') state.currentTime = currentTime;
    state.lastUpdated = Date.now();
    roomMusicStates.set(user.room, state);

    io.to(user.room).emit("music:stateUpdate", state);
  });

  socket.on("music:seek", ({ currentTime }) => {
    const user = getCurrentUser(socket.id);
    if (!user || !user.room) return;

    let state = roomMusicStates.get(user.room) || {};
    if (typeof currentTime === 'number') state.currentTime = currentTime;
    state.lastUpdated = Date.now();
    roomMusicStates.set(user.room, state);

    io.to(user.room).emit("music:stateUpdate", state);
  });

  socket.on("music:changeTrack", (trackData) => {
    const user = getCurrentUser(socket.id);
    if (!user || !user.room) return;

    const state = {
      songName: trackData.songName || 'Track',
      songArtist: trackData.songArtist || 'Artist',
      songSrc: trackData.songSrc,
      songAvatar: trackData.songAvatar,
      isPlaying: true,
      currentTime: 0,
      lastUpdated: Date.now()
    };
    roomMusicStates.set(user.room, state);

    // Save current track to Room model asynchronously
    Room.findOneAndUpdate({ code: user.room }, { currentMusicState: state }).exec().catch(() => {});

    io.to(user.room).emit("music:stateUpdate", state);
  });

  // Disconnect event
  socket.on("disconnect", () => {
    socketRateLimits.delete(socket.id);
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3009;

if (require.main === module) {
  server.listen(PORT, () => console.log(`🚀 Rhythmic Realm Server running on port ${PORT}`));
}

module.exports = { app, server };
