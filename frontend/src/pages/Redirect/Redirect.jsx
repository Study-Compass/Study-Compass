import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function Redirect() {
    let navigate =  useNavigate();

    useEffect(() => {
        window.location.href = "https://study-compass.github.io/Study-Compass-Documentation/";
    })
    return "";
}

export default Redirect;
