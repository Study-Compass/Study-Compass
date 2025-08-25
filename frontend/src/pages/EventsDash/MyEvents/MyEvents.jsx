import './MyEvents.scss';
import AdminGradient from '../../../assets/Gradients/AdminGrad.png';
import useAuth from '../../../hooks/useAuth';

import RecommendedEvents from './RecommendedEvents/RecommendedEvents';
import MyEventsContent from './MyEventsContent/MyEventsContent';

function MyEvents(){
    //define welcometext to be either good morning, good afternoon, or good evening, in one line
    const welcomeText = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}`;
    const { user } = useAuth();


    return(
        <div className="my-events dash">
            <header className="header">
                <img src={AdminGradient} alt="" />
                <h1>{welcomeText}, {user?.username || 'User'}</h1>
                <p>Check out your upcoming events and see top picks for you</p>
            </header>
            <div className="my-events-container">
                <RecommendedEvents />
                <MyEventsContent />
            </div>
            </div>
    )
}

export default MyEvents;