import React, { useState, useEffect } from 'react';
import './UserRating.css';
import useAuth from '../../../hooks/useAuth';
import Loader from '../../Loader/Loader';
import Badges from '../../Badges/Badges';
import FilledStar from '../../../assets/Icons/FilledStar.svg';
import defaultAvatar from '../../../assets/defaultAvatar.svg';

function UserRating({ rating }) {
    const {isAuthenticating, user} = useAuth();

    if(isAuthenticating){
        return (
            <div className="user-rating placeholder">
                <Loader/>
            </div>
        );
    }

    if(!user){
        return;
    }

    return (
        <div className="user-rating">
            <div className="content-row">
                <div className="pfp-col">
                    <img src={user.picture ? user.picture : defaultAvatar} alt="profile-pic"/>
                </div>
                <div className="info-col">
                    <div className="info-row">
                        <h3>{user.name}</h3>
                        <Badges badges={user.tags} size="9px"/>
                        {/* <Badges badges={["beta tester", "developer", "admin", "beta tester"]} size="9px"/> */}
                    </div>
                    <div className="info-row rating">
                        <img src={FilledStar} alt="" />
                        <p className="score">{rating.score}</p>
                    </div>
                    <div className="info-row">
                        <p className="comment">{rating.comment}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserRating;