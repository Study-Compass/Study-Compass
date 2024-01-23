import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Forms.css';
import googleLogo from '../../../assets/googleG.svg';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';


function RegisterForm() {
  const { isAuthenticated, googleLogin } = useAuth();
  const [valid, setValid] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  
  let navigate = useNavigate();

  const responseGoogle = async (response) => {
    try {
      const tokenId = response.tokenId;
      const res = await fetch('/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenId }),
      });
      const token = await res.json();
      googleLogin(token.data.token);

    } catch (error) {
      console.error('Error sending token to backend:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated){
      console.log("logged in already");
      navigate('room/none')
    }
  },[isAuthenticated, navigate]);

  useEffect(() => {
    if (formData.email !== '' && formData.password !== '' && formData.username !== ''){
        setValid(true);
    } else {
        setValid(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[formData.email, formData.password, formData.username]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/register', formData);
      console.log(response.data);
      // Handle success (e.g., redirect to login page or auto-login)
    } catch (error) {
      console.error('Registration failed:', error);
      // Handle errors (e.g., display error message)
    }
  }

  const google = useGoogleLogin({
      onSuccess: tokenResponse => console.log(tokenResponse),
      onFailure: () => {console.log("failed")},
  })
  function login(){
    navigate('/');
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Register</h1>
      <div className="username">
        <p>Username</p>
        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" required />
      </div>
      <div className="email">
        <p>Email</p>
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
      </div>
      <div className="password">
        <p>Password</p>
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
      </div>
      <button type="submit" className={`button ${valid ? "active":""}`}>Register</button>
      <p className="already">Already have an account? <a href="/" className="register" onClick={login}>Login</a></p>
      <div className="divider">
            <hr/>
            <p>or</p>
            <hr/>
        </div>
      <button className="button google" onClick={() => google()}>Continue with Google<img src={googleLogo} alt="google"/></button>
      {/* <GoogleLogin
        clientId="639818062398-k4qnm9l320phu967ctc2l1jt1sp9ib7p.apps.googleusercontent.com"
        render={renderProps => (
          <button 
            type="button" 
            className="button google"
            onClick={renderProps.onClick} // This line is crucial
            disabled={renderProps.disabled}
          >Continue with Google<img src={google} alt="google"/></button>
        )}
        onSuccess={responseGoogle}
        onFailure={responseGoogle}
        cookiePolicy={'single_host_origin'}
      /> */}
      {/* <GoogleLogin
        // clientId="639818062398-k4qnm9l320phu967ctc2l1jt1sp9ib7p.apps.googleusercontent.com"
        onSuccess={credentialResponse => {
          console.log(credentialResponse);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
        useOneTap
        className="google-button"
      /> */}

    </form>
  );
}

export default RegisterForm;