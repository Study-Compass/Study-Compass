import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Forms.scss';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import circleWarning from '../../../assets/circle-warning.svg';
import { generalIcons } from '../../../Icons';
import Flag from '../../Flag/Flag';
import Juice from 'juice';
import ForgottenEmail from '../../ForgottenEmail/ForgottenEmail';
import ReactDOMServer from 'react-dom/server';


function PasswordForm() {

    const { isAuthenticated, googleLogin, login } = useAuth();
    const [valid, setValid] = useState(false);
    const [formData, setFormData] = useState({
        email: ''
    });
    const [sent, setSent] = useState(false);
    const [loadContent, setLoadContent] = useState(false);
    const [errorText, setErrorText] = useState("");
    const [email, setEmail] = useState(false);

    const [sentForgot, setSentForgot] = useState(false);

    const googleLogo = generalIcons.google;

    let navigate = useNavigate();

    const location = useLocation();

    useEffect(() => {
        async function google(code) {
            try{
                const codeResponse = await googleLogin(code, true);
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
        if (formData.email !== '' ) {
            setValid(true);
        } else {
            setValid(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.email]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const generateEmailHTML = () => {
        // Render the React component to a static HTML string
        const html = ReactDOMServer.renderToStaticMarkup(<ForgottenEmail />);
        // Inline the CSS for email compatibility
        return Juice(html);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const emailHTML = generateEmailHTML();
        //copy emailHTML to clipboard
        navigator.clipboard.writeText(emailHTML);


        // try{
        //     const response = await axios.post('/verify-email', { email: formData.email });
        //     if(response.data.data && response.data.data.result === "undeliverable"){
        //         setErrorText("Invalid Email. Please try again");
        //         return;
        //     }
        // } catch (error){
        //     console.error("Email verification failed:", error);
        //     setErrorText("Invalid Username/Email or Password. Please try again");
        //     return;
        // }
        // try {
        //     setFormData({email : ""});
        //     setSentForgot(true);
        //     // Handle success (e.g., redirect to login page or auto-login)
        //     await login(formData);
        //     navigate('/onboard', { replace: true });
        // } catch (error) {
        //     if(error.response.status === 400){
        //         setErrorText("Username or Email already exists");
        //     } else {
        //         setErrorText(error.response.data.message);
        //     }
        //     // console.error('Registration failed:', error);
        //     // Handle errors (e.g., display error message)
        // }

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
            <h1>Forgot Password?</h1>
            <h2 className={`forget-text ${valid ? "send-show" : ""} `}>{sentForgot ? "Please check your email for password reset instructions" : "No worries, we'll send you instructions to reset your password"}</h2>
            <div className="form-content" >
                <div className="email">
                    <p>Email</p>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
                </div>
                <button type="submit" className={`button ${sentForgot ? "" : valid ? "active" : ""}`}>Reset Password</button>
                <p className="already forget"> <Link to="/login">Back to Login</Link></p>

            </div>
        </form>
    );

}

export default PasswordForm;