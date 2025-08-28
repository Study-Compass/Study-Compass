import React, {useState, useEffect} from 'react';
import './EventsDash.scss';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import Dashboard from '../../components/Dashboard/Dashboard';
import Explore from './Explore/Explore';
import MyEvents from './MyEvents/MyEvents';
import Loader from '../../components/Loader/Loader';
import Orgs from './Orgs/Orgs';
import eventsLogo from '../../assets/Brand Image/BEACON.svg';
import useAuth from '../../hooks/useAuth';
import Friends from '../Friends/Friends';
import EventsGrad from '../../assets/Gradients/EventsGrad.png';
import Popup from '../../components/Popup/Popup';
import EventsAnalytics from '../../components/EventsAnalytics/EventsAnalytics';

// Sign-up prompt component
const SignUpPrompt = ({ onSignUp, onExplore, handleClose }) => {
    return (
        <div className="signup-prompt-popup">
            <div className="signup-prompt-content">
                <div className="signup-prompt-header">
                    <img src={EventsGrad} alt="" className="signup-gradient" />
                    <h1>Create a Meridian Account</h1>
                    <p>All your events in one place, RSVP with one click to let friends know what you're attending.</p>
                </div>
                
                <div className="signup-prompt-features">
                    <div className="feature">
                        <div className="feature-icon">
                            <Icon icon="mingcute:calendar-fill" />
                        </div>
                        <div className="feature-text">
                            <h3>Discover Events</h3>
                            <p>Find events from Campus, Arts, Athletics, and more</p>
                        </div>
                    </div>
                    
                    <div className="feature">
                        <div className="feature-icon">
                            <Icon icon="mingcute:group-2-fill" />
                        </div>
                        <div className="feature-text">
                            <h3>Connect with Friends</h3>
                            <p>See what your friends are up to and join them</p>
                        </div>
                    </div>
                    
                    <div className="feature">
                        <div className="feature-icon">
                            <Icon icon="mingcute:compass-fill" />
                        </div>
                        <div className="feature-text">
                            <h3>Explore Campus</h3>
                            <p>Find the perfect study spots and event venues</p>
                        </div>
                    </div>
                </div>
                
                <div className="signup-prompt-actions">
                    <button className="signup-btn primary" onClick={onSignUp}>
                        <Icon icon="mingcute:user-add-fill" />
                        Sign Up Now
                    </button>
                    <button className="signup-btn secondary" onClick={onExplore}>
                        no thanks
                    </button>
                </div>
            </div>
        </div>
    );
};

function EventsDash({}){
    const [showLoading, setShowLoading] = useState(false);
    const [showExplore, setShowExplore] = useState(false);
    const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
    const { user, isAuthenticating } = useAuth();
    const navigate = useNavigate();

    // Helper function to check if sign-up prompt should be shown today
    const shouldShowSignUpPrompt = () => {
        const lastPromptDate = localStorage.getItem('lastSignUpPromptDate');
        if (!lastPromptDate) return true;
        
        const today = new Date().toDateString();
        return lastPromptDate !== today;
    };

    // Helper function to mark sign-up prompt as shown today
    const markSignUpPromptAsShown = () => {
        const today = new Date().toDateString();
        localStorage.setItem('lastSignUpPromptDate', today);
    };

    // Show sign-up prompt after loading for non-authenticated users (only once per day)
    useEffect(() => {
        if (!isAuthenticating && !user && !showExplore && shouldShowSignUpPrompt()) {
            const timer = setTimeout(() => {
                setShowSignUpPrompt(true);
                markSignUpPromptAsShown();
            }, 1000); // Show after 1 second
            return () => clearTimeout(timer);
        }
    }, [isAuthenticating, user, showExplore]);

    // Create menu items based on authentication status
    const getMenuItems = () => {
        const items = [
            { 
                label: 'Explore', 
                icon: 'mingcute:compass-fill',
                element: <Explore />
            }
        ];
        
        // Only add "My Events" if user is logged in
        if (user) {
            items.unshift({
                label: 'My Events', 
                icon: 'mingcute:calendar-fill',
                element: <MyEvents />
            });
            items.push({
                label: 'Friends', 
                icon: 'mingcute:calendar-fill',
                element: <Friends />
            });
            
            // Add Analytics tab for admin users
            if (user.roles && user.roles.includes('admin')) {
                items.push({
                    label: 'Analytics', 
                    icon: 'mingcute:chart-fill',
                    element: <EventsAnalytics />
                });
            }
        }
        
        return items;
    };

    const menuItems = getMenuItems();

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLoading(false);
        }, 2500); // 2s delay + 1.5s animation duration

        return () => clearTimeout(timer);
    }, []);

    const handleSignUp = () => {
        setShowSignUpPrompt(false);
        navigate('/login');
    };

    const handleExplore = () => {
        setShowSignUpPrompt(false);
        setShowExplore(true);
    };

    const handleClosePrompt = () => {
        setShowSignUpPrompt(false);
    };

    return (
        <>
            {showLoading && !isAuthenticating && !user && (
                <div 
                    className="loading-overlay" 
                    role="status" 
                    aria-live="polite" 
                    aria-label="Loading events dashboard"
                >
                    <div className="loader-container">
                        <Loader />
                        <div className="loading-bar" aria-hidden="true"/>
                    </div>
                </div>
            )}
            
            <Dashboard 
                menuItems={menuItems} 
                additionalClass='events-dash' 
                logo={eventsLogo} 
                primaryColor='#6D8EFA' 
                secondaryColor='rgba(109, 142, 250, 0.15)'
                // Set default page to "My Events" (index 1) if user is logged in, otherwise "Explore" (index 0)
            >
            </Dashboard>

            {/* Sign-up prompt popup */}
            <Popup 
                isOpen={showSignUpPrompt} 
                onClose={handleClosePrompt}
                customClassName="signup-prompt-popup"
                defaultStyling={false}
            >
                <SignUpPrompt 
                    onSignUp={handleSignUp} 
                    onExplore={handleExplore} 
                    handleClose={handleClosePrompt}
                />
            </Popup>
        </>
    )
}

export default EventsDash;