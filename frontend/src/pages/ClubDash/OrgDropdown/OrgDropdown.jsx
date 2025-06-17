import React from 'react';
import { Icon } from '@iconify-icon/react';
import './OrgDropdown.scss';

function OrgDropdown({ 
    showDrop, 
    setShowDrop, 
    user, 
    currentOrgName, 
    onOrgChange 
}) {
    return (
        <div className="org-dropdown" onClick={() => setShowDrop(!showDrop)}>
            <img src={user?.clubAssociations?.find(org => org.org_name === currentOrgName)?.org_profile_image} alt="" />
            <h1>{currentOrgName}</h1>
            <Icon 
                icon={`${showDrop ? "ic:round-keyboard-arrow-up" : "ic:round-keyboard-arrow-down"}`} 
                width="24" 
                height="24" 
            />
            {showDrop && (
                <div className="dropdown">
                    {user?.clubAssociations?.map((org) => (
                        <div 
                            className={`drop-option ${org.org_name === currentOrgName && "selected"}`} 
                            key={org._id} 
                            onClick={() => onOrgChange(org)}
                        >
                            <img src={org.org_profile_image} alt="" />
                            <p>{org.org_name}</p>
                        </div>
                    ))}
                    <button className="create-org">
                        <p>new organization</p>
                    </button>
                </div>
            )}
        </div>
    );
}

export default OrgDropdown; 