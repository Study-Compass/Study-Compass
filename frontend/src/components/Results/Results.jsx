import React, {useRef, useEffect} from 'react';
import './Results.css';
import Result from './Result/Result.jsx';

import Loader from '../Loader/Loader.jsx';

function Results({ results, loadedResults, numLoaded, setNumLoaded, debouncedFetchData, contentState, changeURL, findNext}) {
    const resultRef = useRef(null);
    let scrollLoading = false;

    useEffect(() => {
        const container = resultRef.current;
        const handleScroll = () => {
          // Calculate if the scroll has reached the bottom of the container
          const scrollPosition = container.scrollTop + container.offsetHeight+100;
          const containerHeight = container.scrollHeight;
    
          // Check if the scroll has reached the bottom
          if (scrollPosition >= containerHeight) {
              if(!scrollLoading){
                console.log('Reached the bottom of the container');
                setTimeout(() => {              
                    setNumLoaded(numLoaded + 10);
                }, 500);
                console.log(numLoaded)
                scrollLoading = true;
            }
          }
        };
    
        // Add the scroll event listener to the container
        if (container) {
          container.addEventListener('scroll', handleScroll);
        }
      }, [contentState, numLoaded]);

    return (
        <ul className="time-results" ref={resultRef}>
        {loadedResults.map((result, index) => (
            <Result 
                key={index} 
                result={result} 
                debouncedFetchData={debouncedFetchData} 
                changeURL={changeURL}
                findNext={findNext}
            />
        ))}
        {!(loadedResults.length === results.length) ? <div className="loader-container"><Loader/></div> : ""}
        </ul>

    );
}

export default Results;