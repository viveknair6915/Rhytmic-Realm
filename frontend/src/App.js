import React from 'react';
import { Navbar } from './components/Home/Navbar.jsx';
import Home from './components/Home/Home';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import About from './components/About/About.jsx';
import Profile from './components/Profile/Profile.jsx';
import JoinPage from './components/MusicParty/JoinPage.jsx';
import SignUp from './components/Signup/SignUp.jsx';
import CreateRoom from './components/CreateRoom/CreateRoom.jsx';
import Chat from './components/Chat/Chat.jsx';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={
          <>
            <div id="home">
              <Home />
            </div>
            <div id="about">
              <About />
            </div>
          </>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/musicparty" element={<JoinPage />} />
        <Route path="/createroom" element={<CreateRoom />} />
        <Route path="/chat" element={<Chat />} />
        {/* Graceful fallback for unknown paths to preserve UX */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
