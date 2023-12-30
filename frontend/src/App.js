import React from 'react';
import './App.css';
import Room from './pages/Room';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/room/:roomid" element={<Room />}/>
            </Routes>
        </Router>

    );
}

export default App;
