import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Landing.css';
import logo from '../../assets/red_logo.svg';
import landing from '../../assets/Landing.png';
import landingGrad from '../../assets/LandingGradient.png';
import Header from "../../components/Header/Header";
import { set } from "mongoose";

function Landing() {
    const [viewport, setViewport] = useState("100vh");
    const [buttonActive, setButtonActive] = useState(false);
    const [graphicActive, setGraphicActive] = useState(false);
    const [gradientActive, setGradientActive] = useState(false);

    const [heroLoaded, setHeroLoaded] = useState(false);
    const [gradientLoaded, setGradientLoaded] = useState(false);

    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
        //add listener
        setTimeout(() => {
            setButtonActive(true);
        }, 500);
        setTimeout(() => {
            setButtonActive(false);
        }, 1400);
    },[]);

    useEffect(() => {
        if(heroLoaded && gradientLoaded){
            setTimeout(() => {
                setGradientActive(true);
            }, 100);
            setTimeout(() => {
                setGraphicActive(true);
            }, 500);
        }
    },[heroLoaded,gradientLoaded]);
    
    const navigate = useNavigate();

    return(
        <div className="landing" style={{height: viewport}}>
            <Header/>   
            <img src={landing} alt="" className={`hero-picture ${graphicActive ? "active" : ""}`}  onLoad={()=>{setHeroLoaded(true)}}/>
            <img src={landingGrad} alt=""  className={`hero-gradient ${gradientActive ? "active" : ""}`} onLoad={()=>{setGradientLoaded(true)}}/>
            <div className="content">
                <h1>wish you could see rpi classroom schedules? they're all here.</h1>
                <button className={`try-button ${buttonActive ? "active" : ""}`} onClick={()=>{navigate('/room/none')}}>try it out!</button>
            </div>
        </div>
    )
}

export default Landing;