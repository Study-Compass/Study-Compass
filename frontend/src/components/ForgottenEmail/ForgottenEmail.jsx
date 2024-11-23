import React, { useEffect, useState } from 'react';
import logo from '../../assets/red_logo.svg'
import './ForgottenEmail.scss';
import left from '../../assets/TopLeftEmailGradient.png'
import right from '../../assets/TopRightEmailGradient.png'
import {compile} from 'sass';

function ForgottenEmail() {

    const cssString=`
    
.forgotten-email{
    height:100vh;
    max-height:100%;
    width:100%;
    
    .logo , .header{
        max-height:100%;
        width:100%;
    
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
    
    }

    .header-img{
        display: flex;
        .logo{
            height: 50px;
            padding-top: 20px;
      
        }
    
        .gradient{
            height: 200px;
            position: absolute;
            z-index: -1;
            &.tl{
                top:0;
                left:0;
            }
            &.tr{
                top:0;
                right:0;
            }
        }

    }

    .header{
        padding-top: 50px;
    }

    .email-content{
        font-family: Inter, sans-serif;
        font-size: 14px;
        position: relative;
        padding: 0 100px;
        font-weight: 500;

        .password-link{
            color: var(--blue);
        }

    }

}

@media (max-width: 500px){
  .forgotten-email{
    
    .header{
        font-size: 20px;
        padding-top: 30px;
     }

    .header-img{
        .logo{
            height: 35px;
            padding-top: 10px;
      
        }

        .gradient{
            height: 100px;
            position: absolute;
            &.tl{
                top:0;
                left:0;
            }
            &.tr{
                top:0;
                right:0;
            }
        }

    }

    .email-content{
        font-size: 14px;
        padding: 0px 50px;

    }

  }

}

    `


    return (
        <div className="forgotten-email" style={{cssText: cssString}}>
            <div className="header-img">
            <img src={left} alt="" className="gradient tl"/>   
            <img src={logo} alt="" className="logo"/>
            <img src={right} alt="" className="gradient tr"/>


            </div>
            <h1 className="header">Forgotten your password?</h1>

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