import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Contact.scss';
import Header from '../../components/Header/Header';
import logo from '../../assets/Brand Image/BEACON.svg';
import axios from 'axios';
import { useNotification } from '../../NotificationContext';

function Contact() {
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        organization: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        addNotification({
            title: 'Success',
            message: 'Thank you for contacting us! We\'ll get back to you soon.',
            type: 'success'
        });
        setIsSubmitting(false);
        navigate('/');
        return;
    };

    const isValid = formData.name && formData.email && formData.message;

    return (
        <div className="main-contact">
            <Header />
            <div className="contact-container">
                <img src={logo} alt="Meridian" className="logo" />
                <div className="contact-content">
                    <h1>Get in Touch</h1>
                    <p className="contact-subtitle">Have questions about Meridian? We'd love to hear from you.</p>
                    
                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-group">
                            <label htmlFor="name">Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="organization">Organization (optional)</label>
                            <input
                                type="text"
                                id="organization"
                                name="organization"
                                value={formData.organization}
                                onChange={handleChange}
                                placeholder="Your organization or institution"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message *</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Tell us about your needs or questions..."
                                rows="6"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`submit-button ${isValid && !isSubmitting ? 'active' : ''}`}
                            disabled={!isValid || isSubmitting}
                        >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Contact;

