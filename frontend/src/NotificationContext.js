import React, { createContext, useContext, useState, useEffect } from 'react';
import Check from './assets/Icons/Check.svg';

// Create the context
const NotificationContext = createContext();

// Function to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Function to show a notification
  const addNotification = (notification) => {
    const id = new Date().getTime(); // Simple unique ID
    setNotifications((prevNotifications) => [...prevNotifications, { ...notification, id, exit: false }]);

    // Optionally, start exit animation after a delay, then remove
    setTimeout(() => initiateExit(id), 3000); // Adjust time as needed
  };

  const initiateExit = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) =>
        n.id === id ? { ...n, exit: true } : n
      )
    );

    // Remove the notification after the exit animation duration
    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n.id !== id)
      );
    }, 1000); // Should match the duration of the exit animation
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification ${notification.exit ? 'remove' : ''}`}>
            <img src={Check}></img>
            <div className="notification-content">
                <h1>{notification.title}</h1>
                {notification.message ? <p>{notification.message}</p>: ""}
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
