```
documentation:
https://incongruous-reply-44a.notion.site/Frontend-Room-Page-667531d41a284511bb64681e09ee702a
```

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../../components/CalendarComponents/Calendar/Calendar.jsx';
import './Room.css';
import Header from '../../components/Header/Header.jsx';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import useAuth from '../../hooks/useAuth.js';
import { useCache } from '../../CacheContext.js';
import { useError } from '../../ErrorContext.js'; 
import Classroom from '../../components/Classroom/Classroom.jsx';
import MobileCalendar from '../../components/CalendarComponents/MobileCalendar/MobileCalendar.jsx';
import { findNext, fetchDataHelper, fetchFreeRoomsHelper, fetchFreeNowHelper, fetchSearchHelper, addQueryHelper, removeQueryHelper } from "./RoomHelpers.js";
import Results from '../../components/Results/Results.jsx';

import chevronUp from '../../assets/chevronup.svg';
import Sort from '../../assets/Icons/Sort.svg';

import { debounce} from '../../Query.js';

/*
STATES
contentState: "empty", "classroom", "calendarSearch" , "calendarSearchResult", "nameSearch"
*/ 

function Room() {
    let { roomid } = useParams();
    let navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [rooms, setRooms] = useState(null);
    const [roomIds, setRoomIds] = useState({});
    const { isAuthenticated } = useAuth();
    const { getRooms, getFreeRooms, getRoom, getBatch, search } = useCache();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [calendarLoading, setCalendarLoading] = useState(true);

    const [contentState, setContentState] = useState("empty")

    const [results, setResults] = useState([]);
    const [numLoaded, setNumLoaded] = useState(0);
    const [loadedResults, setLoadedResults] = useState([]);
    const [query, setQuery] = useState({'M': [],'T': [],'W': [],'R': [],'F': [],});
    const [noquery, setNoQuery] = useState(true);

    const [searchQuery, setSearchQuery] = useState(""); // for search bar

    function clearQuery(){ setQuery({'M': [],'T': [],'W': [],'R': [],'F': [],});
        setNoQuery(true);
    }

    const { setError } = useError();

    const [width, setWidth] = useState(window.innerWidth);

    const fetchData = async (id) => fetchDataHelper(id, setLoading, setData, setRoom, navigate, getRoom);
    const fetchFreeRooms = async () => fetchFreeRoomsHelper(setContentState, setCalendarLoading, getFreeRooms, setResults, setNumLoaded, query);
    const debouncedFetchData = debounce(fetchData, 500); // Adjust delay as needed
    const fetchFreeNow = async () => fetchFreeNowHelper(setContentState, setCalendarLoading, setResults, setNumLoaded, getFreeRooms);
    const fetchSearch = async (query, attributes, sort) => fetchSearchHelper(query, attributes, sort, setContentState, setCalendarLoading, setResults, setLoadedResults, search, setNumLoaded, navigate, setError, setSearchQuery);
    const addQuery = (key, newValue) => addQueryHelper(key, newValue, setNoQuery, setContentState, setQuery);
    const removeQuery = (key, value) => removeQueryHelper(key, value, setQuery, setNoQuery);


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
            try{
                const rooms = await getRooms();
                setRooms(Object.keys(rooms).sort());
                setRoomIds(rooms);
            } catch (error){
                console.log(error);
                navigate("/error/500");
            }
        };

        fetchRooms();
    }, []);

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
            setContentState("classroom");
            clearQuery();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomid, isAuthenticated, roomIds]);


    useEffect(()=>{
        const updateLoadedResults = async ()=>{
            if(numLoaded === 0){
                setLoadedResults([]);
            }
            // setResultsLoading(true);
            let batchResults = await getBatch(results.slice(loadedResults.length, Math.min(numLoaded, results.length)).map(room => roomIds[room]));
            let newResults = [...loadedResults, ...batchResults];
            setLoadedResults(newResults);
        };
        updateLoadedResults();
    },[numLoaded]);

    useEffect(() => { 
        setLoadedResults([]);
        setNumLoaded(0);
        // if query is changed and noquery is true, set contentstate to empty unless query cleaered using classroom
        if ((noquery === true && contentState === "calendarSearchResult") || roomid === "none") {
            setContentState("empty");
        } else if(contentState !== "classroom"){
            setContentState("calendarSearch");  
        }
        setResults([]);
        if (!noquery) {
            fetchFreeRooms();
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query])

    useEffect(()=>{
        if(contentState === "empty"){
            setNumLoaded(0);
            setLoadedResults([]);
        }
    },[contentState]);

    // useEffect(()=>{console.log(results)},[results]);
    
    function changeURL(option) {
        navigate(`/room/${option}`, { replace: true });
        setContentState("calendarSearchResult");
    }

    function changeURL2(option) {
        navigate(`/room/${option}`, { replace: true });
        setContentState("classroom");
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
                        <SearchBar data={rooms} onEnter={changeURL2} room={roomid} onX={onX} onSearch={fetchSearch} />
                        {contentState === "classroom" || contentState === "calendarSearchResult" || contentState === "freeNowSearch" ? <Classroom 
                            name={roomid} 
                            room={room} 
                            state={contentState} 
                            setState={setContentState}
                            schedule={data}
                        /> : ""}
                        {contentState === "calendarSearch" || contentState === "freeNowSearch" || contentState === "nameSearch" ? calendarLoading ? "" : 
                            <div className="resultsCountContainer">
                                <h1 className="resultCount">{results.length} results {contentState === "nameSearch" ? searchQuery ? `for "${searchQuery.slice(0,9)}${searchQuery.length>9 ? "..." : ""}"` : "" : ""}</h1> 
                                <img src={Sort} alt="sort" />
                            </div>
                            
                        : ""}
                        {contentState === "calendarSearch" || contentState === "freeNowSearch" || contentState === "nameSearch" ? 
                            <Results 
                                results={results}
                                loadedResults={loadedResults}
                                numLoaded={numLoaded}
                                setNumLoaded={setNumLoaded}
                                debouncedFetchData={debouncedFetchData}
                                contentState={contentState}
                                changeURL={changeURL}
                                findNext={findNext}
                            />: ""
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
                    {width < 800 ? contentState === "calendarSearchResult" || contentState === "classroom" ? <button className="show-calendar" onClick={() => { setShowMobileCalendar(true) }}> <img src={chevronUp} alt="show schedule" /> </button> : "" : ""}
                </div>
            </div>
        </div>
    );
}

export default Room