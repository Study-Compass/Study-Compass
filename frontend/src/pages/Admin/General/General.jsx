import React, {useEffect} from 'react';
import './General.scss';
import GradientHeader from '../../../assets/Gradients/ApprovalGrad.png';
import SiteHealth from './SiteHealth/SiteHealth';

function General({}){
    return(
        <div className="general">
            <img src={GradientHeader} alt="" className="grad" />
            <div className="simple-header">
                <h1>Administrator</h1>
            </div>
            <SiteHealth />
        </div>
    )
}

export default General;