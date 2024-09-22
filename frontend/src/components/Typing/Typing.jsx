import React, { useState, useEffect } from 'react';
import './Typing.css';

const TypingComponent = ({ entries, showCaret = false }) => {
  const [currentText, setCurrentText] = useState('');
  const [entryIndex, setEntryIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let typingTimeout;

    if (entryIndex < entries.length) {
      const { text, time } = entries[entryIndex];

      if (!isDeleting && charIndex < text.length) {
        // Typing forward
        setIsBlinking(false); // Stop blinking when typing
        typingTimeout = setTimeout(() => {
          setCurrentText((prev) => prev + text.charAt(charIndex));
          setCharIndex(charIndex + 1);
        }, getRandomDelay());
      } else if (!isDeleting && charIndex === text.length) {
        // Wait for the specified time, then start deleting
        setIsBlinking(true); // Blink when waiting
        typingTimeout = setTimeout(() => {
          setIsDeleting(true);
          setCharIndex(charIndex - 1);
        }, time);
      } else if (isDeleting && charIndex >= 0) {
        // Deleting
        setIsBlinking(false); // Stop blinking when deleting
        typingTimeout = setTimeout(() => {
          setCurrentText((prev) => prev.slice(0, -1));
          setCharIndex(charIndex - 1);
        }, getRandomDelay());
      } else if (isDeleting && charIndex < 0) {
        // Move to next entry
        setIsDeleting(false);
        setIsBlinking(false);
        setCharIndex(0);
        setEntryIndex(entryIndex + 1);
      }
    } else {
      // Optionally reset to first entry or stop
      setEntryIndex(0);
    }

    return () => clearTimeout(typingTimeout);
  }, [entries, entryIndex, charIndex, isDeleting]);

  const getRandomDelay = () => {
    return Math.floor(Math.random() * (100 - 50 + 1)) + 50; // Random delay between 50ms and 200ms
  };

  return (
    <div>
      {currentText}
      {showCaret && (
        <span className={`caret ${isBlinking ? 'blinking' : ''}`}></span>
      )}
    </div>
  );
};

export default TypingComponent;
