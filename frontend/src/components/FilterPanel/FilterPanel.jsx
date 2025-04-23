import React from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';
import './FilterPanel.scss';

function FilterPanel({ filterOptions, filters, onFilterToggle }) {
    return (
        <div className="filters">
            <div className="header">                       
                <Icon icon="cuida:filter-outline" />
                <span>filters</span>
            </div>
            <div className="filter-content">
                {Object.keys(filterOptions).map((key, i) => {
                    const optionData = filterOptions[key];
                    const field = optionData.field;
                    return (
                        <div className="filter-section" key={i}>
                            <p>{optionData.label}</p>
                            <div className="filter-options">
                                {optionData.options.map((option, j) => {
                                    const optionValue = optionData.optionValues[j];
                                    const isSelected = filters[field].includes(optionValue);
                                    return (
                                        <div
                                            key={j}
                                            className={`filter-option ${isSelected ? 'selected' : ''}`}
                                            onClick={() => onFilterToggle(field, optionValue)}
                                        >
                                            {option}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default FilterPanel; 