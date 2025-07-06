import React from 'react';
import './DashStatus.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

function DashStatus({status, action, actionText, color, backgroundColor, icon="tabler:exclamation-circle"}) {

    return (
        <div className="dash-status" style={{
            "--color": color,
            "--background-color": backgroundColor
        }}>
            <div className="status-container">
                {icon && <Icon icon={icon} />}
                {status}
            </div>
            <button onClick={action}>{actionText} <Icon icon="heroicons:chevron-right" /></button>
        </div>
    );
}

export default DashStatus;