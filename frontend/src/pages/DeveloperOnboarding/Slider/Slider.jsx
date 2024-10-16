import React, { useState, useEffect, useRef } from 'react';
import Loader from '../../../components/Loader/Loader';
import '../../OnBoarding/Onboard.scss';
import './Slider.scss';

function Slider({ justSlider, sliderValue, setSliderValue, messages, leftText, rightText, uniqueId }) {
    const sliderRef = useRef(null);

    const [sliderText, setSliderText] = useState(messages[sliderValue]);
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
        const color1 = [69, 169, 252]; // RGB for #45A1FC
        const color2 = [128, 82, 251]; // RGB for #8052FB
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
        const slider = document.querySelector(`.${uniqueId}`);
        setSliderText(messages[slider.value]);
        setSliderTextColor(getColor(slider.value));
        setSliderValue(slider.value);
    }

    if(justSlider){
        return(
            <div className="sliderContainer">
                <p className="sliderText" style={{ color: `${sliderTextColor}` }}>{sliderText}</p>
                <div className="sliderInput" >
                    <div className="thumb" style={{ left: thumbPosition }}></div>
                    <input type="range" className={`slider dev ${uniqueId}`} min="0" max="4" defaultValue="2" onChange={handleSliderChange} ref={sliderRef} />
                </div>
                <div className="rangeText">
                    <p className="leftText">{leftText}</p>
                    <p className="rightText">{rightText}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="sliderContainer">
            <p className="sliderText" style={{ color: `${sliderTextColor}` }}>{sliderText}</p>
            <div className="sliderInput" >
                <div className="thumb" style={{ left: thumbPosition }}></div>
                <input type="range" className={`slider dev ${uniqueId}`} min="0" max="4" defaultValue="2" onChange={handleSliderChange} ref={sliderRef} />
            </div>
            <div className="rangeText">
            <p className="leftText">{leftText}</p>
            <p className="rightText">{rightText}</p>
            </div>
        </div>
    );
}

export default Slider;

