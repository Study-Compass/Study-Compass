import React, { useState, useEffect } from 'react';
import './Typing.scss';

const TypingComponent = ({ entries, showCaret = false }) => {
    const [currentText, setCurrentText] = useState('');
    const [entryIndex, setEntryIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBlinking, setIsBlinking] = useState(false);

    const [completingText, setCompletingText] = useState("");

    useEffect(() => {
        let typingTimeout;

        if (entryIndex < entries.length) {
            const { text, time } = entries[entryIndex];
            setCompletingText(text);

            //delay for 500ms with fake promise

            if (!isDeleting && charIndex < text.length) {
                // Typing forward
                setIsBlinking(false); // Stop blinking when typing
                typingTimeout = setTimeout(() => {
                    setCurrentText((prev) => prev + text.charAt(charIndex));
                    setCharIndex(charIndex + 1);
                }, getRandomDelay());
            } else if (!isDeleting && charIndex === text.length) {
                // Wait for the specified time, then start deleting
                setTimeout(() => {    
                    setIsBlinking(true); // Blink when waiting
                }, 300);
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
        <div className="typing-text" style={{display:"flex", alignItems: "center"}}>
            {currentText}
            {showCaret && (
                <span className={`caret ${isBlinking ? 'blinking' : ''}`}></span>
            )}
            {
                !isDeleting && charIndex === completingText.length && 
                <svg xmlns="http://www.w3.org/2000/svg" width="1.3em" height="1.3em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="16" stroke-dashoffset="16" d="M5 12h13.5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="16;0"/></path><path stroke-dasharray="10" stroke-dashoffset="10" d="M19 12l-5 5M19 12l-5 -5"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.2s" values="10;0"/></path></g></svg>
            }
        </div>
    );
};

export default TypingComponent;
