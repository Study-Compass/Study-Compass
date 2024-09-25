import React, { useState, useEffect } from 'react';
import './UserRating.scss';
import useAuth from '../../../hooks/useAuth';
import Loader from '../../Loader/Loader';
import Badges from '../../Badges/Badges';
import FilledStar from '../../../assets/Icons/FilledStar.svg';
import defaultAvatar from '../../../assets/defaultAvatar.svg';

function UserRating({ rating, providedUser }) {
    const {isAuthenticating, user} = useAuth();

    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        if(providedUser){
            setUserInfo(providedUser[0]);
            console.log(providedUser);
            return
        }
        if(userInfo){
            return;
        }
        if(user && !isAuthenticating){
            setUserInfo(user);
        }
    }, [providedUser, user, isAuthenticating]);

    useEffect(() => {
        if(!userInfo){
            return;
        }
        console.log(userInfo);
    }, [userInfo]);

    if(isAuthenticating){
        return (
            <div className="user-rating placeholder">
                <Loader/>
            </div>
        );
    }

    if(!userInfo){
        return;
    }

    return (
        <div className={`user-rating  ${!providedUser ? "own" : ""}`}>
            <div className="content-row">
                <div className="pfp-col">
                    <img src={userInfo && userInfo.picture ? userInfo.picture : defaultAvatar} alt="profile-pic"/>
                </div>
                <div className="info-col">
                    <div className="info-row">
                        <h3>{userInfo && userInfo.name}</h3>
                        <Badges badges={userInfo && userInfo.tags} size="9px"/>
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