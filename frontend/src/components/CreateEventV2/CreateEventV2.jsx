import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import FlowComponentV2 from '../../components/FlowComponentV2/FlowComponentV2';

import { useNotification } from '../../NotificationContext';
import useAuth from '../../hooks/useAuth';

import defaultAvatar from '../../assets/defaultAvatar.svg';

// Step components
import GenInfo from './Steps/GenInfo/GenInfo';
import Where from './Steps/Where/Where';
import When from './Steps/When/When';
import Review from './Steps/Review/Review';
// ERROR: all steps need refactor with new layout ^

const CreateEventV2 = () => {
    // general vars:
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isAuthenticating, user } = useAuth();
    
    // Create Event Specific:
    const [alias, setAlias] =  useState(null);

    // authenticate user from old createEvent
    // UNCOMMENT WHEN MOVING TO LIVE
    // useEffect(()=>{
    //     if(isAuthenticating){
    //         return;
    //     }
    //     if(!isAuthenticated){
    //         navigate('/');
    //     }
    //     if(!user){
    //         return;
    //     }
    //     if(!(user.roles.includes('oie') || user.roles.includes('admin') || user.roles.includes('developer'))){
    //         navigate('/');
    //     }
    //     if(origin && origin !== ""){
    //         const club = user.clubAssociations.find((org)=>org.org_name === origin);
    //         if(club){
    //             setAlias({
    //                 img: club.org_profile_image,
    //                 text: club.org_name,
    //                 id: club._id,
    //                 type: 'club'
    //             });
    //         } else {
    //             navigate('/');
    //         }
    //     } else {
    //         setAlias({
    //             img: user.pfp ? user.pfp : defaultAvatar,
    //             text: user.username,
    //             id: user._id,
    //             type: 'user'
    //         });
    //     }
    // }, [isAuthenticating, isAuthenticated, user]);

    const {addNotification} = useNotification();
    
    // confirm valid:
    const [formData, setFormData] = useState({
            name: '',
            type: '',
            hostingId: null, //check
            hostingType: '',
            going: [],
            location: "", //this feels bad to store as a string, any object format we could swap to?
            start_time: new Date(), // check formating
            end_time: new Date(), // check
            description: '',
            image: '',
            classroom_id: null, //check
            visibility: '',
            expectedAttendance: 0, //check
            approvalReference: null, // check
            status: '',
            contact: '',
            isDeleted: false
    });

    const steps = [
        {
            id: 0,
            title: 'Basic Information',
            description: 'General information about your event',
            component: GenInfo,
        },
        {
            id: 1,
            title: 'Location',
            description: 'Select a room for your event',
            component: Where,
        },
        {
            id: 2,
            title: 'Date & Time',
            description: 'Choose your preferred time slot',
            component: When,
        },
        {
            id: 3,
            title: 'Review',
            description: 'Double check your Event details',
            component: Review,
        }
    ];

    const handleSubmit = async (formData) => {
            // Handle create mode (existing logic)
            const submitData = new FormData();

            // CHECK
            const data = {
                name: formData.name,
                type: formData.type,
                hostingId: formData.hostingId,
                hostingType: formData.hostingType,
                going: formData.going,
                location: formData.location,
                start_time: formData.start_time,
                end_time: formData.end_time,
                description: formData.description,
                // image: formData.image, CHECK (see below)
                classroom_id: formData.classroom_id,
                visibility: formData.visibility,
                expectedAttendance: formData.expectedAttendance,
                // approvalReference: CHECK: assuming i don't pass this here?
                // status: CHECK
                contact: formData.contact,
                // isDeleted CHECK
            }

            if(formData.image) {
                submitData.append('image', formData.image);
            }

            // check
            const response = await axios.post("/create-event", submitData, {
                headers: { 
                    Authorization: `Bearer ${localStorage.getItem("token")}` 
                },
            });
            
            if (response.data.success) {
                // is there any local storage for these that should be removed here?
                addNotification({
                    title: 'Event Created',
                    message: `Your event has been created successfully, you'll be contacted shortly apon it's approval!`,
                    type: 'success'
                });
                
                navigate(`/`);
                // idk if there is anywhere i should be routing to here, will there be an instant event page?
            } else {
                throw new Error(response.data.error || 'Failed to create event');
            }
        
    };

    const handleError = (error) => {
        addNotification({
            title: 'Create Event Error',
            message: error.message || 'Something went wrong. Please try again.',
            type: 'error'
        });
    };

    return (
        <FlowComponentV2
            steps={steps}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onError={handleError}
            headerTitle={"Create Event"}
            headerSubtitle={"Create an event in just a few quick steps!"}
            submitButtonText={"Publish"}
            submittingButtonText={"Creating..."}
            className="create-line-v2"
        />
    );
};

export default CreateEventV2; 