import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../OnBoarding/Onboard.scss';
import './DeveloperOnboarding.scss';
import PurpleGradient from '../../assets/BlueGrad2.png';
import YellowRedGradient from '../../assets/BlueGrad1.png';
import Loader from '../../components/Loader/Loader.jsx';
import DragList from '../OnBoarding/DragList/DragList.jsx';
import useAuth from '../../hooks/useAuth.js';
import Recommendation from '../OnBoarding/Recommendation/Recommendation.jsx';
import Slider from './Slider/Slider.jsx';
import { useNavigate } from 'react-router-dom';
import { onboardDeveloper } from './DeveloperOnboardHelpers.js';
import { useError } from '../../ErrorContext.js'; 
import { useNotification } from '../../NotificationContext.js';
import { checkUsername } from '../../DBInteractions.js';
import { useCache } from '../../CacheContext.js';
import { debounce} from '../../Query.js';
import check from '../../assets/Icons/Check.svg';
import waiting from '../../assets/Icons/Waiting.svg';
import error from '../../assets/circle-warning.svg';
import unavailable from '../../assets/Icons/Circle-X.svg';
import CardHeader from '../../components/ProfileCard/CardHeader/CardHeader.jsx';

function DeveloperOnboard(){
    const [start, setStart] = useState(false);
    const [current, setCurrent] = useState(0);
    const [show, setShow] = useState(0);
    const [currentTransition, setCurrentTransition] = useState(0);
    const [containerHeight, setContainerHeight] = useState(250);
    const { isAuthenticated, isAuthenticating, user, validateToken } = useAuth();
    // const { debounce } = useCache();
    const { addNotification } = useNotification();
    const [userInfo, setUserInfo] = useState(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState(null);
    const [initialUsername, setInitialUsername] = useState(null);
    const [sliderValue, setSliderValue] = useState(2);
    const [isGoogle, setIsGoogle] = useState(null);
    const [onboarded, setOnboarded] = useState(false);
    const [usernameValid, setUsernameValid] = useState(0);

    const [developmentArea, setDevelopmentArea] = useState(null);
    const [timeCommitment, setTimeCommitment] = useState(null);

    const navigate = useNavigate();
    const { newError } = useError();

    const [buttonActive, setButtonActive] = useState(true);
    const [validNext, setValidNext] = useState(true);
    
    const [goal, setGoal] = useState("");

    const containerRef = useRef(null);
    const contentRefs = useRef([]);

    const [items, setItems] = useState(["outlets", "classroom type", "printer", "table type", "windows"]);
    const details = {
        "outlets": "having outlet access from a majority of seats",
        "classroom type": "ex: lecture hall, classroom, auditorium",
        "printer": "having a printer in the room",
        "table type": "ex: small desks, large tables,",
    }
    
    const comfortability= [
        "I've never coded with this technology before",
        "I can do small tasks with this technology",
        "I'm pretty comfortable with this technology",
        "I can be assigned complex tasks with this technology",
        "I could teach this technology to someone else"
    ];

    const [react, setReact] = useState(2);
    const [express, setExpress] = useState(2);
    const [mongo, setMongo] = useState(2);

    useEffect(()=>{
        if (containerRef.current) {
            setContainerHeight(contentRefs.current[0].clientHeight+10);
        }
    }, []);

    const validUsername = async (username) => {
        if (username === null || username === "") {
            return;
        }
        if (username === initialUsername) {
            setUsernameValid(1);
            return;
        }
        setUsernameValid(0);
        try{
            const response = await checkUsername(username);
            if(response){
                setUsernameValid(1);
            } else {
                setUsernameValid(2);
            }
        } catch (error){
            addNotification({title: 'Error checking username', message: error.message, type: 'error'});
        }
    };

    const debounced = useCallback(debounce(validUsername, 500),[]);

    useEffect(() => {
        setTimeout(() => {
            setStart(true);
        }, 500);
    },[]);
    
    useEffect(() => {
        if(isAuthenticating){
            return;
        }
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            if(user){
                if(user.developer === 0){
                    navigate('/settings');

                }
                setUserInfo(user);
            }
        }
    }, [isAuthenticating, isAuthenticated, user]);

    useEffect(() => {
        if (username === null || username === "") {
            setUsernameValid(3);
            return;
        }
        if (username === initialUsername) {
            setUsernameValid(1);
            return;
        }
        setUsernameValid(0);
        debounced(username);
    }, [username]);

    useEffect(()=>{
        if(current === 0){return;}
        setTimeout(() => {
            setCurrentTransition(currentTransition+1);
        }, 500);
        if (contentRefs.current[current] && current !== 0) {
            setTimeout(() => {
                setContainerHeight(contentRefs.current[current].offsetHeight);
            }, 500);
            console.log(contentRefs.current[current].offsetHeight);
            console.log(current);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    useEffect(()=>{
        if(current === 0 || current === 2){
            return;
        }
        if(current === 1){
            if(developmentArea === null){
                setValidNext(false);
            } else {
                setValidNext(true);
            }
            return;
        }
        if(current === 3){
            if(timeCommitment === null){
                setValidNext(false);
            } else {
                setValidNext(true);
            }
            return;
        }
        if(current === 4){
            if(goal === ""){
                setValidNext(false);
            } else {
                setValidNext(true);
            }
            return;
        }


    },[current, developmentArea, timeCommitment, goal]);

    async function handleOnboardUser(type, commitment, goals, skills){
        try{
            const response = await onboardDeveloper(type, commitment, goals, skills);
            if(response.success){
                setOnboarded(true);
                await validateToken();
            }
            
        } catch (error){
            newError(error, navigate);
        }
    }

    useEffect(()=>{
        if(show === 0){return;}
        setTimeout(() => {
            setCurrent(current+1);
        }, 500);

        if(current === 4){
            try{
                handleOnboardUser(developmentArea, timeCommitment, goal, [{react}, {express}, {mongo}]);
            } catch (error){
                newError(error, navigate);
            }
        }

        if(current === 5){
            navigate('/room/none');
        }

        setButtonActive(false);
        setTimeout(() => {
            setButtonActive(true);
        }, 1000);
    }, [show]);
    
    


    const [viewport, setViewport] = useState("100vh");

    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
    },[]);

    if(isAuthenticating || !userInfo){
        return(
            <div className="onboard"></div>
        )
    }

    const handleNameChange = (e) => {
        setName(e.target.value);
    }

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    }

    const handleGoalChange = (e) => {
        setGoal(e.target.value);
    }

    return (
        <div className={`onboard ${start ? "visible" : ""}`} style={{height: viewport}}>
            <img src={YellowRedGradient} alt="" className="yellow-red" />
            <img src={PurpleGradient} alt="" className="purple" />

            <div className="content" style={{ height: containerHeight}} ref={containerRef}>
                <div >
                    { current === 0 &&
                        <div className={`content ${show === 1 ? "going": ""}`} ref={el => contentRefs.current[0] = el}>
                            <Loader/>
                            <h2>welcome to the study compass <b>development team!</b></h2>
                            <p>Welcome to the team! This onboarding process is designed to get a feel of how exactly you'd like to contribute to Study Compass. Answers are not binding and can be changed through settings, so don't take this too seriously!</p>
                        </div>
                    }
                    { current === 1 &&
                        <div className={`content ${show === 2 ? "going": ""} ${1 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[1] = el}>
                            <Loader/>
                            <h2>which area of development do you want to focus on?</h2>
                            <p>choose an option below:</p>
                            <div className="options">
                                <div className={`option ${developmentArea === 0 ? "selected" : ""}`} onClick={()=>{setDevelopmentArea(0)}}>
                                    <h3>Frontend</h3>
                                    <p>
                                        you'll be working with the user iterface of Study Compass
                                    </p>
                                </div>
                                <div className={`option ${developmentArea === 1 ? "selected" : ""}`} onClick={()=>{setDevelopmentArea(1)}}>
                                    <h3>Backend</h3>
                                    <p>
                                        you'll be working on the server side of Study Compass
                                    </p>
                                </div>
                                <div className={`option ${developmentArea === 2 ? "selected" : ""}`} onClick={()=>{setDevelopmentArea(2)}}>
                                    <h3>FullStack</h3>
                                    <p>
                                        you'll be working on both the frontend and backend of Study Compass, mainly connecting things together
                                    </p>
                                </div>
                            </div>
                            
                        </div>
                    }
                    { current === 2  &&
                        <div className={`content ${show === 3 ? "going": ""} ${2 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[2] = el}>
                            <h2>how would you rate your knowledge level of the following technologies?</h2>
                            <p>rate your comfortability level on a scale from 1 to 5</p>
                            <div className="preference-list">
                                { (developmentArea === 0 || developmentArea === 2) && (
                                    <div>
                                        <h2>React</h2>
                                        <Slider sliderValue={react} setSliderValue={setReact} messages={comfortability} leftText={"not at all"} rightText={"very"} uniqueId={"react"}/>
                                    </div>
                                ) }
                                { (developmentArea === 1 || developmentArea === 2) && (
                                    <div>
                                        <h2>Express</h2>
                                        <Slider sliderValue={express} setSliderValue={setExpress} messages={comfortability} leftText={"not at all"} rightText={"very"} uniqueId={"express"}/>
                                    </div>
                                ) }
                                { (developmentArea === 1 || developmentArea === 2) && (
                                    <div>
                                        <h2>Mongo</h2>
                                        <Slider sliderValue={mongo} setSliderValue={setMongo} messages={comfortability} leftText={"not at all"} rightText={"very"} uniqueId={"mongo"}/>
                                    </div>
                                ) }
                            </div>
                        </div>
                    }
                    { current === 3 &&
                        <div className={`content ${current === 4 ? "going": ""} ${3 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[3] = el}>
                            {/* gauging time commitment */}
                            <h2>what is the level of time commitment you can devote to study compass?</h2>
                            <p>choose an option below:</p>
                            <div className="options">
                                <div className={`option ${timeCommitment === 0 ? "selected" : ""}`} onClick={()=>{setTimeCommitment(0)}}>
                                    <h3>Light</h3>
                                    <p>
                                        I'll keep my time commitment to the time alotted during the RCOS class period.
                                    </p>
                                </div>
                                <div className={`option ${timeCommitment === 1 ? "selected" : ""}`} onClick={()=>{setTimeCommitment(1)}}>
                                    <h3>Medium</h3>
                                    <p>
                                        I'll be working on Study Compass outside of the RCOS class period, but not too much.
                                    </p>
                                </div>
                                <div className={`option ${timeCommitment === 2 ? "selected" : ""}`} onClick={()=>{setTimeCommitment(2)}}>
                                    <h3 className="holo-text">Dialed in</h3>
                                    <p>
                                        I'll be working on Study Compass outside of the RCOS class period, and I'll be putting in a lot of time.
                                    </p>
                                </div>
                            </div>
                        </div>
                    }
                    { current === 4 &&
                        <div className={`content ${current === 5 ? "going": ""} ${4 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[4] = el}>
                            <h2>what's the biggest goal you have for this semester in study compass?</h2>
                            <p>type your answer here:</p>
                            <input type="text" className='text-input' value={goal} onChange={handleGoalChange} />
                        </div>
                    }
                    { current === 5 &&
                        <div className={`content ${current === 6 ? "going": ""} ${5 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[5] = el}>
                            <h2>you are now a study compass developer, <b className="holo-text">{userInfo.name}!</b></h2>
                            <p>Here's your study compass id, make sure to hold onto it!</p>
                            <div className="card-container">
                                <CardHeader userInfo={userInfo} settings={false}/>
                            </div>
                        </div>
                    }
                </div>  
            </div>
            
                <button className={`${ validNext && buttonActive ? "":"deactivated"}`} onClick={()=>{setShow(show+1)}}>
                    {current === 5  ? "finish" : "next"}
                </button>
                
        </div>
    )
}

export default DeveloperOnboard;