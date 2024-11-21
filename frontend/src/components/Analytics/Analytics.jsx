import React, { useEffect } from 'react';
import './Analytics.scss';

import useAuth from '../../hooks/useAuth';

import { getVisitsByDay } from './AnalyticsHelpers';
import AnalyticsChart from './VisitsChart/AnalyticsChart';

function Analytics() {
    const { isAuthenticated, user } = useAuth();
    // useEffect(() => {
    //     if (!isAuthenticated) {
    //         return;
    //     }
    //     getVisitsByDay()
    //         .then((visits) => {
    //             console.log(visits);
    //         })
    //         .catch((error) => {
    //             console.error('Error fetching visits by day', error);
    //         });
    // }, [isAuthenticated]);
    return (
        <div className="analytics">
            <div className="heading">
            </div>
            <AnalyticsChart endpoint={"visits"} heading={"Unique Visits"} color={"#45A1FC"}/>
            <AnalyticsChart endpoint={"users"} heading={"New Users"} color={"#8052FB"}/>
            <AnalyticsChart endpoint={"searches"} heading={"Searches"} color={"#FA756D"}/>

        </div>
    );
}

export default Analytics;