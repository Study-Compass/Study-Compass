import React, { useState, useEffect } from 'react';
import './Filter.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function Filter({options, selected, setSelected, label}){
    const [open, setOpen] = useState(false);

    useEffect(()=>{
        const close = (e) => {
            if(e.target.closest('.filter') === null){
                setOpen(false);
            }
        }
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    },[]);

    return (
        <div className="filter">
            <div className="filter-label" onClick={()=>setOpen(!open)}>
                <Icon icon="cuida:filter-outline"  />
                <span>{label}</span>
            </div>
            <div className={`filter-options ${open && "open"}`}>
                {
                    options.map((option, i) => (
                        <div key={i} className={`filter-option ${selected === option && "selected"}`} onClick={()=>setSelected(option)}>
                            {option}
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Filter;
