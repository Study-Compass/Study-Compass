import React, { useEffect, useState } from 'react';
import Register from '../components/Forms/Register/Register';
import LoginForm from '../components/Forms/LoginForm/LoginForm';

function Login(){
    return(
        <div>
            <h1>Register</h1>
            <Register />
            <h1>Login</h1>
            <LoginForm />
        </div>
        
    );
}

export default Login;