import React, {useEffect, useState} from 'react';
import Org from './Org.jsx';
import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';

const OrgDisplay = () => {
    const orgName = useParams().name;
    const orgData = useFetch(`/get-org-by-name/${orgName}`);

    return (
        <>
            {/* {
                !orgData.loading && <Org org={orgData.data.org}/>
            }  */}

            {
                !orgData.loading && orgData.data && <Org orgData={orgData.data}/>
            }
        </>
    );
};

export default OrgDisplay;
