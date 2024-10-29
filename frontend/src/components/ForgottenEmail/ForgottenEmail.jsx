import React, { useEffect, useState } from 'react';
import logo from '../../assets/red_logo.svg'
import './ForgottenEmail.scss';
import left from '../../assets/TopLeftEmailGradient.png'
import right from '../../assets/TopRightEmailGradient.png'




function ForgottenEmail() {

    return (
        <div className="forgotten-email">
            <div className="header-img">
            <img src={left} alt="" className="gradient tl"/>   
            <img src={logo} alt="" className="logo"/>
            <img src={right} alt="" className="gradient tr"/>


            </div>
            <h1 className="header">Study Compass Password Reset</h1>

            <h2 className="email-content">
                <div className="greeting">
                    Hi James,
                    
                </div>
                <div className="body">
                    <br />It looks like you requested a password reset for your Study Compass account. No worries, we're here to help you get back on track!
                    <br />
                    <br />To reset your password, please click on the link below:
                    <br />
                    <br />

                    <div className="password-link">
                    [Reset Password Link]
                    </div>
                
                    <br />For security reasons, this link will expire in 24 hours. If you didn’t request this password reset, you can ignore this email—your password will stay the same, and your account will remain secure.
                    <br />
                    <br />Happy studying,
                    <br />The Study Compass Team

                </div>




            </h2>


        </div>
    );

}

export default ForgottenEmail;