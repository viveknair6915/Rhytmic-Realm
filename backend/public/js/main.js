const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Get username and room from URL
const params = new URLSearchParams(window.location.search);
const username = params.get('username');
const room = params.get('room');
const socket = io();

// Set Music Player URL (Update this with your Vercel URL in production)
const MUSIC_PLAYER_URL = 'https://rhytmic-realm-tgx5.vercel.app'; // Replace with your actual Vercel URL or keep localhost for dev if running locally
const iframe = document.getElementById('music-player-frame');
if (iframe) {
  // Check if running on localhost to toggle (optional logic, but for now let's just default to the production one or logic)
  // For this specific user request, they want the DEPLOYED version to work.
  // If they are on localhost, they probably want localhost.
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    iframe.src = 'http://localhost:3000/?room=' + room;
  } else {
    iframe.src = 'https://rhytmic-realm-tgx5.vercel.app/?room=' + room; // GENERIC PLACEHOLDER - User must update!
  }
}




// Join chatroom
socket.emit('joinRoom', { username, room });

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');

  // Check if message is from current user
  if (message.username === username) {
    div.classList.add('current-user');
  } else {
    div.classList.add('other-user');
  }

  const p = document.createElement('p');
  p.classList.add('meta');
  p.style.color = message.username === username ? '#fff' : 'lime'; // Different color for meta
  p.innerText = message.username;
  p.innerHTML += `<span> ${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
  const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
  if (leaveRoom) {
    window.location = '../index.html';
  } else {
  }
});
