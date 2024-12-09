import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function Week({height, changeToDay}){
    return(
        <>
            <div className="header">
                <div className="time-period">
                    <div className="arrows">
                        <Icon icon="charm:chevron-left" />
                        <Icon icon="charm:chevron-right" />
                    </div>
                    <h1>dec</h1>
                </div>
            </div>
            <div className="week">
                Week
            </div>

        </>
    )
}

export default Week;