import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import './Room.css';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar/SearchBar';
import useAuth from '../hooks/useAuth';
import Classroom from '../components/Classroom/Classroom';
import MobileCalendar from '../components/MobileCalendar/MobileCalendar.jsx';

import chevronUp from '../assets/chevronup.svg';

import dummyData from '../dummyData.js'


import {getRooms, getRoom, getFreeRooms, debounce} from '../Query.js';

const offline = false;

/*
STATES
contentState: "empty", "nameSearch", "calendarSearch" , "calendarSearchResult"
*/ 

function Room() {
    let { roomid } = useParams();
    let navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [rooms, setRooms] = useState(null);
    const [roomIds, setRoomIds] = useState({});
    const { isAuthenticated } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calendarLoading, setCalendarLoading] = useState(true);

    const [contentState, setContentState] = useState("empty")

    const [results, setResults] = useState([]);
    const [query, setQuery] = useState({
        'M': [],
        'T': [],
        'W': [],
        'R': [],
        'F': [],
    });
    const [noquery, setNoQuery] = useState(true);

    function clearQuery(){
        setQuery({
            'M': [],
            'T': [],
            'W': [],
            'R': [],
            'F': [],
        });
        setNoQuery(true);
    }

    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
      // Handler to call on window resize
      function handleResize() {
        // Set window width to state
        setWidth(window.innerWidth);
      }
  
      // Add event listener
      window.addEventListener('resize', handleResize);
  
      // Remove event listener on cleanup
      return () => window.removeEventListener('resize', handleResize);
    }, []);


    useEffect(() => {
        const fetchRooms = async () => {
            // -- DANGER ZONE - CODE SHOULD NOT TOUCH DEPLOYMENT BRANCH
            if(offline){
                console.log("Continuing with OFFLINE development");
                setRooms(dummyData['rooms']);
                return;
            }
            // --------------------------------------------------
            const rooms = await getRooms();
            setRooms(Object.keys(rooms).sort());
            setRoomIds(rooms);
        };

        fetchRooms();
    }, []);

    const fetchData = async (id) => {
        if(offline){
            // -- DANGER ZONE - CODE SHOULD NOT TOUCH DEPLOYMENT BRANCH
            setLoading(false);
            if(id === "none"){
                setData(dummyData['none']);
                return;
            }
            console.log("Continuing with OFFLINE development");
            setData(dummyData['room'])
            return;
            // --------------------------------------------------------
        }
        setLoading(true);
        setData(null);
        const data = await getRoom(id);
        setLoading(false);
        setRoom(data.room);
        setData(data.data);
    };

    const debouncedFetchData = debounce(fetchData, 500); // Adjust delay as needed

    useEffect(() => { // FETCH ROOM DATA , triggers on url change
        if(roomIds[roomid] === undefined && roomid !== "none"){
            return;
        }
        if(roomid === "none"){
            setContentState("empty");
            fetchData("none");
            return;
        }
        if(contentState === "calendarSearchResult"){
            console.log("fetching data debounced");
            setTimeout(() => {             
                debouncedFetchData(roomIds[roomid]);
                console.log("results", results);
            }, 100);
        } else {
            fetchData(roomIds[roomid]);
            setContentState("nameSearch");
            clearQuery();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomid, isAuthenticated, roomIds]);

    const fetchFreeRooms = async () => {
        setContentState("calendarSearch")
        setCalendarLoading(true)
        if(offline){
            // -- DANGER ZONE - CODE SHOULD NOT TOUCH DEPLOYMENT BRANCH
            console.log("Continuing with OFFLINE development");
            setResults(dummyData['freerooms']);
            return;
            // -------------------------------------------------------
        }
        const roomNames = await getFreeRooms(query);
        setResults(roomNames);
        setCalendarLoading(false);
    };

    const addQuery = (key, newValue) => {
        setNoQuery(false);
        setContentState("calendarSearch");
        setQuery(prev => {
            // Create a list that includes all existing timeslots plus the new one.
            const allSlots = [...prev[key], newValue];

            // Sort timeslots by start time.
            allSlots.sort((a, b) => a.start_time - b.start_time);

            // Merge overlapping or consecutive timeslots.
            const mergedSlots = allSlots.reduce((acc, slot) => {
                if (acc.length === 0) {
                    acc.push(slot);
                } else {
                    let lastSlot = acc[acc.length - 1];
                    if (lastSlot.end_time >= slot.start_time) {
                        // If the current slot overlaps or is consecutive with the last slot in acc, merge them.
                        lastSlot.end_time = Math.max(lastSlot.end_time, slot.end_time);
                    } else {
                        // If not overlapping or consecutive, just add the slot to acc.
                        acc.push(slot);
                    }
                }
                return acc;
            }, []);

            // Return updated state.
            return { ...prev, [key]: mergedSlots };
        });
    };

    const removeQuery = (key, value) => {
        // setNoQuery(true); //failsafe, useEffect checks before query anyways
        setQuery(prev => {
            const existing = prev[key];
            if (existing === undefined) {
                // If the key does not exist, return the previous state unchanged.
                return prev;
            } else {
                // Filter the array to remove the specified value.
                const filtered = existing.filter(v => v !== value);
                // Always return the object with the key, even if the array is empty.
                const newQuery = { ...prev, [key]: filtered };
                const isQueryEmpty = Object.values(newQuery).every(arr => arr.length === 0);
                setNoQuery(isQueryEmpty);
                return  newQuery;
            }
        });
        
        // Check if all keys in the query object have empty arrays and update `noQuery` accordingly.
    }

    useEffect(() => { 
        // if query is changed and noquery is true, set contentstate to empty unless query cleaered using namesearch
        if ((noquery === true && contentState === "calendarSearchResult") || roomid === "none") {
            setContentState("empty");
        } else if(contentState !== "nameSearch"){
            setContentState("calendarSearch");  
        }
        // console.log(`noquery: ${noquery}`);
        setResults([]);
        // console.log("query: ", query);
        if (!noquery) {
            fetchFreeRooms();
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query])

    useEffect(()=>{
        console.log("contentstate",contentState);
        // console.log(loading);
    },[contentState]);

    
    function changeURL(option) {
        navigate(`/room/${option}`, { replace: true });
        setContentState("calendarSearchResult");
    }

    function changeURL2(option) {
        navigate(`/room/${option}`, { replace: true });
        setContentState("nameSearch");
    }

    function onX(){ //make a reset function soon
        setContentState('empty');
        setResults([]);
        clearQuery();
        // setData(dummyData["none"]);
    }
    
    const [showMobileCalendar, setShowMobileCalendar] = useState(false);

    const [viewport, setViewport] = useState("100vh");
    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
        console.log('adjusting')
    },[]);

    if (width < 800) {
        return( // ----------------------------------------------MOBILE--------------------------------------------------------------------------------
            <div className="room" style={{height:viewport}}>
            <Header />
            <div className="content-container">
                <div className="calendar-container">
                        <SearchBar data={rooms} onEnter={changeURL2} room={roomid} onX={onX} />
                        <Classroom name={roomid} room={room} state={contentState} setState={setContentState}/>
                        {contentState === "calendarSearch" ? calendarLoading ? "" : <h1 className="resultCount">{results.length} results</h1> : ""}
                        {contentState === "calendarSearch" ? 
                            <ul className="time-results">
                                {
                                    results.map((result, index) => {
                                        return <li 
                                            key={index} 
                                            value={result} 
                                            onMouseOver={() => {debouncedFetchData(roomIds[result])}} 
                                            onMouseLeave={()=>{debouncedFetchData("none")}}
                                            onClick={() => {changeURL(result)}}
                                        >{result.toLowerCase()}</li>
                                    })
                                }
                            </ul> : ""
                        }
                        {contentState === "empty" ? <div className="instructions-container">
                            <div className="instructions">
                                <p>search by name</p>
                            </div>
                        </div> :""}
                        <div className="calendar-content-container">
                            <MobileCalendar className={roomid} data={data} isloading={loading} addQuery={addQuery} removeQuery={removeQuery} query={query} show={showMobileCalendar} setShow={setShowMobileCalendar} />
                        </div>
                        {/* <SwipeablePopup /> */}
                    <button className="show-calendar" onClick={()=>{setShowMobileCalendar(true)}}> <img src={chevronUp} alt="show schedule" /> </button>
                </div>
            </div>
        </div>
        );
    }

    return ( // ----------------------------------------------DESKTOP--------------------------------------------------------------------------------
        <div className="room">
            <Header />
            <div className="content-container">
                <div className="calendar-container">
                    <div className="left">
                        <SearchBar data={rooms} onEnter={changeURL2} room={roomid} onX={onX} />
                        {contentState === "nameSearch" || contentState === "calendarSearchResult"? <Classroom 
                            name={roomid} 
                            room={room} 
                            state={contentState} 
                            setState={setContentState}
                        /> : ""}
                        {contentState === "calendarSearch" ? calendarLoading ? "" : <h1 className="resultCount">{results.length} results</h1> : ""}
                        {contentState === "calendarSearch" ? 
                            <ul className="time-results">
                                {
                                    results.map((result, index) => {
                                        return <li 
                                            key={index} 
                                            value={result} 
                                            onMouseOver={() => {debouncedFetchData(roomIds[result])}} 
                                            onMouseLeave={()=>{debouncedFetchData("none")}}
                                            onClick={() => {changeURL(result)}}
                                        >{result.toLowerCase()}</li>
                                    })
                                }
                            </ul> : ""
                        }
                        {contentState === "empty" ? <div className="instructions-container">
                            <div className="instructions">
                                <p>search by name or by selecting a timeslot</p>
                            </div>
                        </div> :""}
                    </div>
                    <div className="right">
                        <Calendar className={roomid} data={data} isloading={loading} addQuery={addQuery} removeQuery={removeQuery} query={query} />
                    </div>
                </div>
            </div>
            {/* <button onClick={logout}>logout</button> */}
        </div>
    );
}

export default Room