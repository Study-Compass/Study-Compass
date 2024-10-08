import React, { createContext, useContext, useState, useEffect } from 'react';
import useAuth from './hooks/useAuth';

// Create the context
const DarkModeContext = createContext();

// Function to use the dark mode context
export const useDarkMode = () => useContext(DarkModeContext);

// Dark Mode provider component
export const DarkModeProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

    // check for auth
    const { isAuthenticating, isAuthenticated, user, getDeveloper } = useAuth();

    useEffect(() => {
        if (isAuthenticating) {
            return;
        }

        // if (!isAuthenticated) {
        //     // navigate("/login");
        // }
        // if (!user) {
        //     return;
        // } else {
        //     console.log(user);
        // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticating, isAuthenticated, user])
    
    // check for user system preference
        // use code from dusplay settings

        
  return (
    <DarkModeContext.Provider value={{}}>
      {children}

    </DarkModeContext.Provider>
  );
};
