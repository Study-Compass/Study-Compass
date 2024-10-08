import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function QR(){
    //get params
    const {id} = useParams();
    const navigate = useNavigate();

    
    useEffect(()=>{
        //get qr from url
        try{
            const visited = localStorage.getItem('hasVisited');
            if(!visited){
                axios.post('/qr', {name: id, repeat: false}).then(response => {console.log(response)});
            } else {
                axios.post('/qr', {name: id, repeat: true}).then(response => {console.log(response)});
            }
        } catch(e){
            navigate('/');
        }
        //redirect to /
        navigate('/');
    },[])

    return(
        <div>
        </div>
    )
}

export default QR;