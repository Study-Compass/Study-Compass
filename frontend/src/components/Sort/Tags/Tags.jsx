import React, { useState } from 'react';
import './Tags.css';
import { attributeIcons } from '../../../Icons';

function Tags(){
    
    const [tagsState, setTagsState] = useState(true); //true for include, false for exclude

    return (
        <div className="sort-popup">
            <div className="heading">
                <h1>Tags</h1>
                <p>clear</p>
            </div>
            <label className="switch">
                <input type="checkbox" onChange={()=>{setTagsState(!tagsState)}}/>
                <div className="slider">
                    <span>include</span>
                    <span>exclude</span>
                </div>
            </label>
            <div className="tags-container">
                <div className={`tags-content ${tagsState ? "" : "next"}`}>
                    <div className="include">
                        <div className="option">
                            <img src={attributeIcons["windows"]} alt="outlets"/>
                            <p>windows</p>
                        </div>
                        <div className="option">
                            <img src={attributeIcons["outlets"]} alt="outlets"/>
                            <p>outlets</p>
                        </div>
                        <div className="option">
                            <img src={attributeIcons["printer"]} alt="outlets"/>
                            <p>printer</p>
                        </div>

                    </div>
                    <div className="exclude">
                    <div className="option">
                            <img src={attributeIcons["windows"]} alt="outlets"/>
                            <p>windows</p>
                        </div>
                        <div className="option">
                            <img src={attributeIcons["outlets"]} alt="outlets"/>
                            <p>outlets</p>
                        </div>
                        <div className="option">
                            <img src={attributeIcons["printer"]} alt="outlets"/>
                            <p>printer</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Tags;