import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../Forms.scss';
import { generalIcons } from '../../../Icons';
import useAuth from '../../../hooks/useAuth';
import circleWarning from '../../../assets/circle-warning.svg';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import Flag from '../../Flag/Flag';

function LoginForm() {
    const { isAuthenticated, login, googleLogin } = useAuth();
    let navigate =  useNavigate();
    const [valid, setValid] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errorText, setErrorText] = useState("");
    const [loadContent, setLoadContent] = useState(false);
    const [email, setEmail] = useState(false);
    
    const location = useLocation();
    
    const googleLogo = generalIcons.google;
    const from = location.state?.from?.pathname || '/room/none';
    console.log(from);
    useEffect(() => {
      if (isAuthenticated){
        console.log("logged in already");
        navigate('/room/none')
      }
    },[isAuthenticated, navigate]);

    useEffect(() => {
        // const token = localStorage.getItem('token'); // or sessionStorage
        if (formData.email !== '' && formData.password !== ''){
            setValid(true);
        } else {
            setValid(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[formData.email, formData.password]);
    
    
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await login(formData);
        console.log("logged in");
        navigate(from,{ replace: true })
        // Handle success (e.g., store the token and redirect to a protected page)
      } catch (error) {
        console.error('Login failed:', error);
        setErrorText("Invalid Username/Email or Password. Please try again");
        // Handle errors (e.g., display error message)
      }
    }

    function debounce(func, wait) { //move logic to other file
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }


    useEffect(() => {
        async function googleLog(code) {
            try{
                const codeResponse = await googleLogin(code, false);
                console.log("codeResponse: " + codeResponse);
            } catch (error){
                if(error.response.status  === 409){
                    failed("Email already exists");
                } else {
                    console.error("Google login failed:", error);
                    failed("Google login failed. Please try again");
                }
            }
        }
        // Extract the code from the URL
        console.log(location);
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const debouncedGoogle = debounce(googleLog, 500);
        if (code) {
            setLoadContent(false);
            debouncedGoogle(code); 
            console.log("code: " + code);
        } else {
            setLoadContent(true);
        }

    }, [location]);

    const google = useGoogleLogin({
        onSuccess: () => { console.log("succeeded") },
        flow: 'auth-code',
        ux_mode: 'redirect',
        onFailure: () => {failed("Google login failed. Please try again")},
    })

    function failed(message){
        navigate('/login');
        setErrorText(message);
    }
    function register(){
        navigate('/register');
    }

    if (!loadContent) {
        return ("");
    }
  
    
    
    return (
      <form onSubmit={handleSubmit} className='form'>
          <h1>Welcome Back!</h1>
        {errorText !== "" && 
            <Flag text={errorText} img={circleWarning} color={"#FD5858"} primary={"rgba(250, 117, 109, 0.16)"} accent={"#FD5858"} /> 
        }
        <button type="button" className="button google" onClick={() => google()}>Continue with Google<img src={googleLogo} alt="google"/></button>

        <div className="divider">
            <hr/>
            <p>or</p>
            <hr/>
        </div>

        <div className={`email-form ${email ? "disappear-show" : ""}`}>
            
            <div className="login-button">
                <button className={`show-email button active ${email ? "disappear-show" : ""}`} onClick={(e)=>{e.preventDefault();setEmail(true)}}>
                    Login with Email
                </button>
                <p className={`already ${email ? "disappear-show" : ""}`}>Don’t have an account? <Link to="/register" state={{from:location.state?.from || "/room/none"}} replace>Register</Link></p>
            </div>

            <div className="form-content" >
                <div className="email">
                    <p>Username/Email</p>
                    <input type="text" name="email" value={formData.email} onChange={handleChange} placeholder="Valid username/email..." required />
                </div>
                <div className="password">
                    <p>Password</p>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password..." required />
                </div>
                <button type="submit" className={`button ${valid ? "active":""}`}>Log In</button>
                <p className="already">Don’t have an account? <Link to="/register" state={{from:location.state?.from || "/room/none"}}>Register</Link></p>
            </div>
        </div>

      </form>
    );
  }
  
  export default LoginForm;