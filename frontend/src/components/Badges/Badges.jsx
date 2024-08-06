import React, { useState, useEffect } from 'react';
import './Badges.css';

function Badges({ badges }) {
    return (
        <div className="badges">
            {badges.map((badge, index) => (
                <div className={`badge ${ badge.replace(/ /g, "-")}`} key={index}>
                    <p>{badge}</p>
                </div>
            ))}
        </div>
    );
}

export default Badges;