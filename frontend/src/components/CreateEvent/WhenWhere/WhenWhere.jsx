import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss'
import './WhenWhere.scss'

import Calendar from '../../CalendarComponents/Calendar/Calendar';
import { useCache } from '../../../CacheContext';
import { addQueryHelper, removeQueryHelper } from './WhenWhereHelpers';
import { set } from 'mongoose';

function WhenWhere(){
    const {getRoom, getRooms} = useCache();
    const [roomIds, setRoomIds] = useState({});
    const [rooms, setRooms] = useState([]);
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState({'M': [],'T': [],'W': [],'R': [],'F': [],});


    const addQuery = (key, value) => addQueryHelper(key, value, setQuery);
    const removeQuery = (key, value) => removeQueryHelper(key, value, setQuery);

    const getData = async () => {
        // fetch data
        const data = await getRoom("none");
        console.log(data);
        setData(data.data);
        const rooms = await getRooms();
        setRoomIds(rooms);
        setRooms(Object.keys(rooms).sort());
        setLoading(false);
    }

    useEffect(() => {
        getData();
    }, []);

    return(
        <div className="when-where create-component">
            <h1>when & where</h1>
            <div className="time-select">

            <select name="select" id="">
                {rooms.map((room) => (
                    <option value={room}>{room}</option>
                ))}
            </select>
            <Calendar className={"none"} data={data} isLoading={loading} query={query} addQuery={addQuery} removeQuery={removeQuery}/>
            </div>
        </div>
    );
}

export default WhenWhere;

