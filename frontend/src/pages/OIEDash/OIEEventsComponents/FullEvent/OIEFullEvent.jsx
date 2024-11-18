import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './OIEFullEvent.scss';
import {Icon} from '@iconify-icon/react';  
import StarGradient from '../../../../assets/OIE-Gradient2.png';
import MockPoster from '../../../../assets/MockPoster.png';
import { useFetch } from '../../../../hooks/useFetch';
import { useNotification } from '../../../../NotificationContext';
import axios from 'axios';

function OIEFullEvent({ event, eventId = null }){
    const { addNotification } = useNotification();

    const { data, loading, error } = useFetch('/config');
    const fullEvent = useFetch(`/get-event/${eventId ? eventId :event._id}`);

    const date = new Date(event.start_time);
    const dateEnd = new Date(event.end_time);

    const [tab, setTab] = useState("info");
    const [checked, setChecked] = useState({});

    const handleCheck = async (index) => {
        console.log(index);
        const newChecked = {...checked};
        newChecked[index] = !newChecked[index];
        setChecked(newChecked);
        let newOIE = {...fullEvent.data.event.OIE};
        const checkedItems = [];
        for(const key in newChecked){
            if(newChecked[key]){
                checkedItems.push(data.config.checklist[key].title);
            }
        }
        newOIE.checkListItems = checkedItems;
        changeOIE(newOIE);
    }

    const handleApproved = async () => {
        const newOIE = {...fullEvent.data.event.OIE};
        newOIE.status = "Approved";
        changeOIE(newOIE);
    }

    const changeOIE = async (newOIE) => {
        try{
            console.log(newOIE);
            const auth = {headers: {"Authorization": `Bearer ${localStorage.getItem("token")}`}};
            const response = await axios.post(`/oie-status`, newOIE, auth);
            console.log(response);
        } catch(err){
            console.log(err);
            addNotification({title: "Internal Error", content: "Failed to update checklist", type: "error"});
        }
    }

    useEffect(() => {
        if(fullEvent.data){
            const check = {};
            fullEvent.data.event.OIE.checkListItems.forEach((item)=>{
                //find index of item in config, then set checked to true
                const index = data.config.checklist.findIndex((configItem) => configItem.title.toLowerCase() === item.toLowerCase());
                check[index] = true;

            });
            setChecked(check);
        }
    }, [fullEvent.data]);

    if(!event){
        return "";
    }

    return(
        <div className="full-event oie">
            <div className="tabs">
                <div className={`tab ${tab === "info" && "selected"}`} onClick={()=>setTab('info')} >
                    <div className="tab-content">
                        <Icon icon="akar-icons:info-fill" />
                        <p>info</p>
                    </div>
                </div>
                <div className={`tab ${tab === "check" && "selected"}`} onClick={()=> setTab('check')}>
                    <div className="tab-content">
                        <Icon icon="icon-park-solid:check-one" />
                        <p>check</p>
                    </div>
                </div>
            </div>
            <div className={`event-info `}>
                <div className={`info ${tab === "info" && "visible"}`}>
                    <div className="image">
                        <img src={event.image ? event.image : MockPoster } alt="" />
                    </div>
                    <div className="content">
                        <h1>{event.name}</h1>
                        <div className="row">
                            <Icon icon="heroicons:calendar-16-solid" />
                            <div className="col">
                                <p>{date.toLocaleString('default', {weekday: 'long'})}, {date.toLocaleString('default', {month: 'long'})} {date.getDate()}</p>
                                <p>{date.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})} -  {dateEnd.toLocaleString('default', {hour: 'numeric', minute: 'numeric', hour12: true})}</p>
                            </div>
                        </div>
                        <div className="row">
                            <Icon icon="fluent:location-28-filled" />
                            <p>{event.location}</p>
                        </div>
                    </div>  
                    <img src={StarGradient} alt="" className="gradient" />
                </div>
                <div className={`check ${tab === "check" && "visible"}`}>
                    <h1>Status</h1>
                    <h1>Checklist</h1>
                    <div className="checklist">
                        {!loading && data.config.checklist.map((item, index) => (
                            <div className={`check-item ${checked[index] && "checked"}`} key={index} onClick={()=>handleCheck(index)} >
                                <div className="row">
                                    <Icon icon={checked[index] ? "icon-park-outline:check-one" : "mdi:circle-outline"} />
                                    <div className="col">
                                        <h2>{item.title}</h2>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

}

export default OIEFullEvent;