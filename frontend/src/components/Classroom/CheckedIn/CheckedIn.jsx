import React, { useState, useEffect } from 'react';
import axios from 'axios';
import pfp from '../../../assets/defaultAvatar.svg';
import './CheckedIn.scss';

function CheckedIn({users}){
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
        <div className="checked-in-component">
            {users.length > 0 &&
                <h3>{users[0] && users[0].name} {users && users.length > 1 ? `and ${users.length-1} others` : "is"} checked in</h3>
            }
            <div className="user-images">
                {users.map((user, index) => {
                    return (
                        <div className="user-image">
                            <img 
                                src={error[index] === true ? pfp : user && user.picture ? user.picture : pfp} 
                                alt={user ? user.name : ""} 
                                key={user ? user._id : ""} 
                                className={`user `}
                                onError={()=> onError(index)}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default CheckedIn;