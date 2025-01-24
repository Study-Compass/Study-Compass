import React, { useEffect, useState } from 'react';
import './Officers.scss';
import profile from '../../../assets/defaultAvatar.svg';


function Officers(expandedClass){



    return(
        <div className={`dash ${expandedClass}`}>
        <div className="members">
            <h1>Officer Managment</h1>
        <div className="content">
            <div className = "topbox">
                <div className='selected'>
                    <h2>members</h2>
                </div>
                <h2 >officers</h2>
                {/* For officers might need to create new componenet */}
            </div>
            <div className={`'container'`}>
            <div className='list'>
                <img src={profile} alt="" />
                <div className='box'>
                    <h3>James Liu officer</h3>
                    <h4>@username</h4>
                </div>
            </div>
            <div className='list'>
                <img src={profile} alt="" />
                <div className='box'>
                    <h3>James Liu</h3>
                    <h4>@username</h4>
                </div>
            </div>
            <div className='list'>
                <img src={profile} alt="" />
                <div className='box'>
                    <h3>James Liu</h3>
                    <h4>@username</h4>
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>

    )
}


export default Officers;