import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../Forms.css';
import googleLogo from '../../../assets/googleG.svg';
import useAuth from '../../../hooks/useAuth';
import circleWarning from '../../../assets/circle-warning.svg';
import { useGoogleLogin } from '@react-oauth/google';


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

    const location = useLocation();


    useEffect(() => {
      if (isAuthenticated){
        console.log("logged in already");
        navigate('room/none')
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
        navigate('/room/none',{ replace: true })
        // Handle success (e.g., store the token and redirect to a protected page)
      } catch (error) {
        console.error('Login failed:', error);
        setErrorText("Invalid Username/Email or Password. Please try again");
        // Handle errors (e.g., display error message)
      }
    }

    useEffect(() => {
        async function google(code) {
            const codeResponse = await googleLogin(code);
            console.log("codeResponse: " + codeResponse);
        }
        // Extract the code from the URL
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        if (code) {
            setLoadContent(false);
            google(code); //failsafe for double querying, still double querying, but it's fine
            console.log("code: " + code);
        } else {
            setLoadContent(true);
        }
    }, [location]);



    const google = useGoogleLogin({
        onSuccess: () => { console.log("succeeded") },
        flow: 'auth-code',
        ux_mode: 'redirect',
        onFailure: () => { console.log("failed") },
    })

    function register(){
        navigate('/register');
    }

    if (!loadContent) {
        return ("");
    }
  
    return (
      <form onSubmit={handleSubmit}>
        <h1>Welcome Back!</h1>
        {errorText !== "" && 
            <div className="error"
                ><img src={circleWarning} alt="error"></img>
                {errorText}
            </div>
        }
        <div className="email">
            <p>Username/Email</p>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Valid username/email..." required />
        </div>
        <div className="password">
            <p>Password</p>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password..." required />
        </div>
        <button type="submit" className={`button ${valid ? "active":""}`}>Log In</button>
        <p className="already">Don’t have an account? <Link to="/register" >Register</Link></p>
        <div className="divider">
            <hr/>
            <p>or</p>
            <hr/>
        </div>
        <button type="button" className="button google" onClick={() => google()}>Continue with Google<img src={googleLogo} alt="google"/></button>
      </form>
    );
  }
  
  export default LoginForm;