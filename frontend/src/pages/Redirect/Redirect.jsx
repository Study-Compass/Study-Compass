import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function Redirect() {
    let navigate =  useNavigate();

    useEffect(() => {
        
        navigate('/room/none');
    })
    return "";
}

export default Redirect;
