import React, { createContext, useContext } from 'react';
import axios from 'axios';

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
                console.log('returning cached');
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
    
    const getFreeRooms = async (query) => {
        try {
            const queryString = `/free/${JSON.stringify(query)}`;
            if(cache[queryString]){
                return cache[queryString];
            }
            const response = await axios.post('/free', { query });
            const responseBody = response.data;
    
            if (!responseBody.success) {
                // Log the error message if the operation was not successful
                console.error("Error fetching free rooms:", responseBody.message);
                return;
            }
    
            const roomNames = responseBody.data; // Extract the room names from the response data
            cache[queryString] = responseBody.data;
            //console.log(roomNames); // Log the room names or process them as needed
            return roomNames;
        } catch (error) {
            console.error('Error fetching free rooms:', error);
            return []; // Return an empty array or handle the error as needed
        }
    };
    
    // no cache support for now, very unlikely to be called multiple times
    // todo: add cache support, above still applies but can do partial cache
    const getBatch = async (queries) => {
        if(queries.length === 0){
            return [];
        }
        try{
            const response = await axios.post('/getbatch', {queries, exhaustive: true});
            const responseBody = response.data;
            if(!responseBody.success){
                console.error('Error fetching batch data:', responseBody.message);
                return;
            }
            return responseBody.data;
        } catch (error){
            console.error('Error fetching data:', error);
        }
    };

    const search = async (query, attributes) => {
        try{
            const response = await axios.post('/search', {query, attributes});
            const responseBody = response.data;
            if(!responseBody.success){
                console.error('Error fetching search data:', responseBody.message);
                return;
            }
            return responseBody.data;
        } catch (error){
            console.error('Error fetching search data:', error);
        }
    };

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
        <CacheContext.Provider value={{ getRooms, getRoom, getFreeRooms, getBatch, debounce }}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = () => useContext(CacheContext);