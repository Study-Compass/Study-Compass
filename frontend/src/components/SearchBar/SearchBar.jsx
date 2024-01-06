import React, { useState,useEffect } from 'react';
import './SearchBar.css';

//need to add support for abbreviated versions
function SearchBar({ data, onEnter}) {
    const [searchInput, setSearchInput] = useState('');
    const [results, setResults] = useState([]);

    const [isFocused, setIsFocused] = useState(false);
    const [selected, setSelected] = useState(0);

    useEffect(() => {
    }, [isFocused]);
    const handleInputChange = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchInput(value);
        setSelected(0);

        if (value === '') {
            setResults([]);
        } else {
            const filteredResults = data.filter(item =>
                item.toLowerCase().startsWith(value)
            );
            const newfilteredResults = data.filter(item =>
                item.toLowerCase().includes(value)
            );        
            filteredResults.push(...newfilteredResults);    
            if(filteredResults.length === 0){
                filteredResults.push("no results found");
            }
            const firstSeven = filteredResults.slice(0, 7);
            setResults(firstSeven);

        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            if (results.length > 0) {
                setSearchInput(results[selected].toLowerCase());
                setResults([]);
                onEnter(results[selected]);
            }
        }
        if (event.key === 'ArrowDown') {
            if(selected === results.length-1){
                setSelected(0);
            } else {
                setSelected(selected+1);
            }
        }   
        if (event.key === 'ArrowUp') {
            if(selected === 0){
                setSelected(results.length-1);
            } else {
                setSelected(selected-1);
            }
        }   
    };

    return (
        <div className="search-container">
            <input
                className="search-bar"
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                placeholder={!isFocused ? "search..." : ""}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                spellCheck="false"
            />
            {results.length > 0 && (
                <ul>
                    <div className="spacer"></div>
                    {results.map((item, index) => {
                        const matchIndex = item.toLowerCase().indexOf(searchInput.toLowerCase());
                        const beforeMatch = item.toLowerCase().slice(0, matchIndex);
                        const matchText = item.toLowerCase().slice(matchIndex, matchIndex + searchInput.length);
                        const afterMatch = item.toLowerCase().slice(matchIndex + searchInput.length);
                        if(item === "no results found"){
                            return (
                                <li key={index} className="no-results">
                                    <span className="non-match">{item}</span>
                                </li>
                            );
                        }
                        return (
                            <li key={index} className={index === selected ? "chosen" : ""} onClick={onEnter(results[index])}>
                                <span className="non-match">{beforeMatch}</span>
                                <span className="match">{matchText}</span>
                                <span className="non-match">{afterMatch}</span>
                            </li>
                        );
                    })}                 
                </ul>
            )}
        </div>
    );
}

export default SearchBar;
