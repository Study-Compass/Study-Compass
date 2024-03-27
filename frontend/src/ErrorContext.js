import React, { createContext, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

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