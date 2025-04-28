import React from 'react';
import './HeaderContainer.scss';
import { Icon } from '@iconify-icon/react/dist/iconify.mjs';

const HeaderContainer = ({children, icon, header, scroll, subheader, right, size = '16px', classN}) => {
    return(
        <div className={`${classN} header-container`} style={{'--size' : size}}>
            <div className="header-container-header">
                <div className="row">
                    <div>
                        <div className="header-container-header-icon">
                            <Icon icon={icon}/>
                        </div>
                        <div className="header-container-header-text">
                            <h2>{header}</h2>
                        </div>
                    </div>
                    {right && right}
                </div>
                {
                    subheader && 
                    <div className="row">
                        {subheader}
                    </div>
                }
            </div>
            <div className="header-container-content">
                {children}
            </div>
        </div>
    )
}

export default HeaderContainer;