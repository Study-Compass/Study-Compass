import React, { useEffect, useState } from "react";
import Rating from 'react-rating'
import './Rating.scss';
import FilledStar from '../../assets/Icons/FilledStar.svg';
import EmptyStar from '../../assets/Icons/EmptyStar.svg';
import { updateRating } from "../../DBInteractions";
import useAuth from "../../hooks/useAuth";

function RatingComponent({ classroomId, rating, setRating, name, handleClose, reload }) {
    const [hoverRating, setHoverRating] = useState(rating);
    const [displayRating, setDisplayRating] = useState(rating);
    const [comment, setComment] = useState("");

    const [buttonActive, setButtonActive] = useState(false);

    const { user, isAuthenticated } = useAuth();


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
        if(rating === 0) {
            setButtonActive(false);
        } else {
            setButtonActive(true);
        }
    }, [rating]);


    const handleSubmit = async () => {
        try{
            if(!user || !isAuthenticated) {
                console.log("User not authenticated");
                return;
            }
            const response = await updateRating(classroomId, user._id, comment, rating, 0, 0);
            console.log(response);
            handleClose();
            reload();
        } catch (error) {
            console.log(error);
            handleClose();

        }
    }

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
            <button disabled={!buttonActive} className={`save-button ${buttonActive && "alt"}`} onClick={handleSubmit}>save</button>
        </div>
    )
}

export default RatingComponent;