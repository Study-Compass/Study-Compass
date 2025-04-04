import React, { useState, useEffect } from 'react';
import axios from 'axios';
import pfp from '../../../assets/defaultAvatar.svg';
import Badges from '../../Badges/Badges';
import './ViewCheckedIn.scss';


function ViewCheckedIn({currentUser, users, room}){
    const [error, setError] = useState([]);
    useEffect(() => {
        //populate error array with all false for every user
        setError(new Array(users.length).fill(false));
    }, [users]);

    const onError = (index) => {
        let newError = [...error];
        newError[index] = true;
        setError(newError);
    }

    useEffect(() => {
        console.log(error);
    }, [error]);
    return (
        <div className="checked-in-users">
            {
                <h3>Currently checked in to {room[1]}</h3>
            }
            <div className="list-users">
                {users.map((user, index) => {
                    return (
                        <div className="list-user-line">
                            <div className="list-user-top">
                                <img 
                                    src={error[index] === true ? pfp : user && user.picture ? user.picture : pfp} 
                                    alt={user ? user.name : ""} 
                                    key={user ? user._id : ""} 
                                    className={`user `}
                                    onError={()=> onError(index)}
                                />
                                <div className="list-user-right">
                                    <h2>{user.name}</h2>
                                    <h4>@{user.username}</h4>
                                    <Badges badges={user && user.tags} size="9px"/>
                                </div>
                            </div>
                        
                        {users.length===1 ? 
                        <span></span> : <span className="multiple-user"></span>} 

                        </div>
                        
                    )
                })}
            </div>
            <button className="check-in">check out</button>
            {/* <div className="button-container">
                {
                    room.checked_in.includes(currentUser._id) ?
                        <button className="out">check out</button>
                        :
                        <button className="check-in-button">check in</button>
                }
            </div> */}
        </div>
    )
}

export default ViewCheckedIn;