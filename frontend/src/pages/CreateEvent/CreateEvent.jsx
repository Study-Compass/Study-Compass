import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FlowComponentV2 from '../../components/SharedFlowManager/FlowComponentV2';
import { useNotification } from '../../NotificationContext';
import useAuth from '../../hooks/useAuth';
import { createEvent } from './CreateEventHelpers';
import defaultAvatar from '../../assets/defaultAvatar.svg';

// Step components
import GenInfo from '../../components/CreateEvent/GenInfo/GenInfo';
import EventDateTimeSelection from '../../components/CreateEvent/EventDateTimeSelection/EventDateTimeSelection';
import CustomFormFill from '../../components/CreateEvent/CustomFormFill/CustomFormFill';
import Review from '../../components/CreateEvent/Review/Review';

function CreateEvent(){
    const location = useLocation();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    
    const origin = location.state ? location.state.origin : "";
    const [alias, setAlias] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: '',
        visibility: '',
        expectedAttendance: '',
        selectedFile: null,
        dateTime: null,
        location: '',
        start_time: null,
        end_time: null,
        OIEAcknowledgementItems: [],
        contact: '',
        customFormData: null
    });

    useEffect(() => {
        if (isAuthenticating) {
            return;
        }
        if (!isAuthenticated) {
            navigate('/');
        }
        if (!user) {
            return;
        }
        if (!(user.roles.includes('oie') || user.roles.includes('admin') || user.roles.includes('developer'))) {
            navigate('/');
        }
        if (origin && origin !== "") {
            const club = user.clubAssociations.find((org) => org.org_name === origin);
            if (club) {
                setAlias({
                    img: club.org_profile_image,
                    text: club.org_name,
                    id: club._id,
                    type: 'club'
                });
            } else {
                navigate('/');
            }
        } else {
            setAlias({
                img: user.pfp ? user.pfp : defaultAvatar,
                text: user.username,
                id: user._id,
                type: 'user'
            });
        }
    }, [isAuthenticating, isAuthenticated, user, origin, navigate]);

    const steps = [
        {
            id: 0,
            title: 'General Information',
            description: 'Basic event details and description',
            component: GenInfo,
        },
        {
            id: 1,
            title: 'Date & Time',
            description: 'When and where your event will take place',
            component: EventDateTimeSelection,
        },
        ...(formData.location === 'Darrin Communications Center 330' ? [{
            id: 2,
            title: 'Custom Form',
            description: 'Additional form requirements',
            component: CustomFormFill,
        }] : []),
        {
            id: formData.location === 'Darrin Communications Center 330' ? 3 : 2,
            title: 'Review & Submit',
            description: 'Review your event details and submit',
            component: Review,
        }
    ];

    const handleSubmit = async (formData) => {
        let formattedInfo = {
            ...formData
        };

        if (alias && alias.text !== user.username) {
            formattedInfo = {
                ...formattedInfo,
                orgId: alias.id,
            };
        }

        // Create FormData if we have an image
        const submitData = new FormData();
        if (formData.selectedFile) {
            console.log('Uploading image');
            submitData.append('image', formData.selectedFile);
        }

        // Append all other event data
        Object.keys(formattedInfo).forEach(key => {
            if (key !== 'selectedFile' && key !== 'image') {
                if (typeof formattedInfo[key] === 'object' && formattedInfo[key] !== null) {
                    submitData.append(key, JSON.stringify(formattedInfo[key]));
                } else {
                    submitData.append(key, formattedInfo[key]);
                }
            }
        });

        const response = await createEvent(submitData);

        if (response) {
            addNotification({
                title: "Event created", 
                message: "Your event has been created successfully", 
                type: "success"
            });
            navigate('/events');
        } else {
            throw new Error("Failed to create event");
        }
    };

    const handleError = (error) => {
        addNotification({
            title: "Failed to create event", 
            message: error.message || "An error occurred while creating your event", 
            type: "error"
        });
    };

    if (!alias) {
        return <div>Loading...</div>;
    }

    return (
        <FlowComponentV2
            steps={steps}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onError={handleError}
            headerTitle="Create Event"
            headerSubtitle={`Creating as ${alias.text}`}
            submitButtonText="Create Event"
            submittingButtonText="Creating..."
            className="create-event-v2"
        />
    );
}

export default CreateEvent;

