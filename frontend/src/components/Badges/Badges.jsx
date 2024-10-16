import React, { useState, useEffect } from 'react';
import './Badges.scss';

function Badges({ badges, size }) {
    const numericalSize = size ? parseInt(size.replace("px", "")) : 99;
    return (
        <div className="badges">
            {badges.map((badge, index) => (
                <div className={`badge ${ badge.replace(/ /g, "-")} ${size ?( numericalSize < 10 ? "small" : "normal") : "normal"}`} key={index}>
                    <p style={size && {fontSize:size}}>{badge}</p>
                </div>
            ))}
        </div>
    );
}

export default Badges;