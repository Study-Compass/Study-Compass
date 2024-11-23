import React, { useState, useEffect } from 'react';
import './CreateEvent.scss';
import Header from '../../components/Header/Header';
import EventInfo from '../../assets/Icons/EventInfo.svg';
import Calendar from '../../assets/Icons/Calendar.svg';
import CheckBlack from '../../assets/Icons/CheckBlack.svg';
import WhenWhere from '../../components/CreateEvent/WhenWhere/WhenWhere';
import GenInfo from '../../components/CreateEvent/GenInfo/GenInfo';
import Review from '../../components/CreateEvent/Review/Review';
import { useNotification } from '../../NotificationContext';
import { createEvent } from './CreateEventHelpers';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function CreateEvent(){
    const [step, setStep] = useState(0);
    const [info, setInfo] = useState({});
    const [finishedStep, setFinishedStep] = useState(0);
    const {isAuthenticated, isAuthenticating, user} = useAuth();
    const { navigate } = useNavigate();

    useEffect(()=>{
        if(isAuthenticating){
            return;
        }
        if(!isAuthenticated){
            navigate('/');
        }
        if(!user){
            return;
        }
        if(!(user.roles.includes('oie') || user.roles.includes('admin') || user.roles.includes('developer'))){
            navigate('/');
        }
    }, [isAuthenticating, isAuthenticated, user]);

    const {addNotification} = useNotification();
    
    const nextStep = () => {
        setStep(step+1);
        setFinishedStep(step+1);
    }

    const renderStep = () => {
        switch(step){
            case 0:
                return <GenInfo next={nextStep}/>
            case 1:
                return <WhenWhere next={nextStep}/>
            case 2:
                return <Review next={nextStep}/>
            default:
                return <GenInfo next={nextStep}/>
        }
    }

    const handleSwitch = (step) => {
        if(finishedStep < step){
            addNotification({title: "Please complete previous steps", message: "Please complete the previous steps before proceeding", type: "error"});
        } else{
            setStep(step);
        }
    }

    const onSubmit = async () => {
        console.log(info);
        const location1 = info.location;
        console.log(location1);
        const formattedInfo = {
            ...info,
            image:null
        }
        const response = await createEvent(formattedInfo);
        if(response){
            addNotification({title: "Event created", message: "Your event has been created", type: "success"});
        } else {
            addNotification({title: "Failed to create event", message: "An error occurred while creating your event", type: "error"});
        }

    }

    return(
        <div className="create-event page">
            <Header/>
            <div className="content-container">
                <div className="content">
                    <div className="create-steps">
                        <div className="create-header">
                            <h1>create event</h1>
                        </div>
                        <div className="steps">
                            <div className={`step ${step === 0 && "selected"}`} onClick={()=>{handleSwitch(0)}}>
                                <img src={EventInfo} alt="" />
                                <p>information</p>
                            </div>
                            <div className={`step ${step === 1 && "selected"}`}  onClick={()=>{handleSwitch(1)}}>
                                <img src={Calendar} alt="" />
                                <p>when & where</p>
                            </div>
                            <div className={`step ${step === 2 && "selected"}`}  onClick={()=>{handleSwitch(2)}}>
                                <img src={CheckBlack} alt="" />
                                <p>review</p>
                            </div>
                        </div>
                    </div>
                    <div className="create-workspace">
                        <GenInfo next={nextStep} visible={step === 0} setInfo={setInfo}/>
                        <WhenWhere next={nextStep} visible={step === 1} setInfo={setInfo}/>
                        <Review next={nextStep} visible={step === 2} info={info} setInfo={setInfo} onSubmit={onSubmit}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateEvent;

