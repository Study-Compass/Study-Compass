import React, { useEffect, useState } from "react";
import Rating from 'react-rating'
import './Rating.scss';
import FilledStar from '../../assets/Icons/FilledStar.svg';
import EmptyStar from '../../assets/Icons/EmptyStar.svg';
import { updateRating } from "../../DBInteractions";
import useAuth from "../../hooks/useAuth";
import {Filter} from 'bad-words';
import Flag from '../Flag/Flag';
import circleWarning from '../../assets/circle-warning.svg';

function RatingComponent({ classroomId, rating, setRating, name, handleClose, reload }) {
    const [hoverRating, setHoverRating] = useState(rating);
    const [displayRating, setDisplayRating] = useState(rating);
    const [comment, setComment] = useState("");
    const [isProfane, setIsProfane] = useState(false);

    const [buttonActive, setButtonActive] = useState(false);

    const { user, isAuthenticated } = useAuth();

    const filter = new Filter();

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
        setDisplayRating(rating);
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
            if(filter.isProfane(comment)) {
                console.log("Profanity detected");
                setIsProfane(true);
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
            {isProfane && <Flag text="Please refrain from using profanity" img={circleWarning} color={"#FD5858"} primary={"rgba(250, 117, 109, 0.16)"} accent={"#FD5858"} />}
            <h1>How would you rate {name && name}?</h1>
            <div className="stars">
                <h2>{displayRating}</h2>
                <Rating
                    initialRating={rating}
                    emptySymbol={<img src={EmptyStar} className="icon" />}
                    fullSymbol={<img src={FilledStar} className="icon" />}
                    onChange={(rate) => setRating(rate)}
                    onHover={(rate) => setHoverRating(rate)}
                    fractions={1}
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