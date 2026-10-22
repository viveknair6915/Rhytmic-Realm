const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [60, 'Room name cannot exceed 60 characters']
  },
  code: {
    type: String,
    required: [true, 'Room code is required'],
    unique: true,
    trim: true,
    index: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  passcode: {
    type: String,
    default: null
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  hostUsername: {
    type: String,
    default: 'System'
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  currentMusicState: {
    songName: { type: String, default: 'Chasing' },
    songArtist: { type: String, default: 'NEFFEX' },
    songSrc: { type: String, default: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/Chasing - NEFFEX.mp3' },
    songAvatar: { type: String, default: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image1.jpg' },
    isPlaying: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', roomSchema);
