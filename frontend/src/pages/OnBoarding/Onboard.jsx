import React, { useState, useEffect } from 'react';
import './Onboard.css';
import PurpleGradient from '../../assets/PurpleGrad.svg';
import YellowRedGradient from '../../assets/YellowRedGrad.svg';
import Compass from '../../assets/Logo.svg';
import Loader from '../../components/Loader/Loader.jsx';



function Onboard(){
    const [current, setCurrent] = useState(0);
    const [currentTransition, setCurrentTransition] = useState(0);

    useEffect(()=>{
        if(current == 0){return;}
        setTimeout(() => {
            setCurrentTransition(currentTransition+1);
        }, 500);
    }, [current]);
    return (
        <div className="onboard">
            <img src={YellowRedGradient} alt="" className="yellow-red" />
            <img src={PurpleGradient} alt="" className="purple" />

            <div className="content">
                { (current == 0 || current == 1) &&
                    <div className={`content ${current == 1 ? "nextOnboard": ""}`}>
                        {/* <img src={Compass} alt="Logo" className="logo" /> */}
                        <Loader/>
                        <h2>welcome to study compass</h2>
                        <p>Study Compass is a student-created tool designed to help students find study spaces according to their preferences</p>
                    </div>
                }
                { (current == 1 || current == 2) &&
                    <div className={`content ${current == 2 ? "nextOnboard": ""} ${current == currentTransition ? "": "beforeOnboard"}`}>
                        {/* <img src={Compass} alt="Logo" className="logo" /> */}
                        <h2>chooose your preferences</h2>
                        <p>Study Compass is a student-created tool designed to help students find study spaces according to their preferences</p>

                    </div>
                }
                <button onClick={()=>{setCurrent(current+1)}}>
                    next
                </button>
            </div>
        </div>
    )
}

export default Onboard;