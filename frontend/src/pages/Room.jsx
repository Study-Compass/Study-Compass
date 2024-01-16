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
    }, [roomid]);
    // function changeURL(event){
    //     navigate(`/room/${event.target.value}`,{ replace: true });
    // }

    function changeURL2(option){
        navigate(`/room/${option}`,{ replace: false });
    }

    return(
        <div className="room">
            <Header />  
            <SearchBar data={rooms} onEnter={changeURL2} room={roomid}/>
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