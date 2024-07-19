import React, { useEffect, useState } from 'react';
import './StudyPreferences.css';
import DragList from '../../pages/OnBoarding/DragList/DragList';
import Recommendation from '../../pages/OnBoarding/Recommendation/Recommendation';
import rightarrow from '../../assets/Icons/RightArrow.svg';

const StudyPreferences = ({ settingsRightSide, width, handleBackClick }) => {
    const [items, setItems] = useState(["outlets", "classroom type", "printer", "table type", "windows"]);
    const [sliderValue, setSliderValue] = useState(2);
    const details = {
        // "outlets": "having outlet access from a majority of seats",
        // "classroom type": "ex: lecture hall, classroom, auditorium",
        // "printer": "having a printer in the room",
        // "table type": "ex: small desks, large tables,",
    }

    
    return (
        <div className={`study-preferences settings-right ${settingsRightSide ? "active" : "not-active"}`}>
            <div className="header">
                <h1>Study Preferences</h1>
                {width <= 700 && settingsRightSide && (
                    <button className='back-arrow' onClick={handleBackClick}>
                        <img src={rightarrow} alt="Back Arrow" style={{ transform: 'rotate(180deg)' }} />
                    </button>
                )}
            </div>

            <div className='profile'>
                <h2>recommendation settings</h2>
                <hr />
                <Recommendation justSlider={true} sliderValue={sliderValue} setSliderValue={setSliderValue}/>
                <h2>classroom preferences</h2>
                <hr />
                <div className='drag-items'>
                    <div className='left-bar'>
                        <p>1</p>
                        <p>2</p>
                        <p>3</p>
                        <p>4</p>
                        <p>5</p>
                    </div>

                    <div className='right-bar'>
                        <DragList items={items} setItems={setItems} details={details}/>
                    </div>


                    
                </div>
            </div>
            
        </div>
    );
};

export default StudyPreferences;
