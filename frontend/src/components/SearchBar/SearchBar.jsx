import React, { useState, useRef, useEffect } from 'react';
import './SearchBar.css';
import x from '../../assets/x.svg';
import tab from '../../assets/tab.svg';

//need to add support for abbreviated versions
function SearchBar({ data, onEnter, room}) {
    const [searchInput, setSearchInput] = useState(room.toLowerCase());
    const [results, setResults] = useState([]);
    const [lower, setLower] = useState("")

    const [isFocused, setIsFocused] = useState(false);
    const [selected, setSelected] = useState(0);

    const inputRef = useRef(null);
    const shadowRef = useRef(null);

    const handleInputChange = (event) => {
        setSearchInput(event.target.value);
    };

    useEffect(() => {
        if(room === undefined){
            setSearchInput("");
        } else {
            setSearchInput(room.toLowerCase());
        }
    },[room]);

    useEffect(() => {
        if(searchInput === "none"){
            setSearchInput("");
        }
        if (searchInput === '' || !isFocused) {
            setResults([]);
            setLower("");
        } else {
            setSelected(0);
            const filteredResults = data.filter(item =>
                item.toLowerCase().startsWith(searchInput)
            );
            const newfilteredResults = data.filter(item => {
                // Convert item to lowercase and check if it includes the searchInput.
                const includesSearchInput = item.toLowerCase().includes(searchInput.toLowerCase());
                // Check if the item is not already in the results.
                const notInResults = !results.includes(item);
                // Return true if both conditions are met.
                return includesSearchInput && notInResults;
            });
            filteredResults.push(...newfilteredResults);
            if (filteredResults.length === 0) {
                filteredResults.push("no results found");
                setLower("");
            } else {
                if(filteredResults.length > 1){
                    if(filteredResults[0].toLowerCase().startsWith(searchInput.toLowerCase())){
                        setLower(filteredResults[0].toLowerCase());
                    } else {
                        setLower("");
                    }
                }
            }
            const firstSeven = filteredResults.slice(0, 7);
            setResults(firstSeven);
            console.log(firstSeven);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput, data]);

    function next(name){
        setSearchInput(name.toLowerCase());
        setLower("");
        setResults([]);
        onEnter(name);
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (results.length > 0) {
                next(results[selected]);
                inputRef.current.blur();
            }
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            event.preventDefault();
            if(selected === results.length-1){
                setSelected(0);
                if(results[0].toLowerCase().startsWith(searchInput.toLowerCase())){
                    setLower(results[0].toLowerCase());
                } else {
                    setLower("");
                }
        } else {
                setSelected(selected+1);
                if(results[0].toLowerCase().startsWith(searchInput.toLowerCase())){
                    setLower(results[selected+1].toLowerCase());
                } else {
                    setLower("");
                }
            }
        }   
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            event.preventDefault();
            if(selected === 0){
                setSelected(results.length-1);
                if(results[results.length-1].toLowerCase().startsWith(searchInput.toLowerCase())){
                    setLower(results[results.length-1].toLowerCase());
                } else {
                    setLower("");
                }
            } else {
                setSelected(selected-1);
                if(results[selected-1].toLowerCase().startsWith(searchInput.toLowerCase())){
                    setLower(results[selected-1].toLowerCase());
                } else {
                    setLower("");
                }
            }
        }   
        if (event.key === "Tab"){
            if (results.length > 0 && results[0] !== "no results found"){
                event.preventDefault();
                setSearchInput(results[selected].toLowerCase())
                setLower("");
            }
        }
    };

    function click(event){
        next(results[event.target.value])
        console.log(`routing url:${event.target.value}`)
    }

    function handleX(){
        setSearchInput('');
        setLower("");
        setResults([]);
    }

    function tabShadow(word){
        if(word===""){
            return 0;
        } else {
            const input = shadowRef.current;
            if(input){
                console.log(input.scrollWidth);
                return input.scrollWidth;
            }
        }
    }

    return (
        <div className="search-container">
            <input
                className={`search-bar ${!isFocused ? "center":""}`}
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                placeholder={!isFocused ? "search..." : ""}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                spellCheck="false"  
                ref={inputRef}
            />
            <div className={`shadow ${!isFocused ? "center":""} ${lower==="" ? "white":""}`}
                placeholder={lower}
                readOnly={true}
                ref={shadowRef} 
            >{lower==="" ? "." :lower}
                <img src={tab} alt="tab" className={`tab ${lower==="" ? "disappear":""}`} style={{right:`${tabShadow(lower)}px`}}/>
            </div>
            <img src={x} className="x" alt="x" onClick={handleX} />
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
                            <li key={index} value={index} className={index === selected ? "chosen" : ""} onClick={click}>
                                <span className="result non-match">{beforeMatch}</span>
                                <span className="result match">{matchText}</span>
                                <span className="result non-match">{afterMatch}</span>
                            </li>
                        );
                    })}                 
                </ul>
            )}
        </div>
    );
}

export default SearchBar;
