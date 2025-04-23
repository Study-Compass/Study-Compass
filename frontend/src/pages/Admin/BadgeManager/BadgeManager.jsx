import React, {useEffect} from 'react';
import './BadgeManager.scss';
import { useFetch } from '../../../hooks/useFetch';
import CreateButton from '../../../components/CreateButton/CreateButton';
import BadgeGrant from './BadgeGrant/BadgeGrant';

const BadgeManager = ({}) => {
    const badgeGrants = useFetch('/get-badge-grants');
    return (
        <div className="badge-manager">
            <CreateButton text="create new badge grant" handleEventClick={()=>{}} color='red' row='true'/>
            <div className="badge-grants">
                {
                    badgeGrants.data && badgeGrants.data.badgeGrants?.map((badgeGrant, index) => <BadgeGrant key={`${index}-badge-grant`} badgeGrant={badgeGrant}/>)
                }
            </div>
        </div>
    );
}

export default BadgeManager;