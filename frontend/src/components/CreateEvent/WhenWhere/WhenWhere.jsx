import React, { useState, useEffect, useRef } from 'react';
import '../CreateComponents.scss'
import './WhenWhere.scss'

import Calendar from '../../CalendarComponents/Calendar/Calendar';
import { useCache } from '../../../CacheContext';
import { addQueryHelper, removeQueryHelper } from './WhenWhereHelpers';
import DayColumn from '../../CalendarComponents/DayColumn/DayColumn';
import { useNotification } from '../../../NotificationContext';

function WhenWhere({next, visible}){
    const {addNotification} = useNotification();
    const {getRoom, getRooms} = useCache();
    const [roomIds, setRoomIds] = useState({});
    const [empty, setEmpty] = useState(true);
    const [rooms, setRooms] = useState([]);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState({'S': [],'M': [],'T': [],'W': [],'R': [],'F': [], "H": []});
    const [nextActive, setNextActive] = useState(false);    
    const dateRange = ["9/11", "9/12", "9/13", "9/14", "9/15", "9/16", "9/17"];

    const addQuery = (key, value) => addQueryHelper(key, value, setQuery);
    const removeQuery = (key, value) => removeQueryHelper(key, value, setQuery);

    const getData = async (id) => {
    // fetch data
        if(id !== "none"){
            setEmpty(false);
        }
        const data = await getRoom(id);
        //add entry to beginning and end of data
        data.data["weekly_schedule"]["S"] = [];
        data.data["weekly_schedule"]["H"] = [];
        setData(data.data);
        setQuery({'S': [],'M': [],'T': [],'W': [],'R': [],'F': [], "H": []});
        const rooms = await getRooms();
        setRoomIds(rooms);
        setRooms(Object.keys(rooms).sort());
        setLoading(false);
    }

    useEffect(() => {
        getData("none");
    }, []);

    useEffect(() => {
        if(Object.values(query).flat().length > 0){
            if(empty){
                addNotification({ title: "No room selected", message: "please select a room before selecting a timeslot", type: "error" });
                setQuery({'S': [],'M': [],'T': [],'W': [],'R': [],'F': [], "H": []});
            } else {
                setNextActive(true);
            }
        } else {
            setNextActive(false);
        }
    },[query]);

    const handleRoomSelect = (e) => {
        const id = roomIds[e.target.value];
        getData(id);
    }

    // ============================================ scroll indicator logic ============================================

    const containerRef = useRef(null);
    const [scrollClass, setScrollClass] = useState('');
  
    const handleScroll = () => {
      const container = containerRef.current;
  
      if (!container) return;
  
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
  
      if (scrollLeft === 0 && maxScrollLeft === 0) {
        setScrollClass(''); // No scroll at all
      } else if (scrollLeft === 0) {
        setScrollClass('right-scroll');
      } else if (scrollLeft === maxScrollLeft) {
        setScrollClass('left-scroll');
      } else {
        setScrollClass('left-scroll right-scroll'); 
      }
    };
  
    useEffect(() => {
      const container = containerRef.current;
      setTimeout(() => {
          handleScroll(); // Check scroll position on mount
      }, 10);
  
      if (container) {
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
      }
    }, [visible]);

    // ================================================================================================================
    

    return(
        <div className={`when-where create-component ${visible && "visible"}`}>
            <h1>when & where</h1>
            <div className="time-select">
                <select name="select" id="" onChange={handleRoomSelect}>
                    <option className="disabled" value="" disabled selected>select an option</option>
                    {rooms.map((room) => (
                        <option value={room}>{room}</option>
                    ))}
                </select>
                <div className="row">
                    <DayColumn day={"G"}/>
                    <div className={`calendar-wrapper ${scrollClass}`}>
                        <div ref={containerRef}>
                            <Calendar className={"none"} data={data} isLoading={loading} query={query} addQuery={addQuery} removeQuery={removeQuery} weekend={true} dateRange={dateRange}/>
                        </div>
                        <div className="scroll-border-r"></div>
                        <div className="scroll-border-l"></div>
                    </div>
                </div>
            </div>
            <button className={`next-button ${nextActive && "active"}`} onClick={next}>
                next
            </button>
        </div>
    );
}

export default WhenWhere;

