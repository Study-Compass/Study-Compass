import React from 'react';
import './App.css';
import Room from './pages/Room';
import Login from './pages/Login';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />}/>
                    <Route path="/room/:roomid" element={<Room />}/>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
