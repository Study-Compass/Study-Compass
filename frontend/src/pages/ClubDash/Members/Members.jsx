import React, { useEffect, useState } from 'react';
import './Members.scss';
import profile from '../../../assets/defaultAvatar.svg';



function Members({expandedClass}){
    return (
        <div className={`dash ${expandedClass}`}>
            <div className="members">
                <h1>Membership Managment</h1>
            <div className="content">
                <div className = "topbox">
                    <div className="selected">
                        <h2>members</h2>
                    </div>
                    <h2>officers</h2>
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
    )
}


export default Members;
