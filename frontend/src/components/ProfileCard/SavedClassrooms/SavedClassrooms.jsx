import React, { useState, useEffect } from 'react';
import './SavedClassrooms.css';
import { useNavigate } from 'react-router-dom';
import Bookmark from "../../../assets/Icons/Bookmark.svg"
import DownArrow from "../../../assets/Icons/DownArrow.svg"
import { useCache } from '../../../CacheContext';
import Result1 from '../../Results/Result1/Result1';
import {findNext} from '../../../pages/Room/RoomHelpers.js';

function SavedClassrooms({ userInfo }){

    const { getBatch } = useCache();
    const [saved, setSaved] = useState([]);

    const navigate = useNavigate();

    const fetchSaved = async () => {
        try{
            const saved = await getBatch(userInfo.saved);
            setSaved(saved);
            console.log(saved);
        } catch(error){
            console.log(error);
        }
    }

    useEffect(() => {
        if(userInfo){
            fetchSaved();
        }
    }, [userInfo]);

    const changeURL = (name) => {
        navigate(`/room/${name}`);
    }

    const [isOpen, setIsOpen] = useState(false);
  
    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };



    return (
        <div className={`saved ${isOpen ? 'open' : ''}`}>
            <div className="box-header">
                <div className="title">
                    <img src={Bookmark} alt="bookmark-icon" />
                    <p>saved classrooms</p>
                    <button className={`collapsible-head ${isOpen ? 'open' : ''}`} onClick={toggleOpen} >
                        <img src={DownArrow} alt="downArrow-icon" />
                    </button>
                </div>
            </div>
            <div className={`saved-content ${isOpen ? 'open' : ''}`}>
                {
                    saved.map((room, index) => {
                        return <Result1 key={index} result={room} attributes={[]} changeURL={changeURL} findNext={findNext} contentState="nameSearch"/>
                    })
                }
            </div>
        </div>
    )
}


export default SavedClassrooms;