import React, { useEffect, useState } from 'react';
import './DisplaySettings.css';
import light from '../../assets/Icons/LightMode.svg';
import dark from '../../assets/Icons/DarkMode.svg';



const DisplaySettings = ( {settingsRightSide, width, handleBackClick, rightarrow} ) => {

    return( 
        <div className={`study-preferences display-settings settings-right ${settingsRightSide ? "active" : "not-active"}`}>
            <div className="header">
                <h1>Display Settings</h1>
                {width <= 700 && settingsRightSide && (
                    <button className='back-arrow' onClick={handleBackClick}>
                        <img src={rightarrow} alt="Back Arrow" style={{ transform: 'rotate(180deg)' }} />
                    </button>
                )}
            </div>

            <div className='profile'>
                <h2>light-dark mode preference</h2>
                <hr />

                <div className='mode'> 
                    <img src={light} alt="" />
                
                    <img src={dark} alt="" />
                </div>
                
             </div>

        </div>


    );
}



export default DisplaySettings;
