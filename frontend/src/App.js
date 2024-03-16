import React, { useState, useRef } from 'react';
import { Navbar } from './components/Home/Navbar.jsx';
import Home from './components/Home/Home';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import About from './components/About/About.jsx';
import Profile from './components/Profile/Profile.jsx';
import JoinPage from './components/MusicParty/JoinPage.jsx';
// import ChatComponent from './components/MusicParty/ChatComponent.jsx'
import SignUp from './components/Signup/SignUp.jsx';
import CreateRoom from './components/CreateRoom/CreateRoom.jsx'


function App() {
 

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/musicparty" element={<JoinPage />} />
        <Route path="/createroom" element={<CreateRoom />} />
      </Routes> 
    </BrowserRouter>
  );
}

export default App;
