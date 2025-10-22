import React, { useState, useEffect } from 'react';
import './Form.scss';
import Header from '../../components/Header/Header';
import FormViewer from '../../components/FormViewer/FormViewer';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';

function Form() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    const { data: formData, loading: formLoading, error: formError } = useFetch(`/get-form-by-id/${id}`);


    if (!formData || formLoading){
        return <div></div>;
    }

    return (
        <div>
            <FormViewer form={formData.form} />
        </div>


    );


}

export default Form;
//make page 
// implement submission
// and seeing the responses on the admin side
