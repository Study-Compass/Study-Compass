import React, { useState, useEffect } from 'react';
import './AllRatings.css';
import UserRating from '../UserRating/UserRating';
import { getRatings } from '../../../DBInteractions';
import Loader from '../../Loader/Loader';
import RatingGraph from './RatingGraph/RatingGraph';

function AllRatings({ classroomId, average_rating }) {
    const [ratings, setRatings] = useState(null);
    useEffect(() => {
        getRatings(classroomId)
            .then((response) => {
                setRatings(response.data.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }, [classroomId]);

    if (!ratings) {
        return <div className="all-ratings placeholder">
            <Loader />
        </div>;
    }

    return (
        <div className="all-ratings">
            <h2>all ratings</h2>
            <RatingGraph ratings={ratings} average_rating={average_rating}/>
            <div className="ratings">
                {ratings && ratings.map((rating) => (
                    <UserRating key={rating.id} rating={rating} providedUser={rating.user_info}/>
                ))}
            </div>
        </div>
    );
}

export default AllRatings;