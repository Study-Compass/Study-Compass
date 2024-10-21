import React, { useState, useEffect } from 'react';
import './CreateEvent.scss';
import Header from '../../components/Header/Header';
import EventInfo from '../../assets/Icons/EventInfo.svg';
import Calendar from '../../assets/Icons/Calendar.svg';
import CheckBlack from '../../assets/Icons/CheckBlack.svg';
import WhenWhere from '../../components/CreateEvent/WhenWhere/WhenWhere';
import GenInfo from '../../components/CreateEvent/GenInfo/GenInfo';
import Review from '../../components/CreateEvent/Review/Review';

function CreateEvent(){
    const [step, setStep] = useState(0);

    const renderStep = () => {
        switch(step){
            case 0:
                return <GenInfo/>
            case 1:
                return <WhenWhere/>
            case 2:
                return <Review/>
            default:
                return <GenInfo/>
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
                            <div className={`step ${step === 0 && "selected"}`} onClick={()=>{setStep(0)}}>
                                <img src={EventInfo} alt="" />
                                <p>information</p>
                            </div>
                            <div className={`step ${step === 1 && "selected"}`}  onClick={()=>{setStep(1)}}>
                                <img src={Calendar} alt="" />
                                <p>when & where</p>
                            </div>
                            <div className={`step ${step === 2 && "selected"}`}  onClick={()=>{setStep(2)}}>
                                <img src={CheckBlack} alt="" />
                                <p>review</p>
                            </div>
                        </div>
                    </div>
                    <div className="create-workspace">
                        {renderStep()}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateEvent;

