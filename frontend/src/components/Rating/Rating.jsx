import React, { useEffect, useState } from "react";
import Rating from 'react-rating'
import './Rating.css';
import FilledStar from '../../assets/Icons/FilledStar.svg';
import EmptyStar from '../../assets/Icons/EmptyStar.svg';

function RatingComponent({ rating, setRating, name }) {
    const [hoverRating, setHoverRating] = useState(rating);
    const [displayRating, setDisplayRating] = useState(rating);
    const [comment, setComment] = useState("");

    useEffect(()=>{
        if(hoverRating === undefined) {
            setDisplayRating(rating);
            return;
        }
        setDisplayRating(hoverRating);
        console.log(hoverRating);
    },[hoverRating])

    useEffect(() => {
        setRating(rating);
    }, [rating]);

    return (
        <div className="rating-component">
            <h1>How would you rate {name && name}?</h1>
            <div className="stars">
                <h2>{displayRating}</h2>
                <Rating
                    initialRating={rating}
                    emptySymbol={<img src={EmptyStar} className="icon" />}
                    fullSymbol={<img src={FilledStar} className="icon" />}
                    onChange={(rate) => setRating(rate)}
                    onHover={(rate) => setHoverRating(rate)}
                    fractions={2}
                />
            </div>
            <div className="comment">
                <p className="why">
                    Tell us why
                </p>
                <textarea 
                    value={comment} 
                    onChange={(e)=> setComment(e.target.value)} 
                /> 
            </div>
            <button className={`save-button`}>save</button>
        </div>
    )
}

export default RatingComponent;