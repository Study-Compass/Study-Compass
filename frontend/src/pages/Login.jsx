import React from 'react';
// import Register from '../components/Forms/Register/Register';
import LoginForm from '../components/Forms/LoginForm/LoginForm';
import Header from '../components/Header/Header';
import './Login.scss';
import logo from '../assets/red_logo.svg'

function Login(){
    return(
        <div className="main-login">
            <div className="block">
            </div>

            <div className="login-container">

                <img src={logo} alt="" className="logo"/>
            
                <LoginForm />
            </div>
            
        </div>
    );
}

export default Login;