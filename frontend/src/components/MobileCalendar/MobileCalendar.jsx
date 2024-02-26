import React, { useEffect, useState, useRef } from 'react';
import './MobileCalendar.css';
import DayColumn from '../DayColumn/DayColumn';

import { Pagination } from 'swiper/modules';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // This is the updated path for Swiper's CSS
import 'swiper/css/pagination'; // Updated path for pagination module CSS

// Import required modules

// Install Swiper modules


function MobileCalendar({ className, data, isLoading, addQuery, removeQuery, query, show, setShow}) {
    const days = ["M", "T", "W", "R", "F"];
    const dayNames = {
        "M": "monday",
        "T": "tuesday",
        "W": "wednesday",
        "R": "thursday",
        "F": "friday"
    }
    const loadColors = useRef(new Map()).current;
    const eventColors = useRef(new Map()).current;
    const [empty, setEmpty] = useState(true);

    useEffect(() => {
        if (className === "none") {
            setEmpty(true);
        } else {
            setEmpty(false);
        }
    }, [empty, className]);

    const today = new Date();
    const currentDay = today.getDay();
    const load = [
        // {
        //     "class_name": "loading",
        //     "start_time": 420,
        //     "end_time": 1260
        // },
    ];
    return (
        <div className={`mobile-calendar ${show ? "active" : ""}`}>
            <div className="swiper-container">
                <button className="hide-mobile-calendar" onClick={()=>{setShow(false)}}>hide</button>
                <div className="mobile-time">
                    <DayColumn day={'S'}/>
                </div>
                <Swiper
                    modules={[Pagination]}
                    slidesPerView={1}
                    pagination={{ clickable: true }} // Enables clickable pagination dots
                    onSlideChange={() => console.log('slide change')}
                    onSwiper={(swiper) => console.log(swiper)}
                >   
                    {days.map((day) => (
                        <SwiperSlide>
                            <div className="swiper-slide-content">
                                <p className={`day-name ${currentDay === days.indexOf(day)+1 ? "current-day-mobile" : ""}`}>{dayNames[day]}</p>
                                <DayColumn
                                    key={day}
                                    day={day}
                                    dayEvents={isLoading ? load : data ? data["weekly_schedule"][day] : load} eventColors={isLoading ? loadColors : data ? eventColors : loadColors}
                                    empty={empty}
                                    add={addQuery}
                                    remove={removeQuery}
                                    queries={query}
                                // change={change}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    )
}

export default MobileCalendar;