import React, { useEffect } from 'react';
import './App.css';
import Room from './pages/Room/Room';
import Room1 from './pages/Room/Room1';
import Login from './pages/Login';
import Register from './pages/Register/Register';
import Redirect from './pages/Redirect/Redirect';
import Error from './pages/Error/Error';
import Onboard from './pages/OnBoarding/Onboard';
import Settings from './pages/Settings/Settings';
import Friends from './pages/Friends/Friends';
import Profile from './pages/Profile/Profile';
import Landing from './pages/Landing/Landing';
import Events from './pages/Events/Events';
import Club from './pages/Club/Club';
import DeveloperOnboard from './pages/DeveloperOnboarding/DeveloperOnboarding';
import QR from './pages/QR/QR';
import Admin  from './pages/Admin/Admin';
import OIEDash from './pages/OIEDash/OIEDash';
import NewBadge from './pages/NewBadge/NewBadge';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { CacheProvider } from './CacheContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './NotificationContext';
import { ErrorProvider } from './ErrorContext';
import { ProfileCreationProvider } from './ProfileCreationContext';
import { WebSocketProvider } from './WebSocketContext';
import { DarkModeProvider, useDarkMode } from './DarkModeContext';
import Layout from './pages/Layout/Layout';
import axios from 'axios';
import CreateEvent from './pages/CreateEvent/CreateEvent';

function App() {
    useEffect(() => {
        // check if the user has already visited
        //don't do anything if /qr
        if (window.location.pathname === '/qr') {
            return;
        }
        const hasVisited = localStorage.getItem('hasVisited');

        if (!hasVisited) {
            // Log the visit to the backend
            axios.post('/log-visit')
                .then(response => {
                    localStorage.setItem('hasVisited', true);  // Mark as visited
                })
                .catch(error => {
                    console.error('Error logging visit', error);
                });
        } else {
            // console.log('User has already visited');
            // generate 10 char hash
            // store in local storage
            // send to backend
            console.log('User has already visited');
            let hash = localStorage.getItem('hash');
            let timestamp = localStorage.getItem('timestamp');
            if (!hash) {
                // generate hash
                hash = Math.random().toString(36).substring(2, 12);
                // store hash
                localStorage.setItem('hash', hash);
            }
            if (!timestamp) {
                timestamp = new Date().toISOString();
                localStorage.setItem('timestamp', timestamp);
            }

            //log how many minutes it has been since last visit
            console.log("minutes since last visit: ", (new Date().getTime() - new Date(timestamp).getTime()) / 1000 / 60);


            //if 20 minutes from last timestamp
            if (new Date().getTime() - new Date(timestamp).getTime() > 20 * 60 * 1000) {
                //send to backend
                localStorage.setItem('timestamp', new Date().toISOString());
                axios.post('/log-repeated-visit', {
                    hash: hash
                })
                    .then(response => {
                        localStorage.setItem('timestamp', new Date().toISOString());
                    })
                    .catch(error => {
                        console.error('Error logging visit', error);
                    });
            }
        }

        
    }, []);
    // document.documentElement.classList.add('dark-mode');
    return (
        <GoogleOAuthProvider clientId="639818062398-k4qnm9l320phu967ctc2l1jt1sp9ib7p.apps.googleusercontent.com">
            <ErrorProvider>
                <NotificationProvider>
                    <WebSocketProvider>
                        <AuthProvider>
                            <CacheProvider>
                                <DarkModeProvider>
                                    <Router>
                                        <ProfileCreationProvider>
                                        <Routes>
                                            <Route path='/' element={<Layout/>}>
                                                <Route path="/qr/:id" element={<QR/>}/>
                                                <Route index element={<Landing/> }/>
                                                <Route path="/room/:roomid" element={<Room1 />}/>
                                                <Route path="/room1/:roomid" element={<Room1 />}/>
                                                <Route path="/register" element={<Register />}/>
                                                <Route path="/login" element={<Login />}/>
                                                <Route path="*" element={<Error />}/>
                                                <Route path="/error/:errorCode" element={<Error />}/>
                                                <Route path="/onboard" element={<Onboard />}/>
                                                <Route path="/profile" element={<Profile/>}/>
                                                <Route path="/friends" element={<Friends/>}/>
                                                <Route path="/landing" element={<Landing/>}/>
                                                <Route path="/club" element={<Club/>}/>
                                                <Route path="/settings" element={<Settings/>}/>
                                                <Route path="/documentation" element={<Redirect/>}/>
                                                <Route path="/developer-onboarding" element={<DeveloperOnboard/>}/>
                                                <Route path="/admin" element={<Admin/>}/>
                                                <Route path="/new-badge/:hash" element={<NewBadge/>}/>
                                        </Route>
                                        </Routes>
                                        </ProfileCreationProvider>
                                    </Router>
                                </DarkModeProvider>
                            </CacheProvider>
                        </AuthProvider>
                    </WebSocketProvider>
                </NotificationProvider>
            </ErrorProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
