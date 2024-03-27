import React, { createContext, useContext } from 'react';
/** 
documentation:
https://incongruous-reply-44a.notion.site/Frontend-ErrorProvider-Component-ErrorContext-2f2ef272695d4e74b595b48f66a8949c
*/

export const ErrorContext = createContext();

export const ErrorProvider = ({children}) =>{

    const newError = (error, navigate) => {
        console.error("Error:", error);
        localStorage.setItem('error', error);
        navigate('/error');
    }

    const getError = () => {
        return localStorage.getItem('error');
    }

    return (
        <ErrorContext.Provider value={{ newError, getError }}>
            {children}
        </ErrorContext.Provider>
    );
};

export const useError = () => useContext(ErrorContext);