import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import './Room.css';
import Header from '../components/Header/Header';
import SearchBar from '../components/SearchBar/SearchBar';

function Room(){
    let { roomid } = useParams();
    let navigate =  useNavigate();
    const [rooms, setRooms] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch(`/getrooms`);
                const rooms = await response.json();
                setRooms(rooms);
                console.log(rooms);
            } catch (error) {
                console.error("Error fetching data: ", error);
            }
        };

        fetchRooms();
    }, [roomid]);

    // function changeURL(event){
    //     navigate(`/room/${event.target.value}`,{ replace: true });
    // }

    function changeURL2(option){
        navigate(`/room/${option}`,{ replace: true });
    }

    return(
        <div className="room">
            <Header />  
            <SearchBar data={rooms} onEnter={changeURL2}/>
            {/* <select onChange={changeURL}>
                {rooms && rooms.map((room) => <option value={room} selected={room===roomid}>{room.toLowerCase()}</option>)}
            </select> */}
            <div className="calendar-container">
                <Calendar className={roomid}/>
            </div>
        </div>
    );
}

export default Room