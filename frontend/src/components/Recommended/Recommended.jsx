import React, { useState, useEffect, useRef } from "react";
import "./Recommended.css";
import Result from "../Results/Result/Result";
import { useCache } from '../../CacheContext.js';
import { useNavigate } from "react-router-dom";
import { useError } from '../../ErrorContext.js';
import Loader from "../Loader/Loader.jsx";
import useAuth from '../../hooks/useAuth.js';

function Recommended({id, debouncedFetchData, changeURLHelper, findNext, hide}) {
    const [room, setRoom] = useState(null);
    const [height, setHeight] = useState("auto");


    const { isAuthenticating, isAuthenticated } = useAuth();

    const { getRoom } = useCache();
    const { newError } = useError();
    
    const navigate = useNavigate();

    const containerRef = useRef(null);

    const fetchDataHelper = async (id) => {
        try{
            const data = await getRoom(id);
            setRoom(data);
            console.log(data);
        } catch (error){
            console.log(error);
            newError(error, navigate);
        }
    };

    useEffect(()=>{
        if(!containerRef.current){
            return;
        }
      
        const scrollHeight = height === "auto" ? containerRef.current.scrollHeight - 20 : containerRef.current.scrollHeight;
        setHeight(`${scrollHeight}px`);
        if(hide){
            setHeight("0px");
        } else {
            setHeight(`${scrollHeight}px`);
        }

    },[hide,containerRef.current]);

    useEffect(() => {
        fetchDataHelper(id);
    }, [id]);


    if(!room|| isAuthenticating){
        return(
            <div className="recommended">        
                <p>recommended for you</p>
                <Loader/>
            </div>
        )
    }

    return(
        <div className={`recommended-container ${hide ? "hide" : ""}`} ref={containerRef} style={{height: height}} >
            <div className="recommended">
                {isAuthenticated ? <p>recommended for you</p> : <p>popular right now</p>}
                <Result 
                    result={room} 
                    attributes={room.room.attributes}
                    debouncedFetchData={debouncedFetchData} 
                    changeURL={changeURLHelper}
                    findNext={findNext}
                    contentState={"nameSearch"}
                />
            </div>
        </div>
    )
}

export default Recommended;