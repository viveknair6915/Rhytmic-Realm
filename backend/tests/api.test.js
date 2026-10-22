const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const mongoose = require('mongoose');
const ioClient = require('socket.io-client');

// Import the configured Express app and Server
const { app, server } = require('../server');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

const TEST_PORT = 3199;
let baseUrl;
let authToken;
let testUserEmail;
let testRoomCode = `test-room-${Date.now()}`;

before(async () => {
  // Ensure DB connection
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rhytmic_realm';
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI);
  }

  // Start HTTP server on test port on 127.0.0.1
  await new Promise((resolve) => {
    server.listen(TEST_PORT, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${TEST_PORT}`;
      resolve();
    });
  });
});

after(async () => {
  // Clean up test data
  if (testUserEmail) {
    await User.deleteMany({ email: testUserEmail });
  }
  await Room.deleteMany({ code: testRoomCode });
  await Message.deleteMany({ room: testRoomCode });

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

describe('1. Authentication & User Profile Suite', () => {
  testUserEmail = `tester_${Date.now()}@example.com`;

  test('POST /api/auth/signup - Registers new user successfully', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'RockstarTester',
        email: testUserEmail,
        password: 'Password123!'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.token, 'Response must include JWT token');
    assert.strictEqual(data.user.email, testUserEmail);
    assert.strictEqual(data.user.username, 'RockstarTester');
    assert.strictEqual(data.user.password, undefined, 'Password must not be exposed');
    authToken = data.token;
  });

  test('POST /api/auth/signup - Rejects duplicate email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'DifferentUser',
        email: testUserEmail,
        password: 'AnotherPassword!'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.match(data.message, /already exists/i);
  });

  test('POST /api/auth/signup - Rejects invalid/short password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ShortPassUser',
        email: `short_${Date.now()}@example.com`,
        password: '123'
      })
    });

    assert.strictEqual(res.status, 400);
  });

  test('POST /api/auth/login - Logs in with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'Password123!'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.token);
    assert.strictEqual(data.user.username, 'RockstarTester');
  });

  test('POST /api/auth/login - Rejects invalid password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'WrongPassword!'
      })
    });

    assert.strictEqual(res.status, 401);
  });

  test('GET /api/auth/me - Access protected profile with Bearer token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.email, testUserEmail);
  });

  test('GET /api/auth/me - Rejects unauthenticated access', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(res.status, 401);
  });

  test('PUT /api/auth/profile - Updates user vibe and genre in MongoDB', async () => {
    const res = await fetch(`${baseUrl}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        vibe: 'Cyberpunk Synthwave',
        genre: 'Electronic / Synth'
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.user.vibe, 'Cyberpunk Synthwave');
    assert.strictEqual(data.user.genre, 'Electronic / Synth');

    // Verify directly in MongoDB
    const persisted = await User.findOne({ email: testUserEmail });
    assert.strictEqual(persisted.vibe, 'Cyberpunk Synthwave');
  });
});

describe('2. Room Lifecycle Suite', () => {
  test('POST /api/rooms - Creates private room with host info', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Vip Lounge',
        code: testRoomCode,
        isPrivate: true
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.room.code, testRoomCode);
    assert.strictEqual(data.room.isPrivate, true);
    assert.strictEqual(data.room.hostUsername, 'RockstarTester');
  });

  test('GET /api/rooms/:code - Retrieves room details', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/${testRoomCode}`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.code, testRoomCode);
    assert.strictEqual(data.isPrivate, true);
  });
});

describe('3. Music Catalog API', () => {
  test('GET /api/songs - Returns list of available tracks', async () => {
    const res = await fetch(`${baseUrl}/api/songs`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.ok(data[0].songName);
    assert.ok(data[0].songSrc);
  });

  test('GET /api/songs?room=NEFFEX - Filters songs by artist/room matching', async () => {
    const res = await fetch(`${baseUrl}/api/songs?room=NEFFEX`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.some(s => s.songArtist.toUpperCase().includes('NEFFEX')));
  });
});

describe('4. Real-time Socket.IO Chat & Synchronized Playback', () => {
  let socketClient;

  test('Connects to Socket.IO with token and joins room', async () => {
    socketClient = ioClient(baseUrl, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      socketClient.on('connect', resolve);
      socketClient.on('connect_error', reject);
    });

    assert.ok(socketClient.connected, 'Socket client must be connected');

    // Join room
    socketClient.emit('joinRoom', {
      username: 'RockstarTester',
      room: testRoomCode
    });

    // Await welcome message
    const welcome = await new Promise((resolve) => {
      socketClient.once('message', resolve);
    });
    assert.ok(welcome.text.includes(testRoomCode));
  });

  test('Sends chat message, broadcasts to room, and persists to MongoDB', async () => {
    const testMsgText = 'Test message for persistence verification!';

    const messagePromise = new Promise((resolve) => {
      socketClient.on('message', (msg) => {
        if (msg.text === testMsgText) {
          resolve(msg);
        }
      });
    });

    socketClient.emit('chatMessage', testMsgText);
    const received = await messagePromise;

    assert.strictEqual(received.username, 'RockstarTester');
    assert.strictEqual(received.text, testMsgText);

    // Verify persisted in MongoDB Message model
    const dbMsg = await Message.findOne({ room: testRoomCode, text: testMsgText });
    assert.ok(dbMsg, 'Message must be found in MongoDB Message collection');
    assert.strictEqual(dbMsg.username, 'RockstarTester');
  });

  test('Synchronizes shared music play state to room participants', async () => {
    const musicPromise = new Promise((resolve) => {
      socketClient.on('music:stateUpdate', (state) => {
        if (state.isPlaying === true && state.currentTime === 75) {
          resolve(state);
        }
      });
    });

    socketClient.emit('music:play', { currentTime: 75 });
    const musicState = await musicPromise;

    assert.strictEqual(musicState.isPlaying, true);
    assert.strictEqual(musicState.currentTime, 75);

    socketClient.disconnect();
  });
});
