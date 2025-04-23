import React, { useEffect, useState } from 'react';
import './BadgeGrant.scss';

const BadgeGrant = ({badgeGrant}) => {
    const today = new Date();
    const validFrom = new Date(badgeGrant.validFrom);
    const validTo = new Date(badgeGrant.validTo);
    const isInactive = (today < validFrom || today > validTo);
    return (
        <div className="badge-grant">
            <div className={`mock-badge visible ${isInactive ? "inactive" : "active"}`} style={{backgroundColor: badgeGrant.badgeColor}}>
                {badgeGrant.badgeContent}
            </div>
            <div className="validfrom">
                {badgeGrant.validFrom}
            </div>

        </div>
    )
}

export default BadgeGrant;
