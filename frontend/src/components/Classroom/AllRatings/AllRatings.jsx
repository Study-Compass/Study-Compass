import React, { useState, useEffect } from 'react';
import './AllRatings.css';
import UserRating from '../UserRating/UserRating';
import { getRatings } from '../../../DBInteractions';
import Loader from '../../Loader/Loader';

function AllRatings({ classroomId }) {
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
            <h2>ratings</h2>
            {ratings && ratings.map((rating) => (
                <UserRating key={rating.id} rating={rating} providedUser={rating.user_info}/>
            ))}
        </div>
    );
}

export default AllRatings;