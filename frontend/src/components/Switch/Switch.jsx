import React, { useState, useRef, useEffect } from 'react';
import './Switch.css';

function Switch({ options, onChange, selectedPass, setSelectedPass}) {
    const [selected, setSelected] = useState(0);
    const optionRefs = useRef([]);
    const containerRef = useRef(null);
    const [highlightStyle, setHighlightStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        // Initial highlight rectangle position
        if (optionRefs.current[selected] && containerRef.current) {
            setTimeout(() => {
                //necessary for weird dom stuff
                if(containerRef.current){
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const rect = optionRefs.current[selected].getBoundingClientRect();
                setHighlightStyle({
                    left: rect.left - containerRect.left,
                        width: rect.width
                    });
                }
            }, 100);
        }
    }, [selected]);

    useEffect(() => {
        setSelected(selectedPass);
    }, [selectedPass]);

    const handleClick = (index) => {
        if(options.length === 2){
            if(index === selected){
                setSelected(selected === 0 ? 1 : 0);
                onChange(selected === 0 ? 1 : 0);
                setSelectedPass(selected === 0 ? 1 : 0);
                return;
            }
        }
        setSelected(index);
        setSelectedPass(index);
        onChange(index);
        if (optionRefs.current[index] && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const rect = optionRefs.current[index].getBoundingClientRect();
            setHighlightStyle({
                left: rect.left - containerRect.left,
                width: rect.width
            });
        }
    };

    return (
        <div className="switch" ref={containerRef}>
            <div className="highlight" style={highlightStyle}></div>
            {options.map((option, index) => (
                <div className={`switch-option ${selected === index ? 'selected' : ''}`}
                    key={index}
                    onClick={() => { handleClick(index); onChange(index); }}
                    ref={el => optionRefs.current[index] = el}
                >
                    <p>{option}</p>
                </div>
            ))}
        </div>
    );
}

export default Switch;
