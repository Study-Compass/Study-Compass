import React, { useEffect, useState } from 'react';
import './DisplaySettings.css';
import light from '../../assets/Icons/LightMode.svg';
import dark from '../../assets/Icons/DarkMode.svg';
import { useDarkMode } from '../../DarkModeContext';

const DisplaySettings = ( {settingsRightSide, width, handleBackClick, rightarrow} ) => {
    const {darkMode, toggleDarkMode} = useDarkMode();
    const [selectedMode, setSelectedMode] = useState(darkMode ? "dark" : "light");

    useEffect(() => {
        // const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setSelectedMode(darkMode ? 'dark' : 'light');
    }, [darkMode] );

        // const handleChange = (e) => {
        //     setSelectedMode(e.matches ? 'dark' : 'light');
        // };

        // mediaQuery.addEventListener('change', handleChange);

    //     return () => {
    //         mediaQuery.removeEventListener('change', handleChange);
    //     };
    // }, []);

    
    useEffect( () => {
        if (selectedMode === 'dark'){
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
 }, [selectedMode] );

    const handleModeSelect = (mode) => {
        setSelectedMode(mode);
        toggleDarkMode();
      };
    

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
                    <div className={`light-mode ${selectedMode === "light" && 'selected' }` }> 
                        <button onClick={() => handleModeSelect('light')}> 
                            <img src={light} alt=""/>
                        </button>
                    </div>

                    <div className={`dark-mode ${selectedMode === "dark" && 'selected' }` }>

                        <button onClick={() => handleModeSelect('dark')}> 
                            <img src={dark} alt=""/>
                        </button>

                    </div>

                </div>
             </div>

        </div>
    );
}



export default DisplaySettings;
