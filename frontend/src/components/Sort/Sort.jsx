import React, { useState, useRef } from 'react';
import './Sort.css';
import useOutsideClick from '../../hooks/useClickOutside';

import Tags from '../../assets/Icons/sort/Tags.svg';
import SortBy from '../../assets/Icons/sort/SortBy.svg';
import More from '../../assets/Icons/sort/More.svg';
import TagsSelected from '../../assets/Icons/sort/TagsSelected.svg';
import SortBySelected from '../../assets/Icons/sort/SortBySelected.svg';
import MoreSelected from '../../assets/Icons/sort/MoreSelected.svg';
import ChevronDown from '../../assets/Icons/sort/ChevronDown.svg';
import ChevronUp from '../../assets/Icons/sort/ChevronUp.svg';

import TagsPopup from './Tags/Tags';

function Sort({query, searchAttributes, setSearchAttributes, searchSort, setSearchSort, onSearch}) {
    const [selected, setSelected] = useState(null);
    console.log(query);
    const handleSelect = (select) => {
        if(selected === select){
            setSelected(null);
        } else {
            setSelected(select);
        }
    };  

    const onApply = (tags) => {
        setSelected(null);
        onSearch(query, tags, searchSort);
    }

    return (
        <div className="sort-row">
            {selected === "tags" ? <TagsPopup setSelected={setSelected} searchAttributes={searchAttributes} setSearchAttributes={setSearchAttributes} onApply={onApply}/>: ""}
            <div className={`tags ${selected === 'tags' ? "selected": ""}`} onClick={()=>{handleSelect('tags')}}>
                <img src={selected === 'tags' ? TagsSelected : Tags} alt="" />
                <p>Tags</p>
                <img src={selected === 'tags' ? ChevronUp : ChevronDown} alt="" />
            </div>
            <div className={`sort-by ${selected === 'sort' ? "selected" : ""}`} onClick={()=>{handleSelect('sort')}}>
                <img src={selected === 'sort' ? SortBySelected : SortBy} alt="" />
                <p>Sort</p>
                <img src={selected === 'sort' ? ChevronUp : ChevronDown} alt="" />
            </div>
            <div className={`more ${selected === 'more' ? "selected" : ""}`} onClick={()=>{handleSelect('more')}}>
                <img src={selected === 'more' ? MoreSelected : More} alt="" />
                <p>More</p>
                <img src={selected === 'more' ? ChevronUp : ChevronDown} alt="" />
            </div>
        </div>
    );
}

export default Sort;