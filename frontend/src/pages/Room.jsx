import React from 'react';
import { useParams } from 'react-router-dom';
import Calendar from '../components/Calendar/Calendar';

function Room(){
    let { roomid } = useParams();
    return(
        <div className="">
            <Calendar className={roomid}/>
        </div>
    );
}

export default Room