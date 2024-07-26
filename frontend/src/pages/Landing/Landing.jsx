import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Landing.css';
import logo from '../../assets/red_logo.svg';
import landing from '../../assets/Landing.png';
import landingGrad from '../../assets/LandingGradient.png';
import Header from "../../components/Header/Header";

function Landing() {
    const [viewport, setViewport] = useState("100vh");
    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
        //add listener
    },[]);

    const navigate = useNavigate();

    return(
        <div className="landing" style={{height: viewport}}>
            <Header/>
            <img src={landing} alt="" className="hero-picture" />
            <img src={landingGrad} alt=""  className="hero-gradient"/>
            <div className="content">
                <h1>wish you could see rpi classroom schedules? they're all here.</h1>
                <button className="try-button" onClick={()=>{navigate('/room/none')}}>try it out !</button>
            </div>
        </div>
    )
}

export default Landing;