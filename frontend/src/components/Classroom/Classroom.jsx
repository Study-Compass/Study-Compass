import React, { useEffect, useState, useRef } from 'react';
import './Classroom.css';
import leftArrow from '../../assets/leftarrow.svg';
import { useNavigate } from 'react-router-dom';
import Bookmark from '../Interface/Bookmark/Bookmark';
import useAuth from '../../hooks/useAuth.js';
import '../../assets/fonts.css'
import EditAttributes from './EditAttributes/EditAttributes.jsx';
import CheckedIn from './CheckedIn/CheckedIn.jsx';
import Loader from '../Loader/Loader.jsx';
import FileUpload from '../FileUpload/FileUpload.jsx';
import RatingComponent from '../Rating/Rating.jsx';
// import { useWebSocket1 } from '../../WebSocketContext.js';
import Flag from '../Flag/Flag.jsx';
import Popup from '../Popup/Popup.jsx';

import Edit from '../../assets/Icons/Edit.svg';
import Outlets from '../../assets/Icons/Outlets.svg';
import Windows from '../../assets/Icons/Windows.svg';
import Printer from '../../assets/Icons/Printer.svg';
import FilledStar from '../../assets/Icons/FilledStar.svg';
import circleWarning from '../../assets/gray-circle-warning.svg';
import useOutsideClick from '../../hooks/useClickOutside';

import Image from '../../assets/Icons/Image.svg';

import { checkIn, checkOut, getUser, getUsers } from '../../DBInteractions.js';
import { findNext } from '../../pages/Room/RoomHelpers.js';
import { useNotification } from '../../NotificationContext.js';

import '../../pages/Room/Room.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import Rating from 'react-rating';

function Classroom({ room, state, setState, schedule, roomName, width, setShowMobileCalendar, setIsUp, reload }) {

    // const { sendMessage } = useWebSocket({
    //     ping: () => {
    //         sendMessage('pong');
    //     }
    // });

    useEffect(() => {
        if(!room){
            return;
        }
        console.log(room);
        // Connect to WebSocket server
        
        //get all users currently checked in
        const getCheckedInUsers = async () => {
            try{
                const users = await getUsers(room.checked_in);
                const checkedInUsers = {};
                users.forEach(user => {
                    checkedInUsers[user._id] = user;
                });
                setCheckedInUsers(checkedInUsers);
            } catch (error){
                console.log(error);
                addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
            }
        }

        getCheckedInUsers();
                

        const socket = io(
            process.env.NODE_ENV === 'production' ? 'https://www.study-compass.com' : 'http://localhost:5001', {
            transports: ['websocket'],  // Force WebSocket transport
            }
        );

        console.log(process.env.NODE_ENV);

        // Join the room for this classroom
        socket.emit('join-classroom', room._id);

        // Listen for check-in events
        socket.on('check-in', (data) => {
            if (data.classroomId === room._id) {
                console.log('another user checked in');
                reload();
                handleNewUserCheckIn();
            }
        });     

        // Listen for check-out events
        socket.on('check-out', (data) => {
            if (data.classroomId === room._id) {
                console.log('another user checked out');
                reload();
                // remove user from checked in
                setCheckedInUsers(prevState => {
                    const newState = { ...prevState };
                    delete newState[data.userId];
                    return newState;
                });
            }
        });

        // Clean up on component unmount
        return () => {
            socket.disconnect();
        };
    }, [room]);

    const [image, setImage] = useState("")
    const { isAuthenticating, isAuthenticated, user } = useAuth();
    const [success, setSuccess] = useState(false);
    const [message, setMessage] = useState("");
    const [defaultImage, setDefaultImage] = useState(false);
    const [fillerHeight, setFillerHeight] = useState(0);
    const [isClassImgOpen, setClassImgOpen] = useState(false);

    const [checkoutText, setCheckoutText] = useState(false);

    const [checkedInUsers, setCheckedInUsers] = useState({});

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
    
    const [isRatingPopupOpen, setIsRatingPopupOpen] = useState(false);

    const handleOpenRatingPopup = () => setIsRatingPopupOpen(true);
    const handleCloseRatingPopup = () => setIsRatingPopupOpen(false);

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

    const handleCheckIn = async () => {
        try {
            const response = await checkIn(room._id);
            console.log(response);  
            await reload();
        } catch (error) {
            console.log(error);
            addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
        }
    }

    const handleCheckOut = async () => {
        try {
            const response = await checkOut(room._id);
            console.log(response);  
            await reload();

        } catch (error) {
            console.log(error);
            addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
        }
    }

    const handleNewUserCheckIn = async () => {
        try{
            //get new user id from room.checked_in, not in checkedInUsers
            const id = room.checked_in.filter(userId => !(userId in checkedInUsers))[0];
            const user = await getUser(id);
            //add user to checkedInUsers
            setCheckedInUsers(prevState => {
                return {
                    ...prevState,
                    [id]: user
                }
            });
        } catch (error){
            console.log(error);
            addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
        }
    }


    return (
        <div className={`classroom-component  ${user && room.checked_in.includes(user._id) ? "checked-in" : ""}`}>
            <Popup isOpen={isRatingPopupOpen} onClose={handleCloseRatingPopup}>
                <RatingComponent rating={rating} setRating={setRating} name={room.name}/>
            </Popup>
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
                        <button className="add-rating" onClick={handleOpenRatingPopup} >
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
                    { room && room.checked_in && room.checked_in.length > 0 &&
                        <CheckedIn users={Object.values(checkedInUsers)} />
                    }
                    <div className="button-container">
                        {width < 800 && <button className="schedule-button" onClick={() => { setShowMobileCalendar(true) }}>view-schedule</button>}
                        {
                            user && room.checked_in.includes(user._id) ?  
                            <button className={`${checkoutText && "out"}`} onClick={handleCheckOut} onMouseOver={()=>setCheckoutText(true)} onMouseLeave={()=>setCheckoutText(false)}> {checkoutText ? "check out" : "checked in"}</button>
                            :
                            <button disabled={!success || !isAuthenticated} className="check-in-button" onClick={handleCheckIn}>check in</button>
                        }
                    </div>
                    {/* <p>check-in functionality coming soon!</p> */}
                </div>
            </div >
        </div >
    );
}

export default Classroom;
