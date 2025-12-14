const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const cors = require("cors");

const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");
require("dotenv").config();
const { createClient } = redis;
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3003", "https://rhytmic-realm.vercel.app", "https://rhytmic-realm-tgx5.vercel.app"],
  credentials: true
}));
app.use(express.json()); // Enable JSON body parsing

const botName = "RythmRealm Bot";

// (async () => {
//   pubClient = createClient({ url: "redis://127.0.0.1:6379" });
//   await pubClient.connect();
//   subClient = pubClient.duplicate();
//   io.adapter(createAdapter(pubClient, subClient));
// })();

const users = []; // In-memory user store

// Auth Routes
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;

  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = { id: Date.now(), username, email, password };
  users.push(newUser);

  res.status(201).json({ message: 'User created successfully', user: { username, email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    res.json({ message: 'Login successful', user: { username: user.username, email: user.email } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Run when client connects
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

app.get('/api/songs', (req, res) => {
  const { room } = req.query;

  if (room) {
    const filtered = musicData.filter(song => {
      const roomName = room.toLowerCase().replace(/-/g, ' ');
      const artistName = song.songArtist.toLowerCase();
      return artistName.includes(roomName) || roomName.includes(artistName);
    });

    if (filtered.length > 0) {
      return res.json(filtered);
    }
    // Fallback: Use all music if no specific artist matches the room
  }

  // Default/Fallback
  res.json(musicData);
});

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to RythmRealm!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
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

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
