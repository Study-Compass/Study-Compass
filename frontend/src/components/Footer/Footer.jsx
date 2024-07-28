import React from 'react';
import './Footer.css';
import Github from '../../assets/Icons/Cute-Github.svg';


function Footer(){
    return(
        <div className="mini-footer">
            <p>© {new Date().getFullYear()} Study Compass</p> 
            <p>|</p>
            <p>MIT license</p>
            <p>|</p>
            <p className="githubText">Github</p>
            <a href="https://github.com/AZ0228/Study-Compass" className="github" ><img src={Github} alt="" className="github" /></a>
        </div>

    );
}

export default Footer;