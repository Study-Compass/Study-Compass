import React from 'react';
import Header from '../../components/Header/Header';
import './Password.scss';
import logo from '../../assets/red_logo.svg'
import PasswordForm from '../../components/Forms/PasswordForm/PasswordForm';

function Password(){
    return(
        <div className="main-password">
            <div className="block">
            </div>

            <div className="password-container">

            <img src={logo} alt="" className="logo"/>

            <PasswordForm />

            </div>
        </div>
    );

}


export default Password;