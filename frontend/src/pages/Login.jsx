import React, { useEffect, useState } from 'react';
import Register from '../components/Forms/Register/Register';
import LoginForm from '../components/Forms/LoginForm/LoginForm';
import Header from '../components/Header/Header';

function Login(){
    return(
        <div class="main">
            <Header />
            <LoginForm />
        </div>
        
    );
}

export default Login;