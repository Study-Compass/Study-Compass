import React from 'react';
import './Onboard.css';
import PurpleGradient from '../../assets/PurpleGrad.svg';
import YellowRedGradient from '../../assets/YellowRedGrad.svg';
import Compass from '../../assets/Logo.svg';
import Loader from '../../components/Loader/Loader.jsx';



function Onboard(){
    return (
        <div className="onboard">
            <img src={YellowRedGradient} alt="" className="yellow-red" />
            <img src={PurpleGradient} alt="" className="purple" />

            <div className="content">
                {/* <img src={Compass} alt="Logo" className="logo" /> */}
                <Loader/>
                <h2>welcome to study compass</h2>
                <p>Study Compass is a student-created tool designed to help students find study spaces according to their preferences</p>
            </div>
        </div>
    )
}

export default Onboard;