import React, { useState, useRef } from 'react';
import './Tags.css';
import { attributeIcons, selectedAttributeIcons } from '../../../Icons';
import useOutsideClick from '../../../hooks/useClickOutside';

function Tags({setSelected}){
    const [tagsState, setTagsState] = useState(true); //true for include, false for exclude
    const tags = ["windows", "outlets", "printer", "small desks"];

    const [include, setInclude] = useState([]);
    const [exclude, setExclude] = useState([]);


    const handleSelect = (type, tag) => {
        if (type === "include"){
            if (include.includes(tag)){
                setInclude(include.filter((item) => item !== tag));
            } else {
                setInclude([...include, tag]);
                if(exclude.includes(tag)){
                    setExclude(exclude.filter((item) => item !== tag));
                }
            }
        } else {
            if (exclude.includes(tag)){
                setExclude(exclude.filter((item) => item !== tag));
            } else {
                setExclude([...exclude, tag]);
                if(include.includes(tag)){
                    setInclude(include.filter((item) => item !== tag));
                }
            }
        }
    }

    const handleClear = () => {
        setInclude([]);
        setExclude([]);
    }
    
    const ref = useRef();

    useOutsideClick(ref, () => {
        setSelected(null);
    });



    return (
        <div className="sort-popup" ref={ref}>
            <div className="heading">
                <h1>Tags</h1>
                <p onClick={handleClear} className="clear">clear</p>
            </div>
            <label className="switch">
                <input type="checkbox" onChange={()=>{setTagsState(!tagsState)}}/>
                <div className="slider">
                    <span>include</span>
                    <span>exclude</span>
                </div>
            </label>
            <div className="tags-container">
                <div className={`tags-content ${tagsState ? "" : "next"}`}>
                    <div className="include">
                        {tags.map((tag, index) => {
                            return (
                                <div key={index} className={`option ${include.includes(tag) ? "selected" : ""}`} onClick={()=>{handleSelect("include",tag)}}>
                                    <img src={include.includes(tag) ? selectedAttributeIcons[tag]:attributeIcons[tag]} alt={tag}/>
                                    <p>{tag}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="exclude">
                        {tags.map((tag, index) => {
                            return (
                                <div key={index} className={`option ${exclude.includes(tag) ? "selected" : ""}`} onClick={()=>{handleSelect("exclude",tag)}}>
                                    <img src={exclude.includes(tag) ? selectedAttributeIcons[tag]:attributeIcons[tag]} alt={tag}/>
                                    <p>{tag}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Tags;