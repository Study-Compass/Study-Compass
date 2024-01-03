import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import './Room.css';
import Header from '../components/Header/Header';

function Room(){
    let { roomid } = useParams();
    let navigate =  useNavigate();
    const [rooms, setRooms] = useState(null);

    // useEffect(() => {
    //     const fetchRooms = async () => {
    //         try {
    //             const response = await fetch(`/getrooms`);
    //             const rooms = await response.json();
    //             setRooms(rooms);
    //         } catch (error) {
    //             console.error("Error fetching data: ", error);
    //         }
    //     };

    //     fetchRooms();
    // }, [roomid]);

    function changeURL(){
        if(roomid === "Lally Hall 02")
            navigate("/room/Low%20Center%20for%20Industrial%20Inn.%203045",{ replace: true });
        else {
            console.log(roomid);
            navigate("/room/Lally%20Hall%2002",{ replace: true });
        }
    }
    return(
        <div className="room">
            <Header />
            <div className="calendar-container">
                <Calendar className={roomid}/>
            </div>
            <button onClick={changeURL}>change</button>
            <dropdown>
            </dropdown>
        </div>
    );
}

export default Room