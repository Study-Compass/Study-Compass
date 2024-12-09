import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../OnBoarding/Onboard.scss';
import './CreateClub.scss';
import PurpleGradient from '../../assets/RedBottomRight.png';
import YellowRedGradient from '../../assets/RedTopRight.png';
import Loader from '../../components/Loader/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { useError } from '../../ErrorContext.js'; 
import { useNotification } from '../../NotificationContext.js';
import CardHeader from '../../components/ProfileCard/CardHeader/CardHeader.jsx';
import ImageUpload from '../../components/ImageUpload/ImageUpload';
import axios from 'axios';

function CreateClub(){
    const [start, setStart] = useState(false);
    const [current, setCurrent] = useState(0);
    const [show, setShow] = useState(0);
    const [currentTransition, setCurrentTransition] = useState(0);
    const [containerHeight, setContainerHeight] = useState(250);
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    const [userInfo, setUserInfo] = useState(null);
    const [name, setName] = useState("");
    const [timeCommitment, setTimeCommitment] = useState(null);
    const [description, setDescription] = useState(""); 
    const [club, setClub] = useState(null);

    const navigate = useNavigate();
    const {addNotification} = useNotification();
    const { newError } = useError();

    const [buttonActive, setButtonActive] = useState(true);
    const [validNext, setValidNext] = useState(true);
    

    const containerRef = useRef(null);
    const contentRefs = useRef([]);


    useEffect(()=>{
        if (containerRef.current) {
            setContainerHeight(contentRefs.current[0].clientHeight+10);
        }
    }, []);

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

    async function handleClubCreation(name, description){
        try {
            const response = await axios.post('/create-club', {club_name: name, club_profile_image: '/Logo.svg', club_description: description}, {headers: {"Authorization": `Bearer ${localStorage.getItem("token")}`}});
            setClub(response.data.club);
        } catch (error) {
            addNotification({ title: 'Error', message: error.message, type: 'error' });
            navigate('/');
        }
    }

    useEffect(()=>{
        if(current === 0 || current===3 || current === 4){
            return;
        }
        if(current === 1){
            if(name === ""){
                setValidNext(false);
            } else {
                setValidNext(true);
            }
            return;
        }
        if(current === 2){
            if(description === ""){
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
            if("" === ""){
                setValidNext(false);
            } else {
                setValidNext(true);
            }
            return;
        }


    },[current, name, description]);

    useEffect(()=>{
        if(show === 0){return;}
        setTimeout(() => {
            setCurrent(current+1);
        }, 500);

        if(current === 4){
            try{
                handleClubCreation(name, description);
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

    const handleDescChange = (e) => {
        setDescription(e.target.value);
    }

    return (
        <div className={`onboard ${start ? "visible" : ""} create-club`} style={{height: viewport}}>
            <img src={YellowRedGradient} alt="" className="yellow-red" />
            <img src={PurpleGradient} alt="" className="purple" />

            <div className="content" style={{ height: containerHeight}} ref={containerRef}>
                <div >
                    { current === 0 &&
                        <div className={`content ${show === 1 ? "going": ""}`} ref={el => contentRefs.current[0] = el}>
                            <Loader/>
                            <h2>let's set up your study compass <b>organization!</b></h2>
                            <p>Study Compass provides a variety of tools designed to make the management of your organization as smooth as possible. We'll just need some information from you before you get started.</p>
                        </div>
                    }
                    { current === 1 &&
                        <div className={`content ${show === 2 ? "going": ""} ${1 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[1] = el}>
                            <Loader/>
                            <h2>what should we call your organization?</h2>
                            <p>This name will be publicly visible to users, and should be unique as well</p>
                            <input type="text" value={name} onChange={handleNameChange} className="text-input"/>
                        </div>
                    }
                    { current === 2  &&
                        <div className={`content ${show === 3 ? "going": ""} ${2 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[2] = el}>
                            <Loader/>
                            <h2>tell us a little bit about your organization</h2>
                            <p>Give users a description of what your org is about, feel free to be descriptive!</p>
                            <textarea type="text" value={description} onChange={handleDescChange} className="text-input"/>
                        </div>
                    }
                    { current === 3 &&
                        <div className={`content ${current === 4 ? "going": ""} ${3 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[3] = el}>
                            <Loader/>
                            <h2>upload a profile picture</h2>
                            <p>Let's make it feel like home in here, feel free to cuztomize your logo!</p>
                            <ImageUpload uploadText="Drag and Drop to Upload"/>
                        </div>
                    }
                    { current === 4 &&
                        <div className={`content ${current === 5 ? "going": ""} ${4 === currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[4] = el}>
                            <Loader/>
                            <h2>define some roles</h2>
                            <p>Lorem ipsum dolorem asdf asd f asd sdf sdfasdlfkjas;ldkf sdaflkjsdf sdflkjsdf lkj</p>
                            <textarea type="text" value={description} onChange={handleDescChange} className="text-input"/>
                        </div>
                    }
                    { current === 5 &&
                        <div className={`content ${current === 6 ? "going": ""} ${5 === currentTransition ? club!== null ? "": "beforeOnboard" : "beforeOnboard"}`} ref={el => contentRefs.current[5] = el}>
                            <h2>congratulations, {userInfo && userInfo.name} <b className="holo-text">{name}</b> is now a study compass organization! </h2>
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

export default CreateClub;