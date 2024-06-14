import React from 'react';
import './CardHeader.css';



function CardHeader(){
    return (
        <div className="card-header">
            hello1
            <p>test</p>
            hello2
            <div className="stats">
                <p><p className="num">123</p>rooms visited</p>
                <p><p className="num">18</p>study partners</p>
                <p><p className="num">500</p>study sessions</p>
                <p><p className="num">1000</p>hours studied</p>
                <p><p className="num">123</p>community contributions</p>
            </div>
        </div>
    )
}


export default CardHeader;