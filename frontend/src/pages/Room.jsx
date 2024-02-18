import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import './Room.css';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar/SearchBar';
import useAuth from '../hooks/useAuth';
import Classroom from '../components/Classroom/Classroom';

import dummyData from '../dummyData.js'

import axios from 'axios';

const offline = true;

function Room() {
    let { roomid } = useParams();
    let navigate = useNavigate();
    const [rooms, setRooms] = useState(null);
    const { isAuthenticated, logout } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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

    console.log("roomid: ", roomid);
    useEffect(() => {
        if (isAuthenticated === null) {
            console.log("isAuthenticated null");
            return;
        }
        if (!isAuthenticated) {
            console.log("not authenticated");
            // navigate('/');
        }
        console.log("isAuthenticated: ", isAuthenticated);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    useEffect(() => {
        const fetchRooms = async () => {
            // -- DANGER ZONE - CODE SHOULD NOT TOUCH DEPLOYMENT BRANCH
            if(offline){
                console.log("Continuing with OFFLINE development");
                setRooms(dummyData['rooms']);
                return;
            }
            // --------------------------------------------------
            try {
                const response = await fetch(`/getrooms`);
                const responseBody = await response.text(); // First, always read the response as text

                if (!response.ok) {
                    // Log the error if the response status is not OK
                    console.error("Error fetching data:", responseBody);
                    return;
                }

                let rooms;
                try {
                    rooms = JSON.parse(responseBody); // Then, parse the text as JSON
                } catch (jsonError) {
                    // Log the JSON parsing error along with the raw response
                    console.error("JSON parsing error:", jsonError);
                    console.log("Raw response:", responseBody);
                    return;
                }

                setRooms(rooms);
                console.log(rooms);
            } catch (error) {
                console.error("Error:", error);

            }
        };

        fetchRooms();
    }, []);

    const fetchData = async (id) => {
        setLoading(true);
        setData(null);
        try {
            const response = await fetch(`/getroom/${id}`);
            const data = await response.json();
            setData(data);
            console.log(data);
        } catch (error) {
            console.error("Error fetching data: ", error);
            // -- DANGER ZONE - CODE SHOULD NOT TOUCH DEPLOYMENT BRANCH
            console.log("Continuing with OFFLINE development");
            setData(dummyData['room'])
            // --------------------------------------------------------
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(roomid);
    }, [roomid, isAuthenticated]);

    const fetchFreeRooms = async () => {
        setContentState("calendarSearch")
        try {
            setLoading(true)
            const response = await axios.post('/free', { query });
            const roomNames = response.data;
            setResults(roomNames);
            console.log(`names:${roomNames}`); // Process the response as needed
            console.log(roomNames); // Process the response as needed
        } catch (error) {
            console.error('Error fetching free rooms:', error);
            // -- DANGER ZONE - CODE SHOULD NOT TOUCH DEPLOYMENT BRANCH
            console.log("Continuing with OFFLINE development");
            setResults(dummyData['freerooms']);
            // -------------------------------------------------------
            // Handle error
        } finally {
            setLoading(false);
        }
    };

    const addQuery = (key, newValue) => {
        setNoQuery(false);
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
        setNoQuery(true); //failsafe, useEffect checks before query anyways
        setQuery(prev => {
            const existing = prev[key];
            if (existing === undefined) {
                // If the key does not exist, return the previous state unchanged.
                return prev;
            } else {
                // Filter the array to remove the specified value.
                const filtered = existing.filter(v => v !== value);
                // Always return the object with the key, even if the array is empty.
                return { ...prev, [key]: filtered };
            }
        });
        // Check if all keys in the query object have empty arrays and update `noQuery` accordingly.
    }

    useEffect(() => {
        Object.keys(query).every(key => query[key].length === 0) ? setNoQuery(true) : setNoQuery(false);
        if (noquery === true) {
            setContentState("empty");
        }
        console.log(`noquery: ${noquery}`);
        setResults([]);
        console.log("query: ", query);
        if (!noquery) {
            fetchFreeRooms();
        }
    }, [query])


    function changeURL2(option) {
        navigate(`/room/${option}`, { replace: true });
    }

    return (
        <div className="room">
            <Header />
            <div className="content-container">
                <div className="calendar-container">
                    <div className="left">
                        <SearchBar data={rooms} onEnter={changeURL2} room={roomid} />
                        <Classroom name={roomid} roomid={roomid} />
                        {contentState === "calendarSearch" ? loading ? "" : <h1>{results.length} results</h1> : ""}
                        <ul className="time-results">
                            {
                                results.map((result, index) => {
                                    return <li key={index} value={result} onMouseOver={() => { }}>{result.toLowerCase()}</li>
                                })
                            }
                        </ul>
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