import React, { useState, useEffect, useRef } from 'react';
import './Onboard.css';
import PurpleGradient from '../../assets/PurpleGrad.svg';
import YellowRedGradient from '../../assets/YellowRedGrad.svg';
import Compass from '../../assets/Logo.svg';
import Loader from '../../components/Loader/Loader.jsx';


function Onboard(){
    const [current, setCurrent] = useState(0);
    const [currentTransition, setCurrentTransition] = useState(0);
    const [containerHeight, setContainerHeight] = useState(175);
    const [sliderText, setSliderText] = useState("you have an even mix of routine and novelty");

    const containerRef = useRef(null);
    const contentRefs = useRef([]);

    const messages = [
        "you stick to a strict routine that rarely changes",
        "you follow a consistent routine with occasional changes",
        "you have an even mix of routine and novelty",
        "you have a flexible routine that changes often",
        "you have an ever-changing routine that is rarely the same"   
    ];
    
    const handleSliderChange = () => {
        const slider = document.querySelector('.slider');
        setSliderText(messages[slider.value]);
        setSliderTextColor(getColor(slider.value));
    }

    useEffect(()=>{
        if (containerRef.current) {
            setContainerHeight(contentRefs.current[0].clientHeight);
        }
    }, []);

    useEffect(()=>{
        if(current == 0){return;}
        setTimeout(() => {
            setCurrentTransition(currentTransition+1);
        }, 500);
        if (contentRefs.current[current] && current !== 0) {
            setContainerHeight(contentRefs.current[current].clientHeight);
        }
    }, [current]);


    const interpolateColor = (color1, color2, factor) => {
        let result = color1.slice();
        for (let i = 0; i < 3; i++) {
            result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
        }
        return result;
    };

    const componentToHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };

    const rgbToHex = (r, g, b) => {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    };

    const getColor = (value) => {
        const color1 = [250, 117, 109]; // RGB for #FA756D
        const color2 = [135, 175, 241]; // RGB for #87AFF1
        const factor = value / 5;
        const interpolatedColor = interpolateColor(color1, color2, factor);
        return rgbToHex(interpolatedColor[0], interpolatedColor[1], interpolatedColor[2]);
    };
    const [sliderTextColor, setSliderTextColor] = useState(getColor(2));



    return (
        <div className="onboard">
            <img src={YellowRedGradient} alt="" className="yellow-red" />
            <img src={PurpleGradient} alt="" className="purple" />

            <div className="content" style={{ height: containerHeight }} ref={containerRef}>
                <div >
                    { (current == 0 || current == 1) &&
                        <div className={`content ${current == 1 ? "nextOnboard": ""}`} ref={el => contentRefs.current[0] = el}>
                            {/* <img src={Compass} alt="Logo" className="logo" /> */}
                            <Loader/>
                            <h2>welcome to study compass</h2>
                            <p>Study Compass is a student-created tool designed to help students find study spaces according to their preferences</p>
                        </div>
                    }
                    { (current == 1 || current == 2) &&
                        <div className={`content ${current == 2 ? "nextOnboard": ""} ${current == currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[1] = el}>
                            {/* <img src={Compass} alt="Logo" className="logo" /> */}
                            <h2>choose your preferences</h2>
                            <p className="sliderText" style={{color:`${sliderTextColor}`}}>{sliderText}</p>
                            <input type="range" className="slider" min="0" max="4" defaultValue="2" onChange={handleSliderChange}/>

                        </div>
                    }
                    { (current == 2 || current == 3) &&
                        <div className={`content ${current == 3 ? "nextOnboard": ""} ${current == currentTransition ? "": "beforeOnboard"}`} ref={el => contentRefs.current[2] = el}>
                            {/* <img src={Compass} alt="Logo" className="logo" /> */}
                            <h2>chooose your preferences</h2>
                            <h2>chooose your preferences</h2>

                            <p>Study Compass is a student-created tool designed to help students find study spaces according to their preferences</p>

                        </div>
                    }
                </div>
            </div>
                <button onClick={()=>{setCurrent(current+1)}}>
                    next
                </button>
        </div>
    )
}

export default Onboard;