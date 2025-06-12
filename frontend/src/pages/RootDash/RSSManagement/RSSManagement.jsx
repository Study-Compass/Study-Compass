import React from 'react';
import './RSSManagement.scss';
import {useFetch} from '../../../hooks/useFetch';
import RSSFeed from './RSS/RSSFeed';
function RSSManagement() {
    const {data: rssfeeds, loading, error} = useFetch('/get-rss-feeds');
    if(!rssfeeds) return null;
    return (
        <div className='rss-management'>   
            <h1>RSS Management</h1>
            <div className='rss-feeds'>
                {rssfeeds.data.map((rssfeed) => (
                    <RSSFeed key={rssfeed._id} rssfeed={rssfeed} />
                ))}
            </div>
        </div>
    );
}

export default RSSManagement;