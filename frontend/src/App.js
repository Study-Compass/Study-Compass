import React from 'react';
import './App.css';
import Room from './pages/Room';
import Login from './pages/Login';
import Reigster from './pages/Register/Register';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
    return (
        <GoogleOAuthProvider clientId="639818062398-k4qnm9l320phu967ctc2l1jt1sp9ib7p.apps.googleusercontent.com">
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Login />}/>
                        <Route path="/room/:roomid" element={<Room />}/>
                        <Route path="/register" element={<Reigster />}/>
                    </Routes>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
