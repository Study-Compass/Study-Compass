import React, { useEffect, useState, useRef } from 'react';
import './MobileCalendar.css';
import DayColumn from '../DayColumn/DayColumn';

import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';

import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // This is the updated path for Swiper's CSS
import 'swiper/css/pagination'; // Updated path for pagination module CSS

/** 
documentation:
https://incongruous-reply-44a.notion.site/Frontend-MobileCalendar-Component-a4d78a97be4c43e99b8ed78137014746
*/

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
    
    const today = new Date();
    const currentDay = today.getDay();

    const [swiper, setSwiper] = useState(null);
    const initialSlide = 0 < currentDay < 6 ? currentDay-1:1;

    useEffect(() => {
        if (className === "none") {
            setEmpty(true);
        } else {
            setEmpty(false);
        }
        if(swiper){
            swiper.slideTo(initialSlide);
        }
    }, [empty, className]);

    const load = [
        // {
        //     "class_name": "loading",
        //     "start_time": 420,
        //     "end_time": 1260
        // },
    ];

    // mobile drag logic

    const [{ y }, set] = useSpring(() => ({
        // Set initial position based on 'show' state
        y: show ? 0 : 1000,
    }));

    useEffect(() => {
        set({ y: show ? 0 : 1000 });
    }, [show, set]);

    const bind = useDrag(({ down, movement: [, my], velocity, direction: [xDir, yDir] }) => {
        // Determine if the gesture is a swipe down based on velocity and the direction
        const isSwipeDown = velocity > 0.5 && yDir > 0; // yDir > 0 indicates a downward movement
    
        if (down) {
            // Prevent scrolling above initial show state
            const newY = my < 0 ? 0 : my; // This line ensures the element does not move above its initial position
            set({ y: newY, immediate: true });
        } else {
            if (isSwipeDown) {
                // Hide the calendar smoothly
                setShow(false);
                set({ y: 1000, immediate: false });
            } else {
                // Snap back to the top if not enough distance is covered or if trying to move above the initial state
                set({ y: 0, immediate: false });
            }
        }
    }, { axis: 'y', filterTaps: true });
    return (
        <animated.div 
            {...bind()} 
            className={`mobile-calendar ${show ? "active":""}`}
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                width: '100%', // Adjusted for full width
                height: '90%',
                transform:  y.to(y => `translate(-1px,${y}px)`),
                touchAction: 'none',
            }}
        >
            <div className="grab"></div>
            <div className="swiper-container">
                {/* <button className="hide-mobile-calendar" onClick={()=>{setShow(false)}}>hide</button> */}
                <div className="mobile-time">
                    <DayColumn day={'S'}/>
                </div>
                <Swiper
                    modules={[Pagination]}
                    initialSlide={0 < currentDay < 6 ? currentDay-1:1}
                    slidesPerView={1}
                    pagination={{ clickable: true }} // Enables clickable pagination dots
                    onSlideChange={() => console.log('slide change')}
                    onSwiper={setSwiper}
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
        </animated.div>
    )
}

export default MobileCalendar;