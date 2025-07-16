import React, {useState} from 'react';
import rpiLogo from "../../assets/Icons/rpiLogo.svg";
import person from "../../assets/Icons/Profile.svg";
import calendar from "../../assets/Icons/Calendar.svg";
import locate from "../../assets/Icons/Locate.svg";
import profile from "../../assets/Icons/Profile2.svg";
import FormViewer from '../../components/FormViewer/FormViewer';
import Header from '../../components/Header/Header';
import Popup from '../../components/Popup/Popup';
import apiRequest from '../../utils/postRequest';


import './Org.scss';

const Org = ({ orgData }) => {


    const [isMember, setIsMember] = useState(false);
    const { overview, members, followers } = orgData.org;
    const [showForm, setShowForm] = useState(false);

    console.log(orgData);

    const handleApply = async (formAnswers) => {
        const response = await apiRequest(`/${overview._id}/apply-to-org`, {
            formResponse: formAnswers
        });
        console.log(response);
    }
    

    const initiateApply = () => {
        if(overview.requireApprovalForJoin) {
            if(overview.memberForm) {
                setShowForm(true);
            } else {
                // setIsMember(true);
                //pending approval
                handleApply();

            }
        } else {
            setIsMember(true);
        }
    }

    const handleFormSubmit = (answers) => {
        handleApply(answers);
    }
    
    return (
        <div className="org-page page">
            <Popup isOpen={showForm} onClose={() => setShowForm(false)}>
                <FormViewer form={overview.memberForm} onSubmit={handleFormSubmit} /> 
            </Popup>
            <Header />
            <div className='org-content'>

                <div className="top-header-box">
                    <div className="org-logo">
                        <div className="img-container">
                            <img src={overview.org_profile_image ? overview.org_profile_image : rpiLogo} alt=""/>
                        </div>
                    </div>
                </div>

                <div className="org-info">
                    <div className="col">
                        <div className="org-header">
                            <h2 className="name">{overview.org_name}</h2>
                            {/* <h2 className="name"> Name </h2> */}
                            <div className="status">Union Recognized</div>
                        </div>

                        <p className="description">
                            {overview.org_description}
                        </p>
                    </div>
                    
                    <p className="stats">
                        <img src = {person} alt =""/>
                        250 followers • 50 members
                        
                        <img src = {profile} className='mutuals' alt =""/>
                        <img src = {profile} alt =""/>
                        Friend and 1 other are members
                    </p>
                    {/* 2 base states: joined, not joined */}
                    <div className="actions">
                        {/* {
                            overview.requireApprovalForJoin ? (
                                <button onClick={initiateApply}>Apply</button>
                            ) : (
                                <button>Join</button>
                            )
                        } */}
                        {
                            orgData.org.isMember ? (
                                <button>Leave</button>
                            ) : orgData.org.isPending ? (
                                <button disabled={true}>Pending...</button>
                            ) : overview.requireApprovalForJoin ? (
                                <button onClick={initiateApply}>Apply</button>
                            ) : (
                                <button onClick={initiateApply}>Join</button>
                            )
                        }
                        <button>Follow</button>
                    </div>

                </div>

                <div className='event-info'>
                    <div className='upcoming'> 

                    </div>
                    
                </div>

                {/* <div className='meeting-schedule'>
                    <h1>meetings schedule</h1>
                    <div className='meetings'>
                        <p>YDSA Weekly GBM</p>

                    </div>

                </div> */}

                <div className="meeting-schedule">
                    <h3>meetings schedule</h3>
                    <div className="meeting-card">
                        <div className='title'>
                            <img src={rpiLogo} alt="" className='logo'/>
                            <h4>YDSA Weekly GBM</h4>
                        </div>
                        <div className='info'>
                            <div className='item'> 
                                <img src={calendar} alt="" />
                                <p>Weekly on Thursday at 5:00</p>
                                <img src={locate} alt="" />
                                <p>Phalanx</p>
                            </div>
                            {/* <p>Next Meeting: Thursday 10/24</p> */}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Org;
