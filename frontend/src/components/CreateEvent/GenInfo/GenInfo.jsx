import React, { useState, useEffect } from 'react';
import '../CreateComponents.scss'
import './GenInfo.scss'

function GenInfo(){

    return(
        <div className="gen-info create-component">
            <h1>general information</h1>
            <div className="col-container">
                <div className="col input-col">
                    <div className="input-field">
                        <p>Title</p>
                        <input type="text" className="" />
                    </div>
                    <div className="input-field">
                        <p>Description</p>
                        <textarea type="text" className="" />
                    </div>
                    <div className="input-field">
                        <p>Event Type</p>
                        <select className="">
                            <option value="study">study event</option>
                            <option value="campus">campus event</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GenInfo;

