import React, { useState } from 'react';
import './SearchBar.css';

//need to add support for abbreviated versions
function SearchBar({ data }) {
    const [searchInput, setSearchInput] = useState('');
    const [results, setResults] = useState([]);

    const handleInputChange = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchInput(value);

        if (value === '') {
            setResults([]);
        } else {
            const filteredResults = data.filter(item =>
                item.toLowerCase().startsWith(value)
            );
            if(filteredResults.length === 0){
                const newfilteredResults = data.filter(item =>
                    item.toLowerCase().includes(value)
                );        
                filteredResults.push(...newfilteredResults);    
            }
            if(filteredResults.length === 0){
                filteredResults.push("no results found");
            }
            setResults(filteredResults);
        }
    };

    return (
        <div className="search-container">
            <input
                className="search-bar"
                type="text"
                value={searchInput}
                onChange={handleInputChange}
                placeholder="Search..."
            />
            {results.length > 0 && (
                <ul>
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
                            <li key={index}>
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
