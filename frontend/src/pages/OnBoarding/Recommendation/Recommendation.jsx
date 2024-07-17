import React, { useState, useEffect, useRef } from 'react';
import Loader from '../../../components/Loader/Loader';
import '../Onboard.css';
import './Recommendation.css';

function Recommendation({ justSlider }) {
    const [sliderValue, setSliderValue] = useState(2);
    const sliderRef = useRef(null);


    const messages = [
        "I stick to a strict routine that rarely changes",
        "I follow a consistent routine with occasional changes",
        "I prefer an even mix of routine and variety",
        "I prefer a flexible routine that changes often",
        "I prefer an ever-changing routine that is rarely the same"   
    ];

    const [sliderText, setSliderText] = useState("I prefer an even mix of routine and variety");
    const [thumbPosition, setThumbPosition] = useState(0);


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
        const factor = value / 4;
        const interpolatedColor = interpolateColor(color1, color2, factor);
        return rgbToHex(interpolatedColor[0], interpolatedColor[1], interpolatedColor[2]);
    };

    const [sliderTextColor, setSliderTextColor] = useState(getColor(2));


    useEffect(() => { //utility: smooth transition between notches on slider
        // Function to calculate and set thumb position
        const calculateThumbPosition = () => {
            if (sliderRef.current) {
                const width = sliderRef.current.clientWidth;
                const left = ((width / 4) * 2) - (15 * (2 / 4));
                setThumbPosition(left);
            } else {
                // Retry after 500ms if sliderRef.current is null
                setTimeout(calculateThumbPosition, 500);
            }
        };

        // Calculate thumb position on mount            
        calculateThumbPosition();

    }, []); // Empty dependency array to run once on mount

    useEffect(()=>{
        //find width of slider
        if(sliderRef.current){
            const width = sliderRef.current.clientWidth;
            const left = ((width/4)*sliderValue)-(15 * (sliderValue/4));
            setThumbPosition(left);
        }
    }, [sliderValue]);

    
    const handleSliderChange = () => {
        const slider = document.querySelector('.slider');
        setSliderText(messages[slider.value]);
        setSliderTextColor(getColor(slider.value));
        setSliderValue(slider.value);
    }

    if(justSlider){
        return(
            <div className="content">
                <div className="sliderContainer">
                    <p className="sliderText" style={{ color: `${sliderTextColor}` }}>{sliderText}</p>
                    <div className="sliderInput" >
                        <div className="thumb" style={{ left: thumbPosition }}></div>
                        <input type="range" className="slider" min="0" max="4" defaultValue="2" onChange={handleSliderChange} ref={sliderRef} />
                    </div>
                    <div className="rangeText">
                        <p className="routine">routine</p>
                        <p className="novelty">variety</p>
                    </div>
                </div>
            </div>

        )
    }

    return (
        <div className="content">
            {/* <img src={Compass} alt="Logo" className="logo" /> */}
            <Loader />

            <h2>recommendation preferences</h2>
            <p>Would you like Study Compass to recommend familiar classrooms for routine, or new classrooms for variety?</p>
            <div className="sliderContainer">
                <p className="sliderText" style={{ color: `${sliderTextColor}` }}>{sliderText}</p>
                <div className="sliderInput" >
                    <div className="thumb" style={{ left: thumbPosition }}></div>
                    <input type="range" className="slider" min="0" max="4" defaultValue="2" onChange={handleSliderChange} ref={sliderRef} />
                </div>
                <div className="rangeText">
                    <p className="routine">routine</p>
                    <p className="novelty">variety</p>
                </div>
            </div>
        </div>
    );
}

export default Recommendation;

