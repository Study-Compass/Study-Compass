import React, { useEffect, useState, useRef } from 'react';
import './Classroom.scss';
import leftArrow from '../../assets/leftarrow.svg';
import { useNavigate } from 'react-router-dom';
import Bookmark from '../Interface/Bookmark/Bookmark';
import useAuth from '../../hooks/useAuth.js';
import EditAttributes from './EditAttributes/EditAttributes.jsx';
import CheckedIn from './CheckedIn/CheckedIn.jsx';
import Loader from '../Loader/Loader.jsx';
import FileUpload from '../FileUpload/FileUpload.jsx';
import RatingComponent from '../Rating/Rating.jsx';
// import { useWebSocket1 } from '../../WebSocketContext.js';
import Flag from '../Flag/Flag.jsx';
import Popup from '../Popup/Popup.jsx';
import UserRating from './UserRating/UserRating.jsx';
import AllRatings from './AllRatings/AllRatings.jsx';
import RatingGraph from './AllRatings/RatingGraph/RatingGraph.jsx';

import Edit from '../../assets/Icons/Edit.svg';
import Outlets from '../../assets/Icons/Outlets.svg';
import Windows from '../../assets/Icons/Windows.svg';
import Printer from '../../assets/Icons/Printer.svg';
import FilledStar from '../../assets/Icons/FilledStar.svg';
import circleWarning from '../../assets/gray-circle-warning.svg';
import useOutsideClick from '../../hooks/useClickOutside';

import Image from '../../assets/Icons/Image.svg';

import { checkIn, checkOut, getUser, getUsers, userRated, getRatings } from '../../DBInteractions.js';
import { findNext } from '../../pages/Room/RoomHelpers.js';
import { useNotification } from '../../NotificationContext.js';
import { useWebSocket } from '../../WebSocketContext.js';

import '../../pages/Room/Room.scss';

function Classroom({ room, state, setState, schedule, roomName, width, setShowMobileCalendar, setIsUp, reload }) {
    const [image, setImage] = useState("")
    const { isAuthenticating, isAuthenticated, user, getCheckedIn } = useAuth();
    const [success, setSuccess] = useState(null);
    const [message, setMessage] = useState("");
    const [defaultImage, setDefaultImage] = useState(false);
    const [fillerHeight, setFillerHeight] = useState(0);
    const [isClassImgOpen, setClassImgOpen] = useState(false);

    const [checkedInUsers, setCheckedInUsers] = useState({});

    const [userRating, setUserRating] = useState(null);

    const [ratings, setRatings] = useState([]);

    const { emit, on, off } = useWebSocket();

    //get all users currently checked in
    const getCheckedInUsers = async () => {
        try {
            const users = await getUsers(room.checked_in);
            const checkedInUsers = {};
            users.forEach(user => {
                checkedInUsers[user._id] = user;
            });
            setCheckedInUsers(checkedInUsers);
        } catch (error) {
            console.log(error);
            addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
        }
    }

    //legacy code
    // const getRating = async () => {
    //     if (!isAuthenticated) {
    //         return;
    //     }
    //     try {
    //         const rated = await userRated(room._id);
    //         console.log(rated);
    //         if (rated.data.success) {
    //             console.log(rated.data.data);
    //             setUserRating(rated.data.data);
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
    //     }
    // }

    const handleCheckInEvent = (data) => {
        if (data.classroomId === room._id) {
            reload();
            handleNewUserCheckIn();
        }
    };

    const handleCheckOutEvent = (data) => {
        if (data.classroomId === room._id) {
            reload();
        }
    };

    useEffect(() => {
        if(!room){
            return;
        }
        getRatings(room._id)
            .then((response) => {
                console.log(response.data.data);
                setRatings(response.data.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }, [room]);


    let fetched = false;
    useEffect(() => {
        if (!room) {
            return;
        }
        if (fetched) {
            return;
        }
        getCheckedInUsers();
        // getRating();
        fetched = true;
        // Join the room for this classroom
        emit('join-classroom', room._id);

        // Listen for check-in events
        on('check-in', handleCheckInEvent);
        on('check-out', handleCheckOutEvent);

        // Clean up on component unmount
        return () => {
            off('check-in', handleCheckInEvent);
            off('check-out', handleCheckOutEvent);
        };
    }, [room]);
    
    useEffect(() => {
        if(!user){
            return;
        }
        if (ratings.find(rating => rating.user_id === user._id)!== undefined) {
            setUserRating(ratings.find(rating => rating.user_id === user._id));
            console.log("user has rated this room");
        }    
    }, [ratings, user]);

    useEffect(() => {
        console.log(userRating === null);

    }, [userRating]);

    useEffect(() => {

    }, [isAuthenticating]);

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
            setFillerHeight(checkInRef.current.clientHeight + 100);
            console.log(checkInRef.current.clientHeight);
        }
    }, [checkInRef.current]);

    useEffect(() => {
        setImage("");
    }, [room])

    useEffect(() => {
        if (isAuthenticated) {
            if(!user){
                return;
            }
            if (room && room.checked_in && room.checked_in.includes(user._id)) {
                if (success === false) {
                    handleCheckOut();
                }
            }
        }
    }, [success, room]);

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
    const [isAllRatingsOpen, setIsAllRatingsOpen] = useState(false);

    const handleOpenRatingPopup = () => setIsRatingPopupOpen(true);
    const handleCloseRatingPopup = () => setIsRatingPopupOpen(false);
    const handleOpenAllRatings = () => setIsAllRatingsOpen(true);
    const handleCloseAllRatings = () => setIsAllRatingsOpen(false);

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
            getCheckedIn();
        } catch (error) {
            console.log(error);
            if (error.response.status === 400) {
                addNotification({ title: "You are already checked in to another classroom", message: "Check out and try again", type: "error" })
            } else {
                addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
            }
        }
    }

    const handleCheckOut = async () => {
        try {
            const response = await checkOut(room._id);
            if (!userRating) {
                handleOpenRatingPopup();
                console.log("user has not rated this room yet");
            }
            console.log(userRated, "user has rated this room");
            console.log(response);
            await reload();


        } catch (error) {
            console.log(error);
            addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
        }
    }

    const handleNewUserCheckIn = async () => {
        try {
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
        } catch (error) {
            console.log(error);
            addNotification({ title: "An error occured", message: "an internal error occured", type: "error" })
        }
    }

    return (
        <div className={`classroom-component  ${user && room.checked_in.includes(user._id) ? "checked-in" : ""}`}>
            <Popup isOpen={isAllRatingsOpen} onClose={handleCloseAllRatings}>
                {isAllRatingsOpen && <AllRatings average_rating={room.average_rating.toFixed(1)} givenRatings={ratings}/>}
            </Popup>
            <Popup isOpen={isRatingPopupOpen} onClose={handleCloseRatingPopup}>
                <RatingComponent classroomId={room._id} rating={rating} setRating={setRating} name={room.name} reload={reload} />
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
                        (room.image !== "https://studycompass.s3.amazonaws.com/downsizedPlaceholder.jpeg") &&
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
                            <p>{room.average_rating.toFixed(1)}</p>
                        </div>
                        <div className="rating-num" onClick={handleOpenAllRatings}>
                            {room.number_of_ratings === 1 ? <p>{room.number_of_ratings} rating</p> : <p>{room.number_of_ratings} ratings</p>}
                        </div>
                        {isAuthenticated && userRating === null &&
                            <button className="add-rating" onClick={handleOpenRatingPopup}>
                                <p>add your rating</p>
                            </button>
                        }
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
                    {userRating && <UserRating rating={userRating} />}
                    {
                        defaultImage && (!isAuthenticating) && isAuthenticated && user.admin ? <FileUpload classroomName={room.name} /> : ""
                    }
                    <div>
                        <Flag functions={setIsUp} primary={"rgba(176, 175, 175, .13)"} img={circleWarning} accent={"#D9D9D9"} color={"#737373"} text={"As Study Compass is still in beta, certain information may be incorrect. Reporting incorrect information is an important part of our troubleshooting process, so please help us out!"} />
                    </div>
                    {/* <button onClick={handleOpenAllRatings}>
                        see all ratings
                    </button> */}
                    <div className="ratings-preview">
                        <div className="ratings-header">
                            <h2>Review Summary</h2>
                            <button onClick={handleOpenAllRatings}>see all reviews</button>
                        </div>
                        <RatingGraph ratings={ratings} average_rating={room.average_rating.toFixed(1)}/>
                        {
                            ratings.length > 0 ?
                            <UserRating rating={ratings[0]} providedUser={ratings[0].user_info} />
                            : ""
                        }
                        {isAuthenticated && userRating === null &&
                            <button onClick={handleOpenRatingPopup}>
                                add your review
                            </button>
                        }
                    </div>
                    <div className="filler" style={{ height: `${fillerHeight}px` }}>

                    </div>
                </div>
                {user && user.admin ? room ? edit ? <EditAttributes room={room} attributes={room.attributes} setEdit={setEdit} /> : "" : "" : ""}
                <div className="check-in" ref={checkInRef}>
                    <div className={`${success ? 'free-until' : 'class-until'}`}>
                        <div className="dot">
                            <div className="outer-dot"></div>
                            <div className="inner-dot"></div>
                        </div>
                        {success ? "free" : "class in session"} {message}
                    </div>
                    {room && room.checked_in && room.checked_in.length > 0 &&
                        <CheckedIn users={Object.values(checkedInUsers)} />
                    }
                    <div className="button-container">
                        {width < 800 && <button className="schedule-button" onClick={() => { setShowMobileCalendar(true) }}>view-schedule</button>}
                        {
                            user && room.checked_in.includes(user._id) ?
                                <button className="out" onClick={handleCheckOut}>check out</button>
                                :
                                <button disabled={!success || !isAuthenticated} className="check-in-button" onClick={handleCheckIn}>check in</button>
                        }
                    </div>
                </div>
            </div >
        </div >
    );
}

export default Classroom;
