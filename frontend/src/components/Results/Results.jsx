import React, {useRef, useEffect} from 'react';
import './Results.css';

import { Img } from 'react-optimized-image';

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
            <li 
                key={result.room.name} 
                value={result.room.name} 
                onMouseOver={() => {debouncedFetchData(result.room._id)}} 
                onMouseLeave={()=>{debouncedFetchData("none")}}
                onClick={() => {changeURL(result.room.name)}}
            >
                <div className="image">
                    {result.room.image ? <img src={`${process.env.PUBLIC_URL}${result.room.image}`} alt="classroom" width={100} height={75} />:""}
                </div>
                <div className="result-info">
                    <h2>{result.room.name.toLowerCase()}</h2>
                    {contentState !== "calendarSearch" ? 
                        <div className="free-until">
                            <div className="dot">
                                <div className="outer-dot"></div>
                                <div className="inner-dot"></div>
                            </div>
                            free { result ? findNext(result.data.weekly_schedule).message : ''}
                        </div> 
                    : ""}
                </div>
            </li>
        ))}
        {!(loadedResults.length === results.length) ? <div className="loader-container"><Loader/></div> : ""}
        </ul>

    );
}

export default Results;