import React, { useEffect } from 'react';
import './Analytics.scss';

import useAuth from '../../hooks/useAuth';

import { getVisitsByDay } from './AnalyticsHelpers';
import VisitsChart from './VisitsChart/VisitsChart';

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
            <VisitsChart />

        </div>
    );
}

export default Analytics;