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

    const [darkMode, setDarkMode] = useState(() => {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark;
    });

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setDarkMode(mediaQuery.matches);
      
      // Listen for changes in system preference
      mediaQuery.addEventListener('change', handleChange);
      
      // Clean up event listener
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
      if (isAuthenticating) {
          return;
      }

      if (isAuthenticated && user) {
        const userPreference = user.darkModePreference; 
        
        if (userPreference !== undefined) {
            setDarkMode(userPreference);
        }
      }
    }, [isAuthenticating, isAuthenticated, user])
    
    // check for user system preference
        // use code from display settings

    const toggleDarkMode = () => {
      setDarkMode(prevMode => !prevMode);
    };
  
  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode}}>
      {children}

    </DarkModeContext.Provider>
  );
};
