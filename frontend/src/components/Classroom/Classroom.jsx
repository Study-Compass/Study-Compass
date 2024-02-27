import React, { useEffect, useState } from 'react';
import './Classroom.css';
// import '../../App.css';  

function Classroom({ name, room}) {
    const [image, setImage] = useState("")

    useEffect(()=>{
        setImage("");
    },[room])
    
    useEffect(() => {
        if(room === null || room === undefined){
            return;
        }
        if(room.image === "/"){
            console.log("image is /");
            setImage("https://www.jmzarchitects.com/wp-content/uploads/2020/03/17112901-2-scaled.jpg");
        } else {
            setImage(`${process.env.PUBLIC_URL}${room.image}`);
        }
    }, [room]);
    
    if(name === "none" || !name){
        return "";
    }

    return (
        <div className='classroom-component'>
            <div className={`image ${image === "" ? "shimmer": ""}`}>
                {!(image === "")? 
                    <img src={image} alt="classroom"></img>
                : ""}
            </div>
            <div className="classroom-info">
                <h1>{name}</h1>
            </div>
        </div>
    );
}

export default Classroom;
