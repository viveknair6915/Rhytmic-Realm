// Resilient in-memory fallback store when MongoDB is not connected (e.g. initial cloud deployments)
const memoryUsers = [];
const memoryRooms = [];
const memoryMessages = [];

// Seed demo users in memory fallback store
(async () => {
  const bcrypt = require('bcryptjs');
  const hashedPass = await bcrypt.hash('Password123!', 10);
  memoryUsers.push(
    {
      id: 'demo-user-1',
      _id: 'demo-user-1',
      username: 'AlexRhythm',
      email: 'demo@rhythmicrealm.com',
      password: hashedPass,
      vibe: 'Chill Lo-Fi & Synthwave',
      genre: 'Indie Pop / Electronic',
      createdAt: new Date()
    },
    {
      id: 'demo-user-2',
      _id: 'demo-user-2',
      username: 'BeatMaster',
      email: 'beatmaster@rhythmicrealm.com',
      password: hashedPass,
      vibe: 'High Energy Hip-Hop',
      genre: 'Hip-Hop / Rap',
      createdAt: new Date()
    }
  );
})();

module.exports = {
  memoryUsers,
  memoryRooms,
  memoryMessages
};
