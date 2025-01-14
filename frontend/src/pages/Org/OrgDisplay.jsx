import React, {useEffect, useState} from 'react';
import Org from './Org/Org';
import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';

const OrgDisplay = () => {
    const orgName = useParams().name;
    const orgData = useFetch(`/get-org-by-name/${orgName}`);

    const org = {
        "_id": {
          "$oid": "675ce4871958af1a0199505e"
        },
        "org_name": "Study Compass Devs",
        "org_profile_image": "/Logo.svg",
        "org_description": "asdasd",
        "positions": [
          "chair",
          "officer",
          "member"
        ],
        "weekly_meeting": null,
        "owner": {
          "$oid": "65f474445dca7aca4fb5acaf"
        },
        "__v": 0
      }


    return (
        <>
            {
                !orgData.loading && <Org org={orgData.data.org}/>
            }
        </>
    );
};

export default OrgDisplay;
