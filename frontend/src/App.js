import React from 'react';
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
import DeveloperOnboard from './pages/DeveloperOnboarding/DeveloperOnboarding';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { CacheProvider } from './CacheContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './NotificationContext';
import { ErrorProvider } from './ErrorContext';
import { ProfileCreationProvider } from './ProfileCreationContext';
import { WebSocketProvider } from './WebSocketContext';
import Layout from './pages/Layout/Layout';

function App() {
    // document.documentElement.classList.add('dark-mode');
    return (
        <GoogleOAuthProvider clientId="639818062398-k4qnm9l320phu967ctc2l1jt1sp9ib7p.apps.googleusercontent.com">
            <ErrorProvider>
                <NotificationProvider>
                    <WebSocketProvider>
                        <AuthProvider>
                            <CacheProvider>
                                <Router>
                                    <ProfileCreationProvider>
                                    <Routes>
                                        <Route path="/" element={<Landing/> }/>
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
                                        <Route path="/settings" element={<Settings/>}/>
                                        <Route path="/documentation" element={<Redirect/>}/>
                                        <Route path="/developer-onboarding" element={<DeveloperOnboard/>}/>
                                    </Routes>
                                    </ProfileCreationProvider>
                                </Router>
                            </CacheProvider>
                        </AuthProvider>
                    </WebSocketProvider>
                </NotificationProvider>
            </ErrorProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
