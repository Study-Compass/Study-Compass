import React, { createContext, useContext } from 'react';
import axios from 'axios';

/** 
documentation:
https://incongruous-reply-44a.notion.site/Frontend-CacheProvider-Component-CacheContext-64296ab287fc4347be59ca848cc632b0
*/
export const CacheContext = createContext();

export const CacheProvider = ({children}) =>{
    let cache = {};

    const getRooms = async () => {
        try {
            if(cache['/getrooms']){
                return cache['/getrooms'];
            } else{
                const response = await fetch(`/getrooms`);
                const responseBody = await response.json();
                if (!response.ok) {
                    // Log the error if the response status is not OK
                    console.error("Error fetching data:", responseBody.message);
                    return;
                }
        
                if (!responseBody.success) {
                    // Log the error if success is false
                    console.error("Error fetching room names:", responseBody.message);
                    return;
                }
                cache['/getrooms'] = responseBody.data;    
                return responseBody.data;
            }
    
        } catch (error) {
            console.error("Error:", error);
    
        }
    
    };
    
    const getRoom = async (id) => {
        try {
            const queryString = `/getroom/${id}`;
            if(cache[queryString]){
                // console.log('returning cached');
                return cache[queryString];
            } else {
                const response = await fetch(`/getroom/${id}`);
                const data = await response.json();
                //console.log(data.data);
                cache[queryString] = data;
                return data;
            }
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    const getRoomUpdate = async (id) => {
        try {
            const queryString = `/getroom/${id}`;
            const response = await fetch(`/getroom/${id}`);
            const data = await response.json();
            //console.log(data.data);
            cache[queryString] = data;
            return data;
            
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };
    
    const getFreeRooms = async (query) => {
        try {
            const queryString = `/free/${JSON.stringify(query)}`;
            
            if(cache[queryString]){
                setTimeout(() => { // this is for asynchronous nature of useState, else useEffect won't trigger               
                    return cache[queryString];
                }, 100);
            }
            const response = await axios.post('/free', { query });
            const responseBody = response.data;
    
            if (!responseBody.success) {
                // Log the error message if the operation was not successful
                console.error("Error fetching free rooms:", responseBody.message);
                return;
            }

            //exclude entries including "alumni"
            // responseBody.data = responseBody.data.filter(room => !room.name.toLowerCase().includes('alumni'));
    
            const roomNames = responseBody.data.filter(room => !room.toLowerCase().includes('alumni')); // Extract the room names from the response data
            cache[queryString] = responseBody.data;
            //console.log(roomNames); // Log the room names or process them as needed
            return roomNames;
        } catch (error) {
            console.error('Error fetching free rooms:', error);
            return []; // Return an empty array or handle the error as needed
        }
    };
    
    const getBatch = async (queries) => {
        if (queries.length === 0) {
            return [];
        }
    
        const fetchQueries = [];
        const results = [];
        const cacheMisses = [];
    
        // check which queries are already cached
        queries.forEach((query, index) => {
            const cacheKey = `/getroom/${query}`;
            if (cache[cacheKey]) {
                results[index] = cache[cacheKey];
            } else {
                fetchQueries.push(query);
                cacheMisses.push(index);
            }
        });
    
        // if all queries are cached, return the results
        if (fetchQueries.length === 0) {
            return results.filter(result => result);
        }
    
        // fetch missing data from the backend
        try {
            const response = await axios.post('/getbatch', { queries: fetchQueries, exhaustive: true });
            const responseBody = response.data;
            if (!responseBody.success) {
                console.error('Error fetching batch data:', responseBody.message);
                return;
            }
    
            // update cache and results with fetched data
            responseBody.data.forEach((data, i) => {
                const cacheKey = `/getroom/${fetchQueries[i]}`;
                cache[cacheKey] = data; 
                results[cacheMisses[i]] = data; // insert data into the correct position
            });
    
            return results.filter(result => result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    
    const search = async (query, attributes, sort) => {
        try{
            if(`${query}${attributes}${sort}` in cache){
                return cache[`${query}${attributes}${sort}`];
            }
            const response = await axios.get('/search', {
                params: {
                  query: query,
                  attributes: attributes, 
                  sort: sort
                }, headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });            
            const responseBody = response.data;
            if(!responseBody.success){
                console.error('Error fetching search data:', responseBody.message);
                return;
            }
            cache[`${query}${attributes}${sort}`] = responseBody.data;
            return responseBody.data;
        } catch (error){
            console.error('Error fetching search data:', error);
            throw error;
        }
    };

    const allSearch = async (nameQuery, timeQuery, attributes, sort) => {
        try{
            // add cacheing logic
            const response = await axios.get('/all-purpose-search', {
                params:{
                    query : nameQuery,
                    timePeriod : timeQuery,
                    attributes : attributes,
                    sort : sort,
                }, headers: {
                    'Authorization' : `Bearer ${localStorage.getItem('token')}`
                }
            });
            const responseBody = response.data;
            if(!responseBody.success){
                console.error('Error fetching search data:', responseBody.message);
                return;
            }
            return responseBody.data;
        } catch (error){
            throw error;
        }
    }

    function debounce(func, wait) { //move logic to other file
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }


    return (
        <CacheContext.Provider value={{ getRooms, getRoom, getRoomUpdate, getFreeRooms, getBatch, search, allSearch, debounce }}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = () => useContext(CacheContext);