import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import './Room.css';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar/SearchBar';
import useAuth from '../hooks/useAuth';
import Classroom from '../components/Classroom/Classroom';

import axios from 'axios';


function Room(){
    let { roomid } = useParams();
    let navigate =  useNavigate();
    const [rooms, setRooms] = useState(null);
    const { isAuthenticated, logout } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [freeQuery, setFreeQuery] = useState({
        'M': [],
        'T': [],
        'W': [],
        'R': [],
        'F': [],
    });

    console.log("roomid: ", roomid);
    useEffect(() => {
        if(isAuthenticated === null){
            console.log("isAuthenticated null");
            return;
        }
        if(!isAuthenticated){
            console.log("not authenticated");
            // navigate('/');
        }
        console.log("isAuthenticated: ", isAuthenticated);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    useEffect(() => {
        const fetchRooms = async () => {
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
            } catch (networkError) {
                console.error("Network error:", networkError);
            }
        };
    
        fetchRooms();
    }, [roomid, isAuthenticated]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setData(null);
            try {
                const response = await fetch(`/getroom/${roomid}`);
                const data = await response.json();
                setData(data);
                console.log(data);
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally{
                setLoading(false);
            }
        };

        fetchData();
    }, [roomid, isAuthenticated]);

    const fetchFreeRooms = async () => {
        try {
          const response = await axios.post('/free', {freeQuery});
          const roomNames = response.data;
          console.log(roomNames); // Process the response as needed
        } catch (error) {
          console.error('Error fetching free rooms:', error);
          // Handle error
        }
      };

    // useState(() => {
    //     fetchFreeRooms();
    // }, [freeQuery]);


    function changeURL2(option){
        navigate(`/room/${option}`,{ replace: true });
    }

    return(
        <div className="room">
            <Header />  
            <div className="content-container">
                <div className="calendar-container">
                    <div className="left">
                        <SearchBar data={rooms} onEnter={changeURL2} room={roomid}/>
                        <Classroom name={roomid} roomid={roomid}/>
                    </div>
                    <div className="right">
                        <Calendar className={roomid} data={data} isloading={loading} setFreeQuery={setFreeQuery}/>
                    </div>
                </div>
            </div>
            {/* <button onClick={logout}>logout</button> */}
        </div>
    );
}

export default Room