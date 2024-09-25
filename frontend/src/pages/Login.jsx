import React from 'react';
// import Register from '../components/Forms/Register/Register';
import LoginForm from '../components/Forms/LoginForm/LoginForm';
import Header from '../components/Header/Header';
import './Login.scss';

function Login(){
    return(
        <div className="main login">
            <Header />
            <div className="login-container">
                <LoginForm />
            </div>
            <div className="footer"></div>
        </div>
    );
}

export default Login;