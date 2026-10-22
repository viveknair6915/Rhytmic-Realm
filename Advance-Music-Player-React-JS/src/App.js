import { useRef, useState, useEffect, useCallback } from 'react';
import { FaStepBackward, FaStepForward, FaPlayCircle, FaPauseCircle } from 'react-icons/fa';
import './App.css';

function App() {

  const [currentMusicDetails, setCurrentMusicDetails] = useState({
    songName: 'Chasing',
    songArtist: 'NEFFEX',
    songSrc: 'https://rhytmic-realm-tgx5.vercel.app/Assets/songs/Chasing - NEFFEX.mp3',
    songAvatar: 'https://rhytmic-realm-tgx5.vercel.app/Assets/Images/image1.jpg'
  });

  //UseStates Variables
  const [audioProgress, setAudioProgress] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [musicIndex, setMusicIndex] = useState(0);
  const [musicTotalLength, setMusicTotalLength] = useState('04 : 38');
  const [musicCurrentTime, setMusicCurrentTime] = useState('00 : 00');
  const [videoIndex, setVideoIndex] = useState(0);

  const currentAudio = useRef();

  // Helper to notify parent frame (Chat room) for synchronized playback
  const notifyParent = useCallback((action, payload = {}) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'MUSIC_PLAYER_ACTION',
          action,
          ...payload
        }, '*');
      }
    } catch (_) {}
  }, []);

  const handleMusicProgressBar = (e) => {
    const val = parseFloat(e.target.value);
    setAudioProgress(val);
    if (currentAudio.current && currentAudio.current.duration) {
      const targetTime = (val * currentAudio.current.duration) / 100;
      currentAudio.current.currentTime = targetTime;
      notifyParent('seek', { currentTime: targetTime });
    }
  };

  //Change Avatar Class
  const avatarClass = ['objectFitCover', 'objectFitContain', 'none'];
  const [avatarClassIndex, setAvatarClassIndex] = useState(0);
  const handleAvatar = () => {
    if (avatarClassIndex >= avatarClass.length - 1) {
      setAvatarClassIndex(0);
    } else {
      setAvatarClassIndex(avatarClassIndex + 1);
    }
  };

  //Play Audio Function
  const handleAudioPlay = () => {
    if (!currentAudio.current) return;
    if (currentAudio.current.paused) {
      currentAudio.current.play().then(() => {
        setIsAudioPlaying(true);
        notifyParent('play', { currentTime: currentAudio.current.currentTime });
      }).catch(err => {
        console.warn("Playback prevented or error:", err);
      });
    } else {
      currentAudio.current.pause();
      setIsAudioPlaying(false);
      notifyParent('pause', { currentTime: currentAudio.current.currentTime });
    }
  };

  const [musicAPI, setMusicAPI] = useState([]);

  useEffect(() => {
    // Get room from URL query parameters (passed from parent iframe src)
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');

    // Construct API URL with room filter
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3009';
    const apiUrl = room
      ? `${BACKEND_URL}/api/songs?room=${encodeURIComponent(room)}`
      : `${BACKEND_URL}/api/songs`;

    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMusicAPI(data);
          setCurrentMusicDetails(data[0]);
          if (currentAudio.current) {
            currentAudio.current.src = data[0].songSrc;
          }
        }
      })
      .catch(err => console.error("Error fetching music:", err));
  }, []);

  // Listen for sync messages from parent frame
  useEffect(() => {
    const handleSyncMessage = (event) => {
      if (!event.data || event.data.type !== 'SYNC_MUSIC_STATE') return;
      const { isPlaying, currentTime, songName, songArtist, songSrc, songAvatar } = event.data;

      // Update track if changed
      if (songSrc && currentAudio.current && !currentAudio.current.src.includes(encodeURI(songSrc)) && currentAudio.current.src !== songSrc) {
        currentAudio.current.src = songSrc;
        setCurrentMusicDetails({
          songName: songName || 'Track',
          songArtist: songArtist || 'Artist',
          songSrc,
          songAvatar: songAvatar || './Assets/Images/image1.jpg'
        });
      }

      // Sync position if difference > 1.5s
      if (typeof currentTime === 'number' && currentAudio.current && currentAudio.current.duration) {
        if (Math.abs(currentAudio.current.currentTime - currentTime) > 1.5) {
          currentAudio.current.currentTime = currentTime;
        }
      }

      // Sync play/pause state
      if (currentAudio.current) {
        if (isPlaying && currentAudio.current.paused) {
          currentAudio.current.play().then(() => setIsAudioPlaying(true)).catch(() => {});
        } else if (!isPlaying && !currentAudio.current.paused) {
          currentAudio.current.pause();
          setIsAudioPlaying(false);
        }
      }
    };

    window.addEventListener('message', handleSyncMessage);
    return () => window.removeEventListener('message', handleSyncMessage);
  }, []);

  const handleNextSong = () => {
    if (!musicAPI.length) return;
    const nextIdx = musicIndex >= musicAPI.length - 1 ? 0 : musicIndex + 1;
    setMusicIndex(nextIdx);
    updateCurrentMusicDetails(nextIdx);
  };

  const handlePrevSong = () => {
    if (!musicAPI.length) return;
    const prevIdx = musicIndex === 0 ? musicAPI.length - 1 : musicIndex - 1;
    setMusicIndex(prevIdx);
    updateCurrentMusicDetails(prevIdx);
  };

  const updateCurrentMusicDetails = (number) => {
    const musicObject = musicAPI[number];
    if (!musicObject || !currentAudio.current) return;

    currentAudio.current.src = musicObject.songSrc;
    currentAudio.current.play().then(() => {
      setIsAudioPlaying(true);
    }).catch(() => {});

    const details = {
      songName: musicObject.songName,
      songArtist: musicObject.songArtist,
      songSrc: musicObject.songSrc,
      songAvatar: musicObject.songAvatar
    };
    setCurrentMusicDetails(details);
    notifyParent('changeTrack', details);
  };

  const handleAudioUpdate = () => {
    if (!currentAudio.current || !currentAudio.current.duration) return;

    // Input total length of the audio
    const minutes = Math.floor(currentAudio.current.duration / 60);
    const seconds = Math.floor(currentAudio.current.duration % 60);
    const musicTotalLength0 = `${minutes < 10 ? `0${minutes}` : minutes} : ${seconds < 10 ? `0${seconds}` : seconds}`;
    setMusicTotalLength(musicTotalLength0);

    // Input Music Current Time
    const currentMin = Math.floor(currentAudio.current.currentTime / 60);
    const currentSec = Math.floor(currentAudio.current.currentTime % 60);
    const musicCurrentT = `${currentMin < 10 ? `0${currentMin}` : currentMin} : ${currentSec < 10 ? `0${currentSec}` : currentSec}`;
    setMusicCurrentTime(musicCurrentT);

    const progress = parseInt((currentAudio.current.currentTime / currentAudio.current.duration) * 100);
    setAudioProgress(isNaN(progress) ? 0 : progress);
  };

  const vidArray = ['./Assets/Videos/video1.mp4', './Assets/Videos/video2.mp4', './Assets/Videos/video3.mp4', './Assets/Videos/video4.mp4', './Assets/Videos/video5.mp4', './Assets/Videos/video6.mp4'];

  const handleChangeBackground = () => {
    if (videoIndex >= vidArray.length - 1) {
      setVideoIndex(0);
    } else {
      setVideoIndex(videoIndex + 1);
    }
  };

  return (
    <>
      <div className="container">
        <audio
          src={currentMusicDetails.songSrc}
          ref={currentAudio}
          onEnded={handleNextSong}
          onTimeUpdate={handleAudioUpdate}
          onError={(e) => console.warn("Audio source load error, audio will retry on track switch:", e)}
        ></audio>
        <video src={vidArray[videoIndex]} loop muted autoPlay className='backgroundVideo'></video>
        <div className="blackScreen"></div>

        <div className="music-Container">
          <p className='musicPlayer'>Music Player</p>
          <p className='music-Head-Name'>{currentMusicDetails.songName}</p>
          <p className='music-Artist-Name'>{currentMusicDetails.songArtist}</p>
          <img src={currentMusicDetails.songAvatar} className={avatarClass[avatarClassIndex]} onClick={handleAvatar} alt="song Avatar" id='songAvatar' />
          <div className="musicTimerDiv">
            <p className='musicCurrentTime'>{musicCurrentTime}</p>
            <p className='musicTotalLenght'>{musicTotalLength}</p>
          </div>
          <input type="range" name="musicProgressBar" className='musicProgressBar' value={audioProgress} onChange={handleMusicProgressBar} />

          <div className="musicControlers">
            <FaStepBackward className='musicControler' onClick={handlePrevSong} />
            {isAudioPlaying ?
              <FaPauseCircle className='playBtn' onClick={handleAudioPlay} /> :
              <FaPlayCircle className='playBtn' onClick={handleAudioPlay} />
            }
            <FaStepForward className='musicControler' onClick={handleNextSong} />
          </div>
        </div>

        <div className="changeBackBtn" onClick={handleChangeBackground}>
          Change Background
        </div>
      </div >
    </>
  );
}

export default App;
