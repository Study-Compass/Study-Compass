import React from "react";
import './Flag.scss';

function Flag({functions, primary, accent, color, text, img}) {
    return (
        <div className="flag-container" style={{ '--text-color': color, '--primary-color': primary, '--accent-color': accent }}>
            <div className="flag"
                ><img src={img} alt="error"></img>
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