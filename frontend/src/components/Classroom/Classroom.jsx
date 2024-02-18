import React, { useEffect, useState } from 'react';
import './Classroom.css';
// import '../../App.css';  

function Classroom({ name, roomid }) {
    const [image, setImage] = useState("")

    useEffect(()=>{
        setImage("");
    },[name])

    if(name === "none" || !name){
        return "";
    }



    setTimeout(() => {
        setImage("https://www.jmzarchitects.com/wp-content/uploads/2020/03/17112901-2-scaled.jpg");
    }, 1000);

    return (
        <div className='classroom-component'>
            <div className={`image ${image === "" ? "shimmer": ""}`}>
                {!image == "" ? 
                    <img src={image}></img>
                : ""}
            </div>
            <div className="classroom-info">
                <h1>{name}</h1>
                <p>Welcome to the Classroom page!</p>
            </div>
        </div>
    );
}

export default Classroom;
