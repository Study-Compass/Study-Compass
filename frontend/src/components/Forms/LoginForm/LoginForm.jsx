import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../Forms.css';
import google from '../../../assets/googleG.svg';
import useAuth from '../../../hooks/useAuth';

function LoginForm() {
    const { isAuthenticated, login } = useAuth();
    let navigate =  useNavigate();
    const [valid, setValid] = useState(false);
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });

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
        navigate('room/none')
        // Handle success (e.g., store the token and redirect to a protected page)
      } catch (error) {
        console.error('Login failed:', error);
        // Handle errors (e.g., display error message)
      }
    }

    function register(){
        navigate('/register');
    }
  
    return (
      <form onSubmit={handleSubmit}>
        <h1>Welcome Back!</h1>
        <div className="email">
            <p>Username/Email</p>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Valid username/email..." required />
        </div>
        <div className="password">
            <p>Password</p>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password..." required />
        </div>
        <button type="submit" className={`button ${valid ? "active":""}`}>Log In</button>
        <p className="already">Don’t have an account? <a href="/" className="register" onClick={register}>Register</a></p>
        <button type="button" className="button google">Continue with Google<img src={google} alt="google"/></button>
      </form>
    );
  }
  
  export default LoginForm;