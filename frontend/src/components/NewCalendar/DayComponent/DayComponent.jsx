import React from 'react';
import PropTypes from 'prop-types';
import MonthEvent from '../../../pages/OIEDash/EventsCalendar/Month/MonthEvent/MonthEvent';
import './DayComponent.scss';

const DayComponent = ({ date, day, events }) => {
    if(day === "Time"){
        return (
            <div className="time-col day-component">
                <div className="time-grid">
                    {/* append child for time period from 12 am to 11:59 pm, one child every 30 minutes */}
                    {Array.from({ length: 48 }, (_, i) => (
                        <div key={`time-${i}`} className="time-period">
                            {i % 2 === 0 ? `${i / 2}:00` : `${(i - 1) / 2}:30`}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div className="day-component">
            {/* <div className="header">
                <p>{day} <b>{date}</b></p>
            </div> */}
            {/* <div className="events">
                {events && events.map((event, index) => (
                    <MonthEvent key={event._id} event={event} show={index === 10} />
                ))}
            </div> */}
            <div className="grid-container">

                <div className="time-grid">
                    {/* append grid item for each 30 minute time period */}
                    {Array.from({ length: 48 }, (_, i) => (
                        <div key={`time-${i}`} className="time-period">
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default DayComponent;