import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Onboard.scss';
import PurpleGradient from '../../assets/PurpleGrad.svg';
import YellowRedGradient from '../../assets/YellowRedGrad.svg';
import Loader from '../../components/Loader/Loader.jsx';
import DragList from './DragList/DragList.jsx';
import useAuth from '../../hooks/useAuth.js';
import Recommendation from './Recommendation/Recommendation.jsx';
import { useNavigate, useLocation } from 'react-router-dom';
import { onboardUser } from './OnboardHelpers.js';
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

function Onboard(){
    const [start, setStart] = useState(false);
    const [current, setCurrent] = useState(0);
    const [show, setShow] = useState(0);
    const [currentTransition, setCurrentTransition] = useState(0);
    const [containerHeight, setContainerHeight] = useState(175);
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

    const navigate = useNavigate();
    const { newError } = useError();

    const [buttonActive, setButtonActive] = useState(true);

    const containerRef = useRef(null);
    const contentRefs = useRef([]);

    const location = useLocation();
    const from = location.state?.from?.pathname || '/room/none';


    const [items, setItems] = useState(["outlets", "classroom type", "printer", "table type", "windows"]);
    const details = {
        "outlets": "having outlet access from a majority of seats",
        "classroom type": "ex: lecture hall, classroom, auditorium",
        "printer": "having a printer in the room",
        "table type": "ex: small desks, large tables,",
    }

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
                if(user.onboarded && (!onboarded)){
                    navigate(from, {replace: true});
                }
                setUserInfo(user);
                setIsGoogle(user.googleId);
                console.log(user);
                setUsername(user.googleId ? user.username : null);
                setInitialUsername(user.googleId ? user.username : null);
                setName(user.name);
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

    async function handleOnboardUser(name, username, items, sliderValue){
        try{
            const response = await onboardUser(name, username, items, sliderValue);
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

        if(current === 3){
            try{
                handleOnboardUser(name, username, items, sliderValue);
            } catch (error){
                newError(error, navigate);
            }
        }

        if(current === 4){
            navigate(from, {replace: true});
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

    return (
        <div className={`onboard ${start ? "visible" : ""}`} style={{height: viewport}}>
            <img src={YellowRedGradient} alt="" className="yellow-red" />
            <img src={PurpleGradient} alt="" className="purple" />

            <div className="content" style={{ height: containerHeight}} ref={containerRef}>
                <div >
                    { current === 0 &&
                        <div className={`content ${show === 1 ? "going": ""}`} ref={el => contentRefs.current[0] = el}>
                            <Loader/>
                            <h2>welcome to study compass</h2>
                            <p>Study Compass is a student-created tool designed to help students find study spaces according to their preferences</p>
                        </div>
                    }
                    { current === 1 &&
                        <div className={`content ${show === 2 ? "going": ""} ${1 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[1] = el}>
                            <Loader/>
                            <h2>what should we call you?</h2>
                            <p>This is the name you will be visible to other users as (putting you real name here is advised):</p>
                            <input type="text" value={name} onChange={handleNameChange} className="text-input"/>
                            { isGoogle && 
                                <div className="content">
                                    
                                    <h2>set your username</h2>
                                    <p>Since you signed up with Google, we generated a username for you, feel free to change it below:</p>
                                    <div className="username-input">
                                        <div className="status">
                                            { usernameValid === 0 && <div className="checking"><img src={waiting} alt="" /><p>checking username...</p></div>}
                                            { usernameValid === 1 && <div className="available"><img src={check} alt="" /><p>username is available</p></div>}
                                            { usernameValid === 2 && <div className="taken"><img src={unavailable} alt="" /><p>username is taken</p></div>}
                                            { usernameValid === 3 && <div className="invalid"><img src={error} alt="" /><p>invalid username</p></div>}   
                                        </div>
                                        <input type="text" value={username} onChange={handleUsernameChange} className="text-input"/>
                                    </div>
                                </div>
                            }
                        </div>
                    }
                    { current === 2  &&
                        <div className={`content ${show === 3 ? "going": ""} ${2 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[2] = el}>
                            <h2>rank your classroom preferences</h2>
                            <p>What features do you find most important in your study spaces? Rank them from top to bottom.</p>
                            <div className="preference-list">
                                <p className="most">most important</p>
                                <DragList items={items} setItems={setItems} details={details}/>
                                <p className="least">least important</p>
                            </div>
                        </div>
                    }
                    { current === 3 &&
                        <div className={`content ${current === 4 ? "going": ""} ${3 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[3] = el}>
                            <Recommendation sliderValue={sliderValue} setSliderValue={setSliderValue}/>
                        </div>
                    }
                    { current === 4 &&
                        <div className={`content ${current === 5 ? "going": ""} ${4 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[4] = el}>
                            <h2>welcome to study compass, <br></br>{userInfo.name}!</h2>
                            <p>Here's your study compass id, make sure to hold onto it!</p>
                            <div className="card-container">
                                <CardHeader userInfo={userInfo} settings={false}/>
                            </div>
                        </div>
                    }
                </div>  
            </div>
            
                <button className={`${ current !== 1 || (name !== "" && (!isGoogle || usernameValid === 1)) ? buttonActive ? "":"deactivated" : "deactivated"}`} onClick={()=>{setShow(show+1)}}>
                    {current === 4  ? "finish" : "next"}
                </button>
                
        </div>
    )
}

export default Onboard;