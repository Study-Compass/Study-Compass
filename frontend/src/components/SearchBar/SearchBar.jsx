import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';
import x from '../../assets/x.svg';

//need to add support for abbreviated versions
function SearchBar({ data, onEnter}) {
    const [searchInput, setSearchInput] = useState('');
    const [results, setResults] = useState([]);
    const [lower, setLower] = useState("")

    const [isFocused, setIsFocused] = useState(false);
    const [selected, setSelected] = useState(0);

    const inputRef = useRef(null);

    useEffect(() => {
        if(searchInput === "" || results[0]==="no results found"){
            setLower("");
        }else if(results.length>0){

            if(results[0]!="no results found"){
                setLower(results[0].toLowerCase())
            }
        }
    }, [results, searchInput]);


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
                {if(!results.includes(item)){
                    item.toLowerCase().includes(value) 
                }}
            );        
            filteredResults.push(...newfilteredResults);    
            if(filteredResults.length === 0){
                filteredResults.push("no results found");
            }
            const firstSeven = filteredResults.slice(0, 7);
            setResults(firstSeven);
            console.log(firstSeven);
        }
    };

    function next(name){
        setSearchInput(name.toLowerCase());
        setResults([]);
        onEnter(name);
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            if (results.length > 0) {
                next(results[selected]);
                inputRef.current.blur();
            }
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
            if(selected === results.length-1){
                setSelected(0);
            } else {
                setSelected(selected+1);
            }
        }   
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
            if(selected === 0){
                setSelected(results.length-1);
            } else {
                setSelected(selected-1);
            }
        }   
        if (event.key === "Tab"){
            if (results.length > 0 && results[0] != "no results found"){
                event.preventDefault();
                setSearchInput(results[0].toLowerCase())
            }
        }
    };

    function click(event){
        next(results[event.target.value])
        console.log(`routing url:${event.target.value}`)
    }

    function handleX(){
        setSearchInput('');
        setResults([]);
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
            <input className={`shadow search-bar ${!isFocused ? "center":""}`}
                placeholder={lower}
                readOnly={true}
            />
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
