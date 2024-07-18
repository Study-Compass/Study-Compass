import React, { useState, useEffect } from "react";
import "./Recommended.css";
import Result from "../Results/Result/Result";
import { useCache } from '../../CacheContext.js';
import { useNavigate } from "react-router-dom";
import { useError } from '../../ErrorContext.js';
import Loader from "../Loader/Loader.jsx";

function Recommended({id, debouncedFetchData, changeURLHelper, findNext, setContentState}) {
    const [room, setRoom] = useState(null);

    const { getRoom } = useCache();
    const { newError } = useError();
    
    const navigate = useNavigate();

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

    useEffect(() => {
        fetchDataHelper(id);
    }, [id]);

    if(!room){
        return(
            <div className="recommended">        
                <Loader/>
            </div>
        )
    }
    
    
    return(
        <div className="recommended">
            <p>recommended for you</p>
            <Result 
                result={room} 
                attributes={room.room.attributes}
                debouncedFetchData={debouncedFetchData} 
                changeURL={changeURLHelper}
                findNext={findNext}
                contentState={"nameSearch"}
            />
        </div>
    )
}

export default Recommended;