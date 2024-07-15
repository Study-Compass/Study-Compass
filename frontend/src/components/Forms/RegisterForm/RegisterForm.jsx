import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Forms.css';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import circleWarning from '../../../assets/circle-warning.svg';
import { generalIcons } from '../../../Icons';



function RegisterForm() {
    const { isAuthenticated, googleLogin, login } = useAuth();
    const [valid, setValid] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [sent, setSent] = useState(false);
    const [loadContent, setLoadContent] = useState(false);
    const [errorText, setErrorText] = useState("");

    const googleLogo = generalIcons.google;

    let navigate = useNavigate();

    const location = useLocation();

    useEffect(() => {
        async function google(code) {
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
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        if (code) {
            setLoadContent(false);
            if (!sent) {
                google(code); //failsafe for double querying, still double querying, but it's fine
            }
            setSent(true);
            console.log("code: " + code);
        } else {
            setLoadContent(true);
        }
    }, [location]);


    useEffect(() => {
        if (isAuthenticated && isAuthenticated !== null) {
            console.log("logged in already");
            navigate('/room/none', { replace: true })
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (formData.email !== '' && formData.password !== '' && formData.username !== '') {
            setValid(true);
        } else {
            setValid(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.email, formData.password, formData.username]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await axios.post('/verify-email', { email: formData.email });
            if(response.data.data && response.data.data.result === "undeliverable"){
                setErrorText("Invalid Email. Please try again");
                return;
            }
        } catch (error){
            console.error("Email verification failed:", error);
            setErrorText("Invalid Username/Email or Password. Please try again");
            return;
        }
        try {
            const response = await axios.post('/register', formData);
            console.log(response.data);
            // Handle success (e.g., redirect to login page or auto-login)
            await login(formData);
            navigate('/onboard', { replace: true });
        } catch (error) {
            if(error.response.status === 400){
                setErrorText("Username or Email already exists");
            }
            // console.error('Registration failed:', error);
            // Handle errors (e.g., display error message)
        }
    }
    // codeResponse => responseGoogle1(codeResponse)
    const google = useGoogleLogin({
        onSuccess: () => { console.log("succeeded") },
        flow: 'auth-code',
        ux_mode: 'redirect',
        onFailure: () => { console.log("failed") },
    })

    function failed(message){
        navigate('/login');
        setErrorText(message);
    }

    function goToLogin() {
        navigate('/login');
    }

    if (!loadContent) {
        return ("");
    }

    return (
        <form onSubmit={handleSubmit} className='form'>
            <h1>Register</h1>
            {errorText !== "" && 
                <div className="error"
                    ><img src={circleWarning} alt="error"></img>
                    {errorText}
                </div>
            }

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
            <button type="submit" className={`button ${valid ? "active" : ""}`}>Register</button>
            <p className="already">Already have an account? <Link to="/login">Login</Link></p>
            <div className="divider">
                <hr />
                <p>or</p>
                <hr />
            </div>
            <button className="button google" onClick={() => google()}>Continue with Google<img src={googleLogo} alt="google" /></button>
        </form>
    );
}

export default RegisterForm;


