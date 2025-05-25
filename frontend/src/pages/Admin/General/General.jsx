import React, {useEffect} from 'react';
import './General.scss';
import GradientHeader from '../../../assets/Gradients/ApprovalGrad.png';
import SiteHealth from './SiteHealth/SiteHealth';
import SimpleAnalyticsChart from '../../../components/Analytics/VisitsChart/SimpleAnalyticsChart';
import HeaderContainer from '../../../components/HeaderContainer/HeaderContainer';

function General({}){
    return(
        <div className="general">
            <img src={GradientHeader} alt="" className="grad" />
            <div className="simple-header">
                <h1>Administrator</h1>
            </div>
            <div className="general-content">
                <SiteHealth />
                <HeaderContainer header='weekly analytics' icon="mage:chart-up-fill">
                    <div className="analytics-container">
                        <SimpleAnalyticsChart endpoint='visits' heading='Visits' color='#7CCF6A' />
                        <SimpleAnalyticsChart endpoint='users' heading='Users' color='#7CCF6A' />
                        <SimpleAnalyticsChart endpoint='searches' heading='Searches' color='#7CCF6A' />

                    </div>
                </HeaderContainer>
            </div>
        </div>
    )
}

export default General;