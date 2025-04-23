import React from 'react';
import './OrgResult.scss'
import { Link } from 'react-router-dom';

const OrgResult = ({org}) => {
    return (
        <Link to={`/org/${org.org_name}`} className="org-result">
            <img src={org.org_profile_image} alt="" />
            <div className="info">
                <h3>{org.org_name}</h3>
                <p>{org.org_description}</p>
            </div>
        </Link>
    )
};

export default OrgResult;