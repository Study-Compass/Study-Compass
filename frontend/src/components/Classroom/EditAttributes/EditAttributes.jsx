import React, {useState, useEffect} from 'react';
import './EditAttributes.css';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth.js';

import Outlets from '../../../assets/Icons/Outlets.svg';
import Windows from '../../../assets/Icons/Windows.svg';
import Printer from '../../../assets/Icons/Printer.svg';
import Delete from '../../../assets/Icons/Delete.svg';
import X from '../../../assets/x.svg';


import { changeClasroom } from '../../../DBInteractions.js';

import { useNotification } from '../../../NotificationContext.js';

function EditAttributes({room, attributes}){

    const { addNotification } = useNotification();
    const navigate = useNavigate();
    const { user } = useAuth();

    const attributeIcons = {
        "outlets": Outlets,
        "windows": Windows,
        "printer": Printer
    };

    const [attributesAdmin, setAttributes] = useState([...attributes]);
    const [adding, setAdding] = useState("");

    const addAttribute = (attribute) => {
        if(attribute === "" || attributesAdmin.includes(attribute)){
            return;
        }
        const newAttributes = [...attributesAdmin, attribute];
        setAttributes(newAttributes);
        setAdding("");
    };

    const handleChange = (e) => {
        setAdding(e.target.value);
    };

    const handleSubmit = () => {
        console.log("hello");
        changeClasroom(room._id, attributesAdmin);
        window.location.reload();
    };

    console.log(room);

    return (
        <div className="edit-attributes">
            <img src={X} alt="" className="x" onClick={()=>{setEdit(false)}}/>
            {attributesAdmin && attributesAdmin.map((attribute, index) => {
                return (
                    <div className="attribute" key={index}>
                        <div className="attribute-info">
                            {attribute in attributeIcons ? <img src={attributeIcons[attribute]} alt={attribute} />: ""}
                            {attribute}
                        </div>
                        {user && user.admin && <img src={Delete} alt="delete" onClick={() => {
                            const newAttributes = attributesAdmin.filter((item) => item !== attribute);
                            console.log(newAttributes);
                            setAttributes(newAttributes);
                        }}/>}
                    </div>
                );
            })}
            <div className="addNew">
                <input type="text" value={adding} onChange={handleChange} className="input" />
                <button className="add" onClick={()=>{addAttribute(adding)}}>add</button>
            </div>
            <button className="save" onClick={handleSubmit}>save</button>
            <button className="save" onClick={()=>{setEdit(false)}}>cancel</button>

        </div>
    )
}

export default EditAttributes;