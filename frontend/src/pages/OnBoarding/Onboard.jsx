import React, { useState, useEffect, useRef } from 'react';
import './Onboard.css';
import PurpleGradient from '../../assets/PurpleGrad.svg';
import YellowRedGradient from '../../assets/YellowRedGrad.svg';
import Loader from '../../components/Loader/Loader.jsx';
import DragList from './DragList/DragList.jsx';
import useAuth from '../../hooks/useAuth.js';
import Recommendation from './Recommendation/Recommendation.jsx';
import { useNavigate } from 'react-router-dom';
import { onboardUser } from './OnboardHelpers.js';
import { useError } from '../../ErrorContext.js'; 
import { useNotification } from '../../NotificationContext.js';
import { checkUsername } from '../../DBInteractions.js';
import { useCache } from '../../CacheContext.js';
import { debounce} from '../../Query.js';


function Onboard(){
    const [current, setCurrent] = useState(0);
    const [show, setShow] = useState(0);
    const [currentTransition, setCurrentTransition] = useState(0);
    const [containerHeight, setContainerHeight] = useState(175);
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    const { newNotification } = useNotification();
    const [userInfo, setUserInfo] = useState(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState(null);
    const [initialUsername, setInitialUsername] = useState(null);
    const [sliderValue, setSliderValue] = useState(2);
    const [isGoogle, setIsGoogle] = useState(null);

    const [usernameValid, setUsernameValid] = useState(0); // 0 is checking, 1 is valid, 2 is invalid
    const checkUsernameDebounced = debounce(checkUsername, 500);

    const navigate = useNavigate();
    const { newError } = useError();

    const [buttonActive, setButtonActive] = useState(true);
    

    const containerRef = useRef(null);
    const contentRefs = useRef([]);

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
            newNotification("error", "Error checking username");
        }
    };

    const debounced = debounce(validUsername, 5000);
    
    useEffect(() => {
        if(isAuthenticating){
            return;
        }
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            if(user){
                if(user.onboarded){
                    navigate('/room/none');
                }
                setUserInfo(user);
                setIsGoogle(user.google);
                setUsername(user.google ? user.username : null);
                setInitialUsername(user.google ? user.username : null);
            }
        }
    }, [isAuthenticating, isAuthenticated, user]);

    // useEffect(() => {
    //     if (username === null || username === "") {
    //         return;
    //     }
    //     if (username === initialUsername) {
    //         setUsernameValid(1);
    //         return;
    //     }
    //     setUsernameValid(0);
    //     checkUsernameDebounced(username);
    // }, [username]);



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
        if(show === 0){return;}
        setTimeout(() => {
            setCurrent(current+1);
        }, 500);

        if(current === 3){
            try{
                onboardUser(name, username, items, sliderValue);
            } catch (error){
                newError(error, navigate);
            }
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
        debounced(e.target.value);
    }

    return (
        <div className="onboard" style={{height: viewport}}>
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
                            <h2>set your name</h2>
                            <p>This is the name you will be visible to other users as (putting you real name here is advised):</p>
                            <input type="text" value={name} onChange={handleNameChange} className="text-input"/>
                            { isGoogle && 
                                <div className="content">
                                    <div className="status">
                                        { usernameValid === 0 && <p>checking username...</p>}
                                        { usernameValid === 1 && <p>username is available</p>}
                                        { usernameValid === 2 && <p>username is taken</p>}
                                    </div>
                                    <h2>set your username</h2>
                                    <p>Since you signed up with Google, we generated a username for you, feel free to change it below:</p>
                                    <input type="text" value={username} onChange={handleUsernameChange} className="text-input"/>
                                </div>
                            }
                            
                            
                        </div>
                    }
                    { current === 2  &&
                        <div className={`content ${show === 3 ? "going": ""} ${2 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[2] = el}>
                            <Loader/>
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
                </div>
            </div>
                <button className={`${ current === 1 && name === "" ? "deactivated" : buttonActive ? "":"deactivated"}`} onClick={()=>{setShow(show+1)}}>
                    {current === 3  ? "finish" : "next"}
                </button>
                
        </div>
    )
}

export default Onboard;