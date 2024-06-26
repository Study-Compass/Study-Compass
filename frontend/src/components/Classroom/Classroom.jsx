import React, { useEffect, useState } from 'react';
import './Classroom.css';
import leftArrow from '../../assets/leftarrow.svg';
import { useNavigate } from 'react-router-dom';
import Bookmark from '../Interface/Bookmark/Bookmark';
import useAuth from '../../hooks/useAuth.js';
import '../../assets/fonts.css'
import EditAttributes from './EditAttributes/EditAttributes.jsx';
import Loader from '../Loader/Loader.jsx';

import Edit from '../../assets/Icons/Edit.svg';
import Outlets from '../../assets/Icons/Outlets.svg';
import Windows from '../../assets/Icons/Windows.svg';
import Printer from '../../assets/Icons/Printer.svg';
import FilledStar from '../../assets/Icons/FilledStar.svg';

import { findNext } from '../../pages/Room/RoomHelpers.js';

import '../../pages/Room/Room.css';

function Classroom({ room, state, setState, schedule, roomName }) {

    const [image, setImage] = useState("")
    const { user } = useAuth();
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");

    const [edit, setEdit] = useState(false);
    const attributeIcons = {
        "outlets": Outlets,
        "windows": Windows,
        "printer": Printer
    };

    const navigate = useNavigate();

    useEffect(() => {
        setImage("");
    }, [room])

    useEffect(() => {
        if (room === null || room === undefined) {
            return;
        }
        if (room.image === "/") {
            // console.log("image is /");
            setImage("https://www.jmzarchitects.com/wp-content/uploads/2020/03/17112901-2-scaled.jpg");
        } else {
            setImage(`${process.env.PUBLIC_URL}${room.image}`);
        }
    }, [room]);

        // useEffect(() => { console.log(state) }, [state]);
    useEffect(() => {
        setSuccess(schedule ? findNext(schedule.weekly_schedule).free : true);
        setMessage(schedule ? findNext(schedule.weekly_schedule).message : "");
    }, [schedule]);

    if (!room) {
        return <Loader/>;
    }

    if(room.name === "none"|| room.attributes === undefined){
        return "";
    }

    if(!roomName){
        return "";
    }

    const backtoResults = () => {
        setState("calendarSearch");
        navigate(-1);
    };



    return (
        <div className='classroom-component'>
            <div className={`image ${image === "" ? "shimmer" : ""}`}>
                {!(image === "") ?
                    <img src={image} alt="classroom"></img>
                    : ""}
            </div>

            <div className="classroom-info">
                {state === "calendarSearchResult" ? <div className="back-to-results" onClick={backtoResults}>
                    <img src={leftArrow} alt="back arrow" ></img>
                    <p>back to results</p>
                </div> : ""}
                <div className="header-row">
                    <h1>{roomName}</h1>
                    <div className="bookmark-container">
                        <Bookmark room={room} />
                    </div>
                </div>
                <div className="info-row">
                    <div className="rating">
                        <img src={FilledStar} alt="star" />
                        <p>4.6</p>
                    </div>
                    <div className={`${success ? 'free-until' : 'class-until'}`}>
                        <div className="dot">
                            <div className="outer-dot"></div>
                            <div className="inner-dot"></div>
                        </div>
                        {success ? "free" : "class in session"} {message}                    
                    </div>
                </div>
                <div className="attributes">
                    {room && room.attributes.map((attribute, index) => {
                        return (
                            <div className="attribute" key={index}>
                                {attribute in attributeIcons ? <img src={attributeIcons[attribute]} alt={attribute} /> : ""}
                                {attribute}
                            </div>
                        );
                    })}
                    {user && user.admin ? <div className="attribute" onClick={() => { setEdit(!edit) }}><img src={Edit} alt="" /></div> : ""}
                </div>
            </div>
            {user && user.admin ? room ? edit ? <EditAttributes room={room} attributes={room.attributes} setEdit={setEdit} /> : "" : "" : ""}
        </div>
    );
}

export default Classroom;
