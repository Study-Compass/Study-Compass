import React, { useEffect, useState } from 'react';
import './Analytics.scss';

import useAuth from '../../hooks/useAuth';

import AnalyticsChart from './VisitsChart/AnalyticsChart';
import Dashboard from './Dashboard/Dashboard';
import DateRangeControls from './DateRangeControls';

function Analytics() {
    const { isAuthenticated } = useAuth();
    const [summary, setSummary] = useState(null);
    const [rangeMode, setRangeMode] = useState('month');
    const [startDate, setStartDate] = useState(new Date());
    const [cumulative, setCumulative] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) return;
        let url = '/summary';
        if (rangeMode === 'all') {
            url += '?range=all';
        } else {
            let endDate;
            if (rangeMode === 'month') endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 28);
            if (rangeMode === 'week') endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 7);
            if (rangeMode === 'day') endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1);
            const qs = new URLSearchParams({
                startDate: startDate.toISOString().slice(0,10),
                endDate: endDate.toISOString().slice(0,10)
            }).toString();
            url += `?${qs}`;
        }
        fetch(url)
            .then(r => r.json())
            .then(setSummary)
            .catch(console.error);
    }, [isAuthenticated, rangeMode, startDate]);

    return (
        <div className="analytics">
            <div className="heading" />
            <DateRangeControls rangeMode={rangeMode} setRangeMode={setRangeMode} startDate={startDate} setStartDate={setStartDate} cumulative={cumulative} setCumulative={setCumulative} />
            <Dashboard summary={summary} />
            <AnalyticsChart endpoint={"visits"} heading={"Visits"} color={"#45A1FC"} externalViewMode={rangeMode} externalStartDate={startDate} externalCumulative={cumulative}/>
            <AnalyticsChart endpoint={"users"} heading={"New Users"} color={"#8052FB"} externalViewMode={rangeMode} externalStartDate={startDate} externalCumulative={cumulative}/>
            <AnalyticsChart endpoint={"repeated-visits"} heading={"Repeated Visits"} color={"#2BB673"} externalViewMode={rangeMode} externalStartDate={startDate} externalCumulative={cumulative}/>
            <AnalyticsChart endpoint={"searches"} heading={"Searches"} color={"#FA756D"} externalViewMode={rangeMode} externalStartDate={startDate} externalCumulative={cumulative}/>
        </div>
    );
}

export default Analytics;