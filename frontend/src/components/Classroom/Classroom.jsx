import React, { useEffect, useState, useRef } from 'react';
import './Classroom.css';
import leftArrow from '../../assets/leftarrow.svg';
import { useNavigate } from 'react-router-dom';
import Bookmark from '../Interface/Bookmark/Bookmark';
import useAuth from '../../hooks/useAuth.js';
import '../../assets/fonts.css'
import EditAttributes from './EditAttributes/EditAttributes.jsx';
import Loader from '../Loader/Loader.jsx';
import FileUpload from '../FileUpload/FileUpload.jsx';
import RatingComponent from '../Rating/Rating.jsx';
import Flag from '../Flag/Flag.jsx';

import Edit from '../../assets/Icons/Edit.svg';
import Outlets from '../../assets/Icons/Outlets.svg';
import Windows from '../../assets/Icons/Windows.svg';
import Printer from '../../assets/Icons/Printer.svg';
import FilledStar from '../../assets/Icons/FilledStar.svg';
import circleWarning from '../../assets/gray-circle-warning.svg';
import useOutsideClick from '../../hooks/useClickOutside';

import Image from '../../assets/Icons/Image.svg';

import { findNext } from '../../pages/Room/RoomHelpers.js';
import { useNotification } from '../../NotificationContext.js';

import '../../pages/Room/Room.css';
import axios from 'axios';
import Rating from 'react-rating';

function Classroom({ room, state, setState, schedule, roomName, width, setShowMobileCalendar, setIsUp }) {

    // const { sendMessage } = useWebSocket({
    //     ping: () => {
    //         sendMessage('pong');
    //     }
    // });

    const [image, setImage] = useState("")
    const { isAuthenticating, isAuthenticated, user } = useAuth();
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const [defaultImage, setDefaultImage] = useState(false);
    const [fillerHeight, setFillerHeight] = useState(0);
    const [isClassImgOpen, setClassImgOpen] = useState(false);

    const handleImageClick = () => {
        setClassImgOpen(true);
    };

    const closeImage = () => {
        setClassImgOpen(false);
    };

    const ref = useRef();

    useOutsideClick(ref, () => {
        closeImage();
    });

    const checkInRef = useRef(null);
    const [rating, setRating] = useState(0);


    const [edit, setEdit] = useState(false);
    const attributeIcons = {
        "outlets": Outlets,
        "windows": Windows,
        "printer": Printer
    };

    const { addNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        if (checkInRef.current) {
            setFillerHeight(checkInRef.current.clientHeight + 10);
            console.log(checkInRef.current.clientHeight);
        }
    }, [checkInRef.current]);

    useEffect(() => {
        setImage("");
    }, [room])

    useEffect(() => {

        if (room === null || room === undefined) {
            return;
        }
        if (room.image === "https://studycompass.s3.amazonaws.com/downsizedPlaceholder.jpeg") {
            setDefaultImage(true);

        }
        setImage(room.image);
    }, [room]);

    // useEffect(() => { console.log(state) }, [state]);
    useEffect(() => {
        setSuccess(schedule ? findNext(schedule.weekly_schedule).free : true);
        setMessage(schedule ? findNext(schedule.weekly_schedule).message : "");
    }, [schedule]);

    if (!room) {
        return <Loader />;
    }

    if (room.name === "none" || room.attributes === undefined) {
        return "";
    }

    if (!roomName) {
        return "";
    }

    const backtoResults = () => {
        setState("calendarSearch");
        navigate(-1);
    };

    const checkIn = () => {
        try {
            const response = axios.post('/check-in', { classroomId: room._id });
        } catch (error) {
            console.log(error);
            addNotification({ title: "An error occured", message: "an internal error occured", type: "derror" })
        }
    }

    return (
        <div className='classroom-component'>
            <div className={`whole-page ${isClassImgOpen ? 'in' : 'out'}`}>
                <div className={`img-pop-up ${isClassImgOpen ? 'in' : 'out'}`} ref={ref}>
                    <img src={image} alt="classroom"></img>
                </div>
            </div>
            <div className='z-index'>
                <div className={`image ${image === "" ? "shimmer" : ""}`}>
                    {!(image === "") ?
                        <img src={image} alt="classroom" className={`${isClassImgOpen ? 'out' : 'in'}`}></img>
                    : ""}
                    {
                        (room.image !=="https://studycompass.s3.amazonaws.com/downsizedPlaceholder.jpeg") && 
                        <div className={`open-image ${isClassImgOpen ? 'out' : 'in'}`} onClick={handleImageClick}>
                            <img src={Image} alt="open image" />
                            <p>View</p>
                        </div>
                    }
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
                            <p>0</p>
                        </div>
                        <div className="rating-num">
                            0 ratings
                        </div>
                        { isAuthenticated &&                  
                        <button className="add-rating" >
                            <p>add your rating</p>
                        </button>
                        }
                        {/* <div className={`${success ? 'free-until' : 'class-until'}`}>
                            <div className="dot">
                                <div className="outer-dot"></div>
                                <div className="inner-dot"></div>
                            </div>
                            {success ? "free" : "class in session"} {message}                    
                        </div> */}
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
                    {
                        defaultImage && (!isAuthenticating) && isAuthenticated && user.admin ? <FileUpload classroomName={room.name} /> : ""
                    }
                    <div>
                        <Flag functions={setIsUp} primary={"rgba(176, 175, 175, .13)"} img={circleWarning} accent={"#D9D9D9"} color={"#737373"} text={"As Study Compass is still in beta, certain information may be incorrect. Reporting incorrect information is an important part of our troubleshooting process, so please help us out!"} />
                    </div>
                    <RatingComponent rating={rating} setRating={setRating} />

                    <div className="filler" style={{ height: `${fillerHeight}px` }}>

                    </div>
                </div>
                {user && user.admin ? room ? edit ? <EditAttributes room={room} attributes={room.attributes} setEdit={setEdit} /> : "" : "" : ""}
                {/* </div>
                </div>
                { user && user.admin ? room ? edit ? <EditAttributes room={room} attributes={room.attributes} setEdit={setEdit} /> : "" : "" : "" } */}


                {/* {isAuthenticated && } */ }
                <div className="check-in" ref={checkInRef}>
                    <div className={`${success ? 'free-until' : 'class-until'}`}>
                        <div className="dot">
                            <div className="outer-dot"></div>
                            <div className="inner-dot"></div>
                        </div>

                        {success ? "free" : "class in session"} {message}
                    </div>
                    <div className="button-container">
                        {width < 800 && <button className="schedule-button" onClick={() => { setShowMobileCalendar(true) }}>view-schedule</button>}
                        <button disabled={!success || !isAuthenticated || true} className="check-in-button">check in</button>
                    </div>
                    <p>check-in functionality coming soon!</p>
                </div>
            </div >
        </div >
    );
}

export default Classroom;
