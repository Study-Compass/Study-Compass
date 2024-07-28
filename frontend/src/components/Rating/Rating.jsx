import React, { useEffect, useState } from "react";
import Rating from 'react-rating'
import './Rating.css';
import FilledStar from '../../assets/Icons/FilledStar.svg';
import EmptyStar from '../../assets/Icons/EmptyStar.svg';

function RatingComponent({ rating, setRating }) {
    const [hoverRating, setHoverRating] = useState(0);
    useEffect(() => {
        setRating(rating);
    }, [rating]);

    return (
        <div className="rating">
            <Rating
                initialRating={rating}
                emptySymbol={<img src={EmptyStar} className="icon" />}
                fullSymbol={<img src={FilledStar} className="icon" />}
                onChange={(rate) => setRating(rate)}
                onHover={(rate) => setHoverRating(rate)}
                fractions={2}
            />
            <p>{hoverRating}</p>
        </div>
    )
}

export default RatingComponent;