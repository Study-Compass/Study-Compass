import React from 'react';
import './Classroom.css';
// import '../../App.css';  

function Classroom({ name, roomid }) {
    if(name === "none" || !name){
        return "";
    }
    return (
        <div className='classroom-component'>
            <div className="image shimmer">
            </div>
            <div className="classroom-info">
                <h1>{name}</h1>
                <p>Welcome to the Classroom page!</p>
            </div>
        </div>
    );
}

export default Classroom;
