import React, { useState, useEffect } from 'react';
import './Bookmark.css';
import useAuth from '../../../hooks/useAuth';
import { save } from '../../../DBInteractions';
import { useNotification } from '../../../NotificationContext';

function Bookmark({ room }) {    
    const [isChecked, setIsChecked] = useState(false);
    const { user, isAuthenticated, validateToken } = useAuth();
    const { addNotification } = useNotification();

    useEffect(() => {
        if(room && isAuthenticated) {
            setIsChecked(user.saved.includes(room._id));
        }
    }, [isAuthenticated, room]);

    const onCheck = async (e) => {
        if (!isAuthenticated) {
            addNotification({ title: "Please log in", message: "You must be logged in to save a room", type: "error" });
            return;
        }
        const operation = e.target.checked;
        setIsChecked(operation);
        try {
            await save(room._id, user._id, operation);
            if(operation){
                addNotification({ title: "Room saved", message: operation ? "Room saved successfully" : "Room removed from saved", type: "success" });
            } else {
                addNotification({ title: "Room removed", message: operation ? "Room saved successfully" : "Room removed from saved", type: "success" });
            }
            validateToken();
        } catch (error) {
            addNotification({ title: "Error saving room", message: error.message, type: "error" });
        }
    }

    
    return (
        <label className="ui-bookmark">
            <input type="checkbox" checked={isChecked} onChange={onCheck}/>
            <div className="bookmark">
                <svg viewBox="0 0 32 32">
                    <g>
                        <path d="M27 4v27a1 1 0 0 1-1.625.781L16 24.281l-9.375 7.5A1 1 0 0 1 5 31V4a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4z"></path>
                    </g>
                </svg>
            </div>
        </label>
    );
}

export default Bookmark;