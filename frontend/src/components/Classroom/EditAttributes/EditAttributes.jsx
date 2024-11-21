import React, {useState, useEffect} from 'react';
import './EditAttributes.scss';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth.js';

import Outlets from '../../../assets/Icons/Outlets.svg';
import Windows from '../../../assets/Icons/Windows.svg';
import Printer from '../../../assets/Icons/Printer.svg';
import Delete from '../../../assets/Icons/Delete.svg';
import X from '../../../assets/x.svg';


import { changeClasroom, mainSearchChange } from '../../../DBInteractions.js';

import { useNotification } from '../../../NotificationContext.js';

function EditAttributes({room, attributes, setEdit}){

    const { reloadNotification } = useNotification();
    const navigate = useNavigate();
    const { user } = useAuth();

    const attributeIcons = {
        "outlets": Outlets,
        "windows": Windows,
        "printer": Printer
    };

    const [attributesAdmin, setAttributes] = useState([...attributes]);
    const [adding, setAdding] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [mainSearch, setMainSearch] = useState(room.mainSearch);

    const addAttribute = (attribute) => {
        if(attribute === "" || attributesAdmin.includes(attribute)){
            return;
        }
        attribute = attribute.toLowerCase().trim();
        const newAttributes = [...attributesAdmin, attribute];
        setAttributes(newAttributes);
        setAdding("");
        // addNotification({title: "Attributes updated", message: "your changes will be reflected in the database"});

    };

    const handleChange = (e) => {
        setAdding(e.target.value);
    };

    const imageChange = (e) => {
        setImageUrl(e.target.value);
    };

    const handleSubmit = () => {
        try{
            changeClasroom(room._id, attributesAdmin, imageUrl.trim());
            if(mainSearch !== room.mainSearch){
                mainSearchChange(room._id);
            }
        } catch (error){
            console.error(error);
            reloadNotification({title: "Error updating attributes", message: "please try again", type: "error"});
        } finally {
            reloadNotification({title: "Successfully updated attributes", message: "your changes will be reflected in the database", type: "success"});
            window.location.reload();
        }

    };

    const handleMainSearch = (e) =>{
        setMainSearch(e.target.checked);
    }

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
                        {user && user.roles.includes('admin') && <img src={Delete} alt="delete" onClick={() => {
                            const newAttributes = attributesAdmin.filter((item) => item !== attribute);
                            console.log(newAttributes);
                            setAttributes(newAttributes);
                        }}/>}

                    </div>

                );
            })}
            <div className="addNew">
                <input type="text" value={adding} onChange={handleChange} className="input" placeholder='add new attributes'/>
                <button className="add" onClick={()=>{addAttribute(adding)}}>add</button>
            </div>
            <div className="addNew">
                <input type="checkbox" checked={mainSearch} onChange={handleMainSearch}/>
                <p>mainSearch?</p>
            </div>
            <button className="save" onClick={handleSubmit}>save</button>
            <button className="save" onClick={()=>{setEdit(false)}}>cancel</button>

        </div>
    )
}

export default EditAttributes;