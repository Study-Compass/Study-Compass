import React from 'react';
import './App.css';
import Room from './pages/Room';
import Login from './pages/Login';
import Reigster from './pages/Register/Register';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />}/>
                    <Route path="/room/:roomid" element={<Room />}/>
                    <Route path="/register" element={<Reigster />}/>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
