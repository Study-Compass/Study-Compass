import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import './Room.css';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar/SearchBar';
import useAuth from '../hooks/useAuth';
import { useCache } from '../CacheContext';
import Classroom from '../components/Classroom/Classroom';
import MobileCalendar from '../components/MobileCalendar/MobileCalendar.jsx';
import Loader from '../components/Loader/Loader.jsx'
import { findNext } from "./RoomHelpers.js";

import chevronUp from '../assets/chevronup.svg';

import dummyData from '../dummyData.js'


import { debounce} from '../Query.js';

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
    const { getRooms, getFreeRooms, getRoom, getBatch } = useCache();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calendarLoading, setCalendarLoading] = useState(true);

    const [contentState, setContentState] = useState("empty")

    const [results, setResults] = useState([]);
    const [numLoaded, setNumLoaded] = useState(0);
    const [loadedResults, setLoadedResults] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(true);
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

    const resultRef = useRef(null);

    useEffect(() => {
        const container = resultRef.current;
        const handleScroll = () => {
          // Calculate if the scroll has reached the bottom of the container
          const scrollPosition = container.scrollTop + container.offsetHeight;
          const containerHeight = container.scrollHeight;
    
          // Check if the scroll has reached the bottom
          if (scrollPosition >= containerHeight) {
            console.log('Reached the bottom of the container');
          }
        };
    
        // Add the scroll event listener to the container
        if (container) {
          container.addEventListener('scroll', handleScroll);
        }
    
        // Clean up the event listener on component unmount
        // return () => {
        //   if (container) {
        //     container.removeEventListener('scroll', handleScroll);
        //   }
        // };
      }, []);


    useEffect(() => {
        const fetchRooms = async () => {
            const rooms = await getRooms();
            setRooms(Object.keys(rooms).sort());
            setRoomIds(rooms);
        };

        fetchRooms();
    }, []);

    const fetchData = async (id) => {
        setLoading(true);
        setData(null);
        const data = await getRoom(id);
        setLoading(false);
        setRoom(data.room);
        setData(data.data);
    };

    const fetchSchedule = async (id) =>{
        const data = await getRoom(id);
        return data;
    }

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
        const roomNames = await getFreeRooms(query);
        setResults(roomNames.sort());
        setNumLoaded(10);
        setCalendarLoading(false);
    };

    const fetchFreeNow = async () => {
        setContentState("calendarSearch")
        setCalendarLoading(true)
        let nowQuery = {
            'M': [],
            'T': [],
            'W': [],
            'R': [],
            'F': [],
        };
        const days = ["M", "T", "W", "R", "F"];
        const today = new Date();
        const day = today.getDay();
        const hour = today.getHours();
        if(day === 0 || day === 6){
            nowQuery['M'] = [{start_time: 0, end_time: 30}];
        } else {
            nowQuery[days[day-1]] = [{start_time: hour*60, end_time: (hour*60)+30}];
        }
        console.log(nowQuery);
        const roomNames = await getFreeRooms(nowQuery);
        setResults(roomNames.sort());
        console.log(results);
        setNumLoaded(10);
        // setLoadedResults(roomNames.sort().slice(0,10));
        setCalendarLoading(false);
    }

    useEffect(()=>{
        const updateLoadedResults = async ()=>{
            if(numLoaded === 0){
                setLoadedResults([]);
            }
            setResultsLoading(true);
            let batchResults = await getBatch(results.slice(loadedResults.length, Math.min(numLoaded, results.length)).map(room => roomIds[room]));
            // outdated query logic, too many requests, would overwhelm backend
            // for(let i=loadedResults.length;i<Math.min(numLoaded, results.length);i++){
            //     const roomData = await fetchSchedule(roomIds[results[i]]);
            //     newResults.push(roomData);
            //     console.log(roomData);
            // } 
            let newResults = [...loadedResults, ...batchResults];
            setLoadedResults(newResults);
            setResultsLoading(false);
        };
        updateLoadedResults();
        
    },[numLoaded]);

    // useEffect(()=>{console.log("loaded results change detected", loadedResults)},[loadedResults]);

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
        setLoadedResults([]);
        setNumLoaded(0);
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
        // console.log("contentstate",contentState);
        if(contentState === "empty"){
            setNumLoaded(0);
            setLoadedResults([]);
        }
    },[contentState]);

    useEffect(()=>{console.log(results)},[results]);
    
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
        setLoadedResults([]);
    }
    
    const [showMobileCalendar, setShowMobileCalendar] = useState(false);

    const [viewport, setViewport] = useState("100vh");
    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
    },[]);

    return (
        <div className="room" style={{ height: width < 800 ? viewport : '100vh' }}>
            <Header />
            <div className="content-container">
                <div className="calendar-container">
                    <div className={width < 800 ? "left-mobile" : "left"}>
                        <SearchBar data={rooms} onEnter={changeURL2} room={roomid} onX={onX} />
                        {contentState === "nameSearch" || contentState === "calendarSearchResult" ? <Classroom 
                            name={roomid} 
                            room={room} 
                            state={contentState} 
                            setState={setContentState}
                        /> : ""}
                        {contentState === "calendarSearch" ? calendarLoading ? "" : <h1 className="resultCount">{results.length} results</h1> : ""}
                        {contentState === "calendarSearch" ? 
                            <ul className="time-results" ref={resultRef}>
                                {loadedResults.map((result, index) => (
                                    <li 
                                        key={result.room.name} 
                                        value={result.room.name} 
                                        onMouseOver={() => {debouncedFetchData(result.room._id)}} 
                                        onMouseLeave={()=>{debouncedFetchData("none")}}
                                        onClick={() => {changeURL(result.room.name)}}
                                    >
                                        <h2>{result.room.name.toLowerCase()}</h2>
                                        <p className="free-until">free {width >= 800 ? findNext(result.data.weekly_schedule) : ''}</p>
                                    </li>
                                ))}
                                {width >= 800 && resultsLoading ? <div className="loader-container"><Loader/></div> : null}
                                {width >= 800 && !resultsLoading ? <li onClick={()=>{setNumLoaded(numLoaded + 10)}}>get more</li> : null}
                            </ul> : ""
                        }
                        {contentState === "empty" ? <div className={`instructions-container ${width < 800 ? "mobile-instructions" : ""}`}>
                            <div className="instructions">
                                <p>search by name or {width < 800 ? "see which rooms are" : "by selecting a timeslot"}</p>
                                <button onClick={fetchFreeNow} className="free-now">free now</button>
                            </div>
                        </div> : ""}
                    </div>
                    {width < 800 ? (
                        <div className={`calendar-content-container ${showMobileCalendar ? "active" : ""}`}>
                            <MobileCalendar className={roomid} data={data} isloading={loading} addQuery={addQuery} removeQuery={removeQuery} query={query} show={showMobileCalendar} setShow={setShowMobileCalendar} />
                        </div>
                    ) : (
                        <div className="right">
                            <Calendar className={roomid} data={data} isloading={loading} addQuery={addQuery} removeQuery={removeQuery} query={query} />
                        </div>
                    )}
                    {width < 800 ? contentState === "calendarSearchResult" || contentState === "nameSearch" ? <button className="show-calendar" onClick={() => { setShowMobileCalendar(true) }}> <img src={chevronUp} alt="show schedule" /> </button> : "" : ""}
                </div>
            </div>
        </div>
    );
}

export default Room