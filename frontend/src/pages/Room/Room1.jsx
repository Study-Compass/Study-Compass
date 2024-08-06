import React, { useEffect, useState, useCallback } from 'react';
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
import { findNext, fetchDataHelper, fetchFreeRoomsHelper, fetchFreeNowHelper, fetchSearchHelper, addQueryHelper, removeQueryHelper , allPurposeFetchHelper} from "./RoomHelpers.js";
import Results from '../../components/Results/Results.jsx';
import Sort from '../../components/Sort/Sort.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import Recommended from '../../components/Recommended/Recommended.jsx';
import Banner from '../../components/Banner/Banner.jsx';

import chevronUp from '../../assets/chevronup.svg';
import SortIcon from '../../assets/Icons/Sort.svg';
import Github from '../../assets/Icons/Github.svg';

import { debounce} from '../../Query.js';
import ProfilePicture from '../../components/ProfilePicture/ProfilePicture.jsx';

/** 
documentation:
https://incongruous-reply-44a.notion.site/Frontend-Room-Page-667531d41a284511bb64681e09ee702a
*/

/*
STATES
contentState: "empty", "classroom", "calendarSearch" , "calendarSearchResult", "nameSearch" , "freeNowSearch" 
*/ 

function Room() {
    let { roomid } = useParams();
    let navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [roomName, setRoomName] = useState(null);
    const [rooms, setRooms] = useState(null);
    const [roomIds, setRoomIds] = useState({});
    const [ready, setReady] = useState(false);
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    const { getRooms, getFreeRooms, getRoom, getBatch, search, allSearch } = useCache();
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
    const [searchAttributes, setSearchAttributes] = useState([]);
    const [searchSort, setSearchSort] = useState("name"); 

    const [searchFocus, setSearchFocus] = useState(false);
    const [showFilter, setShowFilter] = useState(false); 

    const [bannerVisible, setBannerVisible] = useState(false);

    function clearQuery(){ setQuery({'M': [],'T': [],'W': [],'R': [],'F': [],});
        setNoQuery(true);
    }

    const { newError } = useError();

    const [width, setWidth] = useState(window.innerWidth);

    const fetchData = async (id) => fetchDataHelper(id, setLoading, setData, setRoom, navigate, getRoom, setRoomName, newError);
    const fetchFreeRooms = async () => fetchFreeRoomsHelper(setContentState, setCalendarLoading, getFreeRooms, setResults, setNumLoaded, query, newError);
    const debouncedFetchData = debounce(fetchData, 500); // Adjust delay as needed
    const fetchFreeNow = () => fetchFreeNowHelper(setContentState, setCalendarLoading, setResults, setNumLoaded, getFreeRooms);
    const fetchSearch = async (query, attributes, sort) => fetchSearchHelper(query, attributes, sort, setContentState, setCalendarLoading, setResults, setLoadedResults, search, setNumLoaded, navigate, newError, setSearchQuery);
    const addQuery = (key, newValue) => addQueryHelper(key, newValue, setNoQuery, setContentState, setQuery);
    const removeQuery = (key, value) => removeQueryHelper(key, value, setQuery, setNoQuery);
    const allPurposeSearch = async () => allPurposeFetchHelper(allSearch, searchQuery, query, searchAttributes, searchSort, setCalendarLoading, setResults, setLoadedResults, setNumLoaded);
    const allPurposeFreeNow = async (query1) => allPurposeFetchHelper(allSearch, searchQuery, query1, searchAttributes, searchSort, setCalendarLoading, setResults, setLoadedResults, setNumLoaded);
    const debouncedAllPurposeSearch = useCallback(debounce(allPurposeSearch, 500), [searchQuery, searchAttributes, searchSort, query]);

//=========================================== UI LOGIC =====================================================================================================

    useEffect(() => { //useEffect for window resizing
      function handleResize() {
        setWidth(window.innerWidth);
      }
      window.addEventListener('resize', handleResize);
  
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(()=>{
        if(contentState === "calendarSearch" || contentState === "freeNowSearch"){
            return;
        }
        const searchParams = new URLSearchParams(window.location.search);
        const searchQuery = searchParams.get('query');
        if(searchQuery){
            setContentState("nameSearch");
            return;
        }
        if(roomid === "none"){
            setContentState("empty");
            setSearchQuery("");
            fetchData("none");
            return;
        }

    },[roomid]);

    function changeURL(option) {
        navigate(`/room/${option}`);
        fetchData(roomIds[option]);
        setContentState("calendarSearchResult");
    }

    function changeURL2(option) {
        navigate(`/room/${option}`);
        fetchData(roomIds[option]);
        setContentState("classroom");
    }

    function onX(){ //make a reset function soon
        setContentState('empty');
        fetchData('none');
        setResults([]);
        clearQuery();
        setLoadedResults([]);
    }

    useEffect(()=>{
        if(contentState === "empty"){
            setNumLoaded(0);
            setLoadedResults([]);
        }
        console.log(contentState);
    },[contentState]);

        
    const [showMobileCalendar, setShowMobileCalendar] = useState(false);

    const [viewport, setViewport] = useState("100vh");
    useEffect(() => {
        setViewport((window.innerHeight) + 'px');
        //add listener
    },[]);



//==========================================================================================================================================================



//=========================================== FETCHING LOGIC ===============================================================================================

    useEffect(() => { // FETCH ROOM DATA , triggers on url change
        if(isAuthenticating){
            return;
        }
        if(isAuthenticated){
            if(user.onboarded === false){
                navigate('/onboard');
            }
        }
        if(isAuthenticating){
            return;
        }
        const searchParams = new URLSearchParams(window.location.search);
        const searchQueryParams = searchParams.get('query');
        const attributes = searchParams.get('attributes') ? JSON.parse(searchParams.get('attributes')) : null;
        const sort = searchParams.get('sort');
        if(searchQueryParams){
            if(!ready){
                return;
            }
            console.log("hi there");
            console.log(searchQueryParams);
            setSearchAttributes(attributes);
            setSearchSort(sort); 
            setSearchQuery(searchQueryParams);   
            console.log("searching");
            setContentState("nameSearch");
            fetchData("none");

        } else {
            if(roomIds[roomid] === undefined && roomid !== "none"){
                return;
            }
            if(roomid === "none"){
                setContentState("empty");
                fetchData("none");
                return;
            }
            if(contentState === "calendarSearchResult"){
                fetchData(roomIds[roomid]);
            } else {
                fetchData(roomIds[roomid]);
                setContentState("classroom");
                clearQuery();
            }
        }
        console.log(roomid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, isAuthenticating, roomIds]);

    function onSearch(query, attributes, sort){
        const queryString = new URLSearchParams({ query, attributes: JSON.stringify(attributes), sort }).toString();
        navigate(`/room1/search?${queryString}`, { replace: true });        
        setSearchAttributes(attributes);
        setSearchSort(sort);
        setSearchQuery(query);
    }

    useEffect(() => {
        if(isAuthenticating){
            return;
        }
        // if(searchQuery === ""){
        //     return;
        // }
        console.log(noquery);
        if(noquery && searchQuery === "" && searchAttributes.length === 0 && contentState !== "classroom"){
            setContentState("empty");
            return;
        }
        console.log(searchQuery);
        console.log(searchAttributes);
        console.log(searchSort);
        console.log(query);
        allPurposeSearch();
    }, [searchQuery, searchAttributes, searchSort, query]);

    
    useEffect(() => { 
        // if query is changed and noquery is true, set contentstate to empty unless query cleaered using classroom
        // if ((noquery === true && contentState === "calendarSearchResult") || roomid === "none") {
        //     setContentState("empty");
        // } else if(contentState !== "classroom"){ 
        //     setContentState("calendarSearch");  
        // }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query])


//=========================================== DONT TOUCH HERE ===============================================================================================
    

    useEffect(() => { //useEffect fetch all room names
        const fetchRooms = async () => {
            try{
                const rooms = await getRooms();
                setRooms(Object.keys(rooms).sort());
                setRoomIds(rooms);
                setReady(true);
            } catch (error){
                console.log(error);
                const fetchError = {
                    message: "Failed to fetch rooms list, likely due to proxy error. Please try again later.",
                    status: 500,
                }
                newError(fetchError, navigate);
            }
        };
        fetchRooms();
    }, []);

    useEffect(()=>{ // don't touch logic here
        const updateLoadedResults = async ()=>{
            if(numLoaded === 0){
                setLoadedResults([]);
            }
            try{
                let batchResults = await getBatch(results.slice(loadedResults.length, Math.min(numLoaded, results.length)).map(room => roomIds[room]));
                let newResults = [...loadedResults, ...batchResults];
                setLoadedResults(newResults);
            } catch(error){
                console.log(error);
                newError(error, navigate);
            }
        };
        updateLoadedResults();
    },[numLoaded]);

    const handleFreeNow = async () => {
        const query = fetchFreeNow();
        allPurposeFreeNow(query);
    }

//==========================================================================================================================================================

    return (    
        <div className="room" style={{ height: width < 800 ? viewport : '100vh' }}>
            <Banner visible={bannerVisible} setVisible={setBannerVisible}/>
            <Header />
            <div className="content-container" style={{height: bannerVisible ? "max(100% - 135px)":  "max(100% - 115px)", maxHeight: bannerVisible ? "max(100% - 135px)":  "max(100% - 115px)"}}>
                <div className="calendar-container">
                    <div className={width < 800 ? "left-mobile" : "left"}>

                            {ready && contentState !== "classroom" && <Recommended 
                                id={roomIds["Low Center for Industrial Inn. 4034"]}
                                debouncedFetchData={debouncedFetchData}
                                changeURLHelper={changeURL2}
                                findNext={findNext}
                                contentState={contentState}
                                setContentState={setContentState}
                                hide={searchFocus || contentState !== "empty"}
                            />}

                        <SearchBar data={rooms} onEnter={changeURL2} room={contentState === "classroom" || contentState === "calendarSearchResult" ? roomName : searchQuery } onX={onX} onSearch={onSearch} query={searchQuery} onBlur={setSearchFocus} />
                        {contentState === "classroom" || contentState === "calendarSearchResult"  ? <Classroom  
                            room={room} 
                            state={contentState} 
                            setState={setContentState}
                            schedule={data}
                            roomName={roomid}
                            width={width}
                            setShowMobileCalendar={setShowMobileCalendar}
                        /> : ""}
                        {contentState === "calendarSearch" || contentState === "freeNowSearch" || contentState === "nameSearch" ? calendarLoading ? "" : 
                            <div className="resultsCountContainer">
                                <h1 className="resultCount">{results.length} results {contentState === "nameSearch" ? searchQuery ? `for "${searchQuery.slice(0,width < 800 ? 8:15)}${searchQuery.length>(width < 800 ? 8:15) ? "..." : ""}"` : "" : ""}</h1> 
                                {/* <img src={SortIcon} alt="sort" onClick={()=>{setShowFilter(!showFilter)}}/> */}
                            </div>
                        : ""}
                        { (contentState === "calendarSearch" || contentState === "freeNowSearch" || contentState === "nameSearch")? 
                            <Sort
                                query={searchQuery}
                                searchAttributes={searchAttributes}
                                setSearchAttributes={setSearchAttributes}
                                searchSort={searchSort}
                                setSearchSort={setSearchSort}
                                onSearch={onSearch}
                            /> 
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
                                calendarLoading={calendarLoading}
                            />: ""
                        }
                        { contentState === "empty" ? <div className="instruction">
                            <p>try searching for specific classroom like <span className="example">dcc 318</span> or a building like <span className="example">low</span></p>
                            
                        </div> : ""}

                    </div>
                    {width < 800 || viewport < 700? (
                        <div className={`calendar-content-container ${showMobileCalendar ? "active" : ""}`}>
                            <MobileCalendar className={"s"} data={data} isloading={loading} addQuery={addQuery} removeQuery={removeQuery} query={query} show={showMobileCalendar} setShow={setShowMobileCalendar} />
                        </div>
                    ) : (
                        <div className="right">
                            {contentState === "empty" && <div className="calendar-instruction">select a timeslot</div> }
                            <Calendar className={room ? room.name ? room.name : "none": ""} data={data} isloading={loading} addQuery={addQuery} removeQuery={removeQuery} query={query} />
                        </div>
                    )}
                    {/* {width < 800 || viewport < 700 ? contentState === "calendarSearchResult" || contentState === "classroom" ? <button className="show-calendar" onClick={() => { setShowMobileCalendar(true) }}> <img src={chevronUp} alt="show schedule" /> </button> : "" : ""} */}
                </div>
            </div>
            {
                width > 800 ? 
                    <Footer/>
                : ""
            }
        </div>
    );
}

export default Room;