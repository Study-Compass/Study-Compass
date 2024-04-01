import React from 'react';
import './Tags.css';

function Tags(){
    return (
        <div className="sort-popup">
            <div className="heading">
                <h1>Tags</h1>
                <p>clear</p>
            </div>
            <label className="switch">
                <input type="checkbox"/>
                <div className="slider">
                    <span>include</span>
                    <span>exclude</span>
                </div>
            </label>
        </div>
    );
}

export default Tags;