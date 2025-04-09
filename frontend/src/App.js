import React, { useEffect } from 'react';
import './App.css';
import './assets/fonts.css';
import Room from './pages/Room/Room';
import Room1 from './pages/Room/Room1';
import Login from './pages/Login';
import Register from './pages/Register/Register';
import Redirect from './pages/Redirect/Redirect';
import Error from './pages/Error/Error';
import Onboard from './pages/OnBoarding/Onboard';
import Settings from './pages/Settings/Settings';
import Friends from './pages/Friends/Friends';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Org from './pages/Org/Org';
import Profile from './pages/Profile/Profile';
import Landing from './pages/Landing/Landing';
import Events from './pages/Events/Events';
import DeveloperOnboard from './pages/DeveloperOnboarding/DeveloperOnboarding';
import QR from './pages/QR/QR';
import Admin  from './pages/Admin/Admin';
import OIEDash from './pages/OIEDash/OIEDash';
import NewBadge from './pages/NewBadge/NewBadge';
import CreateOrg from './pages/CreateOrg/CreateOrg';
import ClubDash from './pages/ClubDash/ClubDash';
import OrgDisplay from './pages/Org/OrgDisplay';
import RootDash from './pages/RootDash/RootDash';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { CacheProvider } from './CacheContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './NotificationContext';
import { ErrorProvider } from './ErrorContext';
import { ProfileCreationProvider } from './ProfileCreationContext';
import { WebSocketProvider } from './WebSocketContext';
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
                                <Router>
                                    <ProfileCreationProvider>
                                    <Routes>
                                        <Route path='/' element={<Layout/>}>
                                            {/* publicly accessible pages */}
                                            <Route path="/qr/:id" element={<QR/>}/>
                                            <Route index element={<Landing/> }/>
                                            <Route path="/room/:roomid" element={<Room1 />}/>
                                            <Route path="/room1/:roomid" element={<Room1 />}/>
                                            <Route path="/register" element={<Register />}/>
                                            <Route path="/login" element={<Login />}/>
                                            <Route path="/forgot-password" element={<ForgotPassword />}/>
                                            <Route path="/reset-password" element={<ResetPassword />}/>
                                            <Route path="*" element={<Error />}/>
                                            <Route path="/error/:errorCode" element={<Error />}/>
                                            <Route path="/landing" element={<Landing/>}/>
                                            <Route path="/org" element={<Org/>}/>
                                            <Route path="/documentation" element={<Redirect/>}/>
                                            <Route path="/new-badge/:hash" element={<NewBadge/>}/>
                                            <Route path="/new-badge" element={<NewBadge/>}/>

                                            {/* logged in routes */}
                                            <Route element={ <ProtectedRoute/> }>
                                                <Route path="/profile" element={<Profile/>}/>
                                                <Route path="/onboard" element={<Onboard />}/>
                                                <Route path="/friends" element={<Friends/>}/>
                                                <Route path="/settings" element={<Settings/>}/>
                                                <Route path="/developer-onboarding" element={<DeveloperOnboard/>}/>
                                                <Route path="/verify-email" element={<EmailVerification/>}/>
                                            </Route>

                                            {/* admin routes */}
                                            <Route element={ <ProtectedRoute authorizedRoles={['admin']}/> }>
                                                <Route path="/admin" element={<Admin/>}/>
                                            </Route>

                                            {/* features under development */}
                                            <Route element={ <ProtectedRoute authorizedRoles={['admin', 'developer']}/> }>
                                                <Route path="/org/:name" element={<OrgDisplay/>}/>
                                                <Route path="/events" element={<Events/>}/>
                                                <Route path="/club-dashboard/:id" element={<ClubDash/>}/>
                                                <Route path='/create-org' element={<CreateOrg/>}/>
                                                <Route path="/root-dashboard" element={<RootDash/>}/>
                                                <Route path="/approval-dashboard/:id" element={<OIEDash/>}/>
                                            </Route>

                                            {/* oie routes */}
                                            <Route element={ <ProtectedRoute authorizedRoles={['admin', 'developer', 'oie']}/> }>
                                                <Route path="/oie-dashboard" element={<OIEDash/>}/>
                                                <Route path="/create-event" element={<CreateEvent/>}/>
                                            </Route>
                                        </Route>
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
