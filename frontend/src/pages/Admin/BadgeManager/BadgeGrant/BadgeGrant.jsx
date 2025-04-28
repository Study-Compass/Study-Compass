import React, { useEffect, useState } from 'react';
import './BadgeGrant.scss';
import PulseDot from '../../../../components/Interface/PulseDot/PulseDot';
import postRequest from '../../../../utils/postRequest';
import { useNotification } from '../../../../NotificationContext';
import Popup from '../../../../components/Popup/Popup';
import ActivateBadge from '../ActivateBadge/ActivateBadge';
import MockBadge from '../../../../components/Interface/MockBadge/MockBadge';

const BadgeGrant = ({badgeGrant}) => {
    const { addNotification } = useNotification();

    const today = new Date();
    const validFrom = new Date(badgeGrant.validFrom);
    const validTo = new Date(badgeGrant.validTo);
    const isInactive = (today < validFrom || today > validTo);
    const [activatePopup, setActivatePopup] = useState(false);
    const [addPopup, setAddPopup] = useState(false);
    const [activateDays, setActivateDays] = useState(0);

    async function onActivateDays(){
        
    }

    return (
        <>
            <Popup onClose={()=>setActivatePopup(false)} isOpen={activatePopup} customClassName='narrow-content'>
                {/* activate popup */}  
                {
                    badgeGrant && <ActivateBadge badgeGrant={badgeGrant}/>
                }
            </Popup>
            <div className="badge-grant">
                <MockBadge badgeColor={badgeGrant.badgeColor} badgeContent={badgeGrant.badgeContent} isInactive={isInactive}/>
                <div className={`badge-status ${isInactive ? 'inactive' : 'active'}`}>
                    <PulseDot color={isInactive ? 'var(--darkborder)' : 'var(--green)'} pulse={!isInactive} size={'7px'}/>
                    <p>{isInactive ? 'inactive' : 'active'}</p>
                </div>
                {
                    isInactive ? 
                    <div className="inactive-data">
                        <p>
                            last active:<br/>{validTo.toDateString()}
                        </p>
                    </div>
                    :
                    <div className="inactive-data">
                        <p>
                            active until:<br/>{validTo.toDateString()}
                        </p>
                    </div>
                }

                <button className={`badge-button ${isInactive ? 'inactive' : 'active'}`} onClick={()=>setActivatePopup(true)}>
                    <p>{isInactive ? 'activate' : 'deactivate'}</p>
                </button>

            </div>
        </>
    )
}

export default BadgeGrant;
