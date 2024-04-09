import React, { useState, useEffect, useRef }from "react";
import './SortBy.css';
import useOutsideClick from '../../../hooks/useClickOutside';

function SortBy({setSelected, sortBy, setSortBy}){
    const [sort, setSort] = useState(sortBy);

    useEffect(()=>{
        setSort(sortBy);
    }, [sortBy]);

    const handleSelect = (type) => {
        setSort(type);
        // setSortBy(type);
        // setSelected(null);
    }

    const ref = useRef();

    useOutsideClick(ref, () => {
        setSelected(null);
    }, ["sort-by"]);

    return (
        <div className="sort-popup" ref={ref}>
            <div className="heading">
                <h1>Sort by</h1>
            </div>
            <div className="sort-options">
                <div className={sort === "name" ? "option selected" : "option"} onClick={()=>handleSelect("name")}>
                    <p>Name</p>
                </div>
                <div className={sort === "location" ? "option selected" : "option"} onClick={()=>handleSelect("location")}>
                    <p>Location</p>
                </div>
                <div className={sort === "capacity" ? "option selected" : "option"} onClick={()=>handleSelect("capacity")}>
                    <p>Capacity</p>
                </div>
                <div className={sort === "availability" ? "option selected" : "option"} onClick={()=>handleSelect("availability")}>
                    <p>Availability</p>
                </div>
            </div>
            <button className={`button ${sort !== sortBy && "active"}`} style={{height:'40px'}}>apply</button>
        </div>

        
    )
}

export default SortBy