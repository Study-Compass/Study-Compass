import React, { useEffect, useState } from 'react';
import './Configuration.scss';
import { Icon } from '@iconify-icon/react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../NotificationContext';
import { useAuth } from '../../../AuthContext';

import { useFetch } from '../../../hooks/useFetch';

import Loader from '../../../components/Loader/Loader';
import axios from 'axios';

function CheckItem({ item, index, handleCheck }) {
    const [edit, setEdit] = useState(false);
    const [title, setTitle] = useState(item.title);
    const [description, setDescription] = useState(item.description);

    const toggleEdit = () => {
        if(edit) {
            handleCheck((prev) => {
                const checkList = prev.config.checklist;
                const newChecklist = [...checkList];
                newChecklist[index] = { title, description };
                return {config: {checklist:newChecklist}};
            });
        }
        setEdit(!edit);
    }

    return (
        <div className="check-item" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="row">
                <div className="col">
                    { edit ? 
                        (
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                        ) : 
                        <h2>{item.title}</h2> 
                    }
                    {item.description &&            
                        edit ? 
                        (
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                        ) : 
                        <p>{item.description}</p>
                    }
                </div>
                <button onClick={toggleEdit}>edit</button>
            </div>
        </div>
    );
}

function Configuration() {
    const { data, loading, error } = useFetch('/config');
    const { addNotification } = useNotification();

    const [clientData, setClientData] = useState(null);

    useEffect(() => {
        if (error) {
            addNotification({ title: 'Error', message: error, type: 'error' });
        }
    }
        , [error, addNotification]);

    useEffect(() => {
        if (data) {
            setClientData(data);
        }
    }, [data]);

    const handleSave = async () => {
        try {
            console.log(clientData);
            await axios.post('/config', clientData, {headers: {"Authorization": `Bearer ${localStorage.getItem("token")}`}});
            addNotification({ title: 'Success', message: 'Configuration saved', type: 'success' });
        } catch (error) {
            addNotification({ title: 'Error', message: error.message, type: 'error' });
        }
    }       

    if (error) {
        return (
            <div className="configuration">
                <h1>Configuration</h1>
                <div className="content">
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="configuration">
            <h1>Configuration</h1>
            <div className="content">
                <div className="col-header">
                    <h2>checklist items</h2>
                </div>
                {
                    !loading && clientData && clientData.config.checklist.map((config, index) => {
                        return (
                            <CheckItem key={index} item={config} index={index} handleCheck={setClientData} />
                        );
                    })
                }
                {
                    loading && <Loader />
                }
            </div>
            <button onClick={handleSave}>save</button>
        </div>
    );
}

export default Configuration;