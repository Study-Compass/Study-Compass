import React, { useState, useEffect } from 'react';
import './ClubForms.scss';
import { useFetch } from '../../../hooks/useFetch';

const ClubForms = ({ org }) => {
    const { data: forms, loading, error } = useFetch(`/${org._id}/forms`);
    return (
        <div className="club-forms">
            <h1>Club Forms</h1>
        </div>
    )
}

export default ClubForms;