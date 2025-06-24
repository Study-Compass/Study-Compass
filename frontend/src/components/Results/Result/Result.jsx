import React from 'react';
import './Result.scss';
import FilledStar from '../../../assets/Icons/FilledStar.svg';
import Bookmark from '../../../assets/Icons/Bookmark.svg';
import useAuth from '../../../hooks/useAuth';

function Result({ result, attributes, debouncedFetchData, changeURL, findNext, contentState }) {
    const schedule = result.data.weekly_schedule;
    const success = findNext(schedule).free;
    const message = findNext(schedule).message;

    const { user } = useAuth();

    return (
        <li
            className={`result ${attributes.includes('restricted access') ? "restricted": "" }`}
            value={result.room.name} 
            onMouseOver={() => {debouncedFetchData(result.room._id)}} 
            onMouseLeave={()=>{debouncedFetchData("none")}}
            onClick={() => {changeURL(result.room.name)}}
        >
            {user ? user.saved.includes(result.room._id) ?  
                <img src={Bookmark} alt="bookmark" className="saved-img"/>:"":""
            }
            <div className="image">
                {result.room.image ? <img src={`${process.env.PUBLIC_URL}${result.room.image}`} alt="classroom" width={100} height={75} />:""}
            </div>
            <div className="result-info">
                <h2>{result.room.name.toLowerCase()}</h2>
                <div className="info-row">      
                    <div className="rating">
                        <img src={FilledStar} alt="star" />
                        <p>{result.room.average_rating.toFixed(1)}</p>
                    </div>
                    { contentState === "nameSearch" || contentState === "freeNowSearch" ?

                        <div className={`${success ? 'free-until' : 'class-until'}`}>
                            <div className="dot">
                                <div className="outer-dot"></div>
                                <div className="inner-dot"></div>
                            </div>
                            {success ? "free" : "class in session"} {message}                    
                        </div> : ""
                    }
                </div>
            </div>
        </li>
    );
}

export default Result;