import React, { useState, useEffect } from 'react';
import './AllRatings.scss';
import UserRating from '../UserRating/UserRating';
import { getRatings } from '../../../DBInteractions';
import Loader from '../../Loader/Loader';
import RatingGraph from './RatingGraph/RatingGraph';

function AllRatings({ classroomId, average_rating, givenRatings }) {
    const [ratings, setRatings] = useState(null);
    if (!givenRatings) {
        return <div className="all-ratings placeholder">
            <Loader />
        </div>;
    }

    return (
        <div className="all-ratings">
            <h2>all ratings</h2>
            <RatingGraph ratings={givenRatings} average_rating={average_rating}/>
            <div className="ratings">
                {givenRatings && givenRatings.map((rating) => (
                    <UserRating key={rating.id} rating={rating} providedUser={rating.user_info}/>
                ))}
            </div>
        </div>
    );
}

export default AllRatings;