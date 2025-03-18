import React from "react";
import './Flag.scss';
import { Icon } from "@iconify-icon/react/dist/iconify.mjs";

function Flag({functions, primary, accent, color, text, img, icon}) {
    return (
        <div className="flag-container" style={{ '--text-color': color, '--primary-color': primary, '--accent-color': accent }}>
            <div className="flag">
                {
                    icon ? <Icon icon={icon} style={{color:color}} /> : <img src={img} alt="error"></img> 
                }
                <div className="insides">
                    {text}
                    {functions &&
                        <button onClick={functions}>report incorrect information</button>
                    }
                </div>
            </div> 
        </div>
    )
}

export default Flag;