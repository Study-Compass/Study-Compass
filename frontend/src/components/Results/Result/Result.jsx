import React from 'react';
import './Result1.css';

function Result({ result, debouncedFetchData, changeURL, findNext }) {
    return (
        <li
            className="result" 
            value={result.room.name} 
            onMouseOver={() => {debouncedFetchData(result.room._id)}} 
            onMouseLeave={()=>{debouncedFetchData("none")}}
            onClick={() => {changeURL(result.room.name)}}
        >
            <div className="image">
                {result.room.image ? <img src={`${process.env.PUBLIC_URL}${result.room.image}`} alt="classroom" width={100} height={75} />:""}
            </div>
            <div className="result-info">
                <h2>{result.room.name.toLowerCase()}</h2>
                <div className="free-until">
                    <div className="dot">
                        <div className="outer-dot"></div>
                        <div className="inner-dot"></div>
                    </div>
                    free { result ? findNext(result.data.weekly_schedule).message : ''}
                </div> 
            </div>
        </li>
    );
}

export default Result;