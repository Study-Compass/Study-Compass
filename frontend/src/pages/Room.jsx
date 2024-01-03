import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';
import './Room.css';
import Header from '../components/Header/Header';

function Room(){
    let { roomid } = useParams();
    let navigate =  useNavigate();

    function changeURL(){
        navigate("/room/CS101",{ replace: true });
    }
    return(
        <div className="room">
            <Header />
            <div className="calendar-container">
                <Calendar className={roomid}/>
            </div>
            <button onClick={changeURL}>change</button>
        </div>
    );
}

export default Room