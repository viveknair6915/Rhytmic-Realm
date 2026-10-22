const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Room = require('../models/Room');
const Message = require('../models/Message');
const { memoryRooms, memoryMessages } = require('../models/memoryStore');
const { optionalAuth } = require('../middleware/auth');

// GET /api/rooms - List accessible rooms
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const rooms = await Room.find({ isPrivate: false })
        .select('name code hostUsername isPrivate currentMusicState createdAt')
        .sort({ createdAt: -1 })
        .limit(20);
      return res.json(rooms);
    }
    res.json(memoryRooms.filter(r => !r.isPrivate));
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.json(memoryRooms.filter(r => !r.isPrivate));
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
    const hostId = req.user ? (req.user._id || req.user.id) : null;
    const hostUsername = req.user ? req.user.username : 'Host';

    if (mongoose.connection.readyState === 1) {
      let existingRoom = await Room.findOne({ code: roomCode });
      if (existingRoom) {
        return res.status(400).json({ message: 'A room with this ID already exists. Please choose another or join it.' });
      }

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

      return res.status(201).json({
        message: 'Room created successfully',
        room: newRoom
      });
    }

    // In-memory fallback
    const existing = memoryRooms.find(r => r.code === roomCode);
    if (existing) {
      return res.status(400).json({ message: 'A room with this ID already exists.' });
    }

    const newMemRoom = {
      name: name.trim(),
      code: roomCode,
      isPrivate: Boolean(isPrivate),
      passcode: passcode || null,
      hostUsername,
      createdAt: new Date()
    };
    memoryRooms.push(newMemRoom);

    res.status(201).json({
      message: 'Room created successfully',
      room: newMemRoom
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
    const defaultRooms = ['Taylor-Swift', 'Harry-Styles', 'mitski', 'The-Weekend', 'OneRepublic', 'OneScript', 'Lounge'];

    if (mongoose.connection.readyState === 1) {
      let room = await Room.findOne({ code });

      if (!room && defaultRooms.includes(code)) {
        room = new Room({
          name: code.replace(/-/g, ' '),
          code: code,
          isPrivate: false,
          hostUsername: 'System'
        });
        await room.save();
      }

      if (room) {
        return res.json({
          name: room.name,
          code: room.code,
          isPrivate: room.isPrivate,
          hostUsername: room.hostUsername,
          currentMusicState: room.currentMusicState
        });
      }
    }

    // In-memory fallback
    let memRoom = memoryRooms.find(r => r.code === code);
    if (!memRoom && defaultRooms.includes(code)) {
      memRoom = {
        name: code.replace(/-/g, ' '),
        code: code,
        isPrivate: false,
        hostUsername: 'System'
      };
      memoryRooms.push(memRoom);
    }

    if (memRoom) {
      return res.json(memRoom);
    }

    res.status(404).json({ message: 'Room not found.' });
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

    if (mongoose.connection.readyState === 1) {
      const messages = await Message.find({ room: code })
        .sort({ createdAt: -1 })
        .limit(limit);

      return res.json(messages.reverse());
    }

    const memMsgs = memoryMessages.filter(m => m.room === code).slice(-limit);
    res.json(memMsgs);
  } catch (err) {
    console.error('Error fetching room messages:', err);
    res.json([]);
  }
});

module.exports = router;
