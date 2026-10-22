const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Message = require('../models/Message');
const { optionalAuth, authenticateToken } = require('../middleware/auth');

// GET /api/rooms - List accessible rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .select('name code hostUsername isPrivate currentMusicState createdAt')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Failed to fetch rooms.' });
  }
});

// POST /api/rooms - Create a new room
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, code, isPrivate, passcode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Room name is required.' });
    }

    const roomCode = (code && code.trim()) ? code.trim() : `room-${Date.now()}`;

    // Check if room code already exists
    let existingRoom = await Room.findOne({ code: roomCode });
    if (existingRoom) {
      return res.status(400).json({ message: 'A room with this ID already exists. Please choose another or join it.' });
    }

    const hostId = req.user ? req.user._id : null;
    const hostUsername = req.user ? req.user.username : 'Host';

    const newRoom = new Room({
      name: name.trim(),
      code: roomCode,
      isPrivate: Boolean(isPrivate),
      passcode: passcode || null,
      host: hostId,
      hostUsername,
      members: hostId ? [hostId] : []
    });

    await newRoom.save();

    res.status(201).json({
      message: 'Room created successfully',
      room: newRoom
    });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ message: 'Failed to create room.' });
  }
});

// GET /api/rooms/:code - Get room info
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    let room = await Room.findOne({ code });

    if (!room) {
      // If room is one of default singer rooms, auto-provision it
      const defaultRooms = ['Taylor-Swift', 'Harry-Styles', 'mitski', 'The-Weekend', 'OneRepublic', 'OneScript', 'Lounge'];
      if (defaultRooms.includes(code)) {
        room = new Room({
          name: code.replace(/-/g, ' '),
          code: code,
          isPrivate: false,
          hostUsername: 'System'
        });
        await room.save();
      } else {
        return res.status(404).json({ message: 'Room not found.' });
      }
    }

    res.json({
      name: room.name,
      code: room.code,
      isPrivate: room.isPrivate,
      hostUsername: room.hostUsername,
      currentMusicState: room.currentMusicState
    });
  } catch (err) {
    console.error('Error fetching room details:', err);
    res.status(500).json({ message: 'Failed to retrieve room details.' });
  }
});

// GET /api/rooms/:code/messages - Get recent message history
router.get('/:code/messages', async (req, res) => {
  try {
    const { code } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const messages = await Message.find({ room: code })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return in chronological order
    res.json(messages.reverse());
  } catch (err) {
    console.error('Error fetching room messages:', err);
    res.status(500).json({ message: 'Failed to load messages.' });
  }
});

module.exports = router;
