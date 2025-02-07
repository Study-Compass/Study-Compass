import React, { useEffect, useState } from 'react';
import './Members.scss';
import profile from '../../../assets/defaultAvatar.svg';
import CardHeader from '../../../components/ProfileCard/CardHeader/CardHeader';

function Members({expandedClass, people, positions}){
    const [showMembers, setShowMembers] = useState(0);   
    const [selectedMember, setSelectedMember] = useState(0);
    const [officers, setOfficers] = useState([]);
    const [members, setMembers] = useState([]);

    useEffect(()=>{
        if(people){
            const officers = people.filter(member => member.status !== positions.length-1);
            const members = people.filter(member => member.status === positions.length-1);
            setOfficers(officers);
            setMembers(members);
        }
    },[people]);

    useEffect(()=>{
        setSelectedMember(0);
    }, [showMembers]);

    if(!people){
        return null;
    }
    return (
        <div className={`dash ${expandedClass}`}>
            <div className="members">
                <h1>Membership Managment</h1>
                <div className="content">
                    <div className="member-col">
                        <div className = "topbox">
                            <h2 className={`${showMembers === 0 && "selected"}`} onClick={()=>setShowMembers(0)}>members</h2>
                            <h2 className={`${showMembers === 1 && "selected"}`} onClick={()=>setShowMembers(1)}>officers</h2>
                        </div>
                        <div className="members-list">
                            <div className={`members ${showMembers === 1 && "show"}`}>
                                {members.map((member, index) => {
                                    const user = member.user_id;
                                    return (
                                        <div className={`list ${showMembers === 0 && index === selectedMember && "selected"}`} key={index}>
                                            <img src={profile} alt="" />
                                            <div className='box'>
                                                <h3>{user.name}</h3>
                                                <h4>{user.email}</h4>
                                                <h4>{positions[member.status]}</h4>
                                            </div>
                                        </div>
                                    )
                                })}
                                
                            </div>
                            <div className={`officers ${showMembers === 1 && "show"}`}>
                                {officers.map((member, index) => {
                                    const user = member.user_id;
                                    return (
                                        <div className={`list ${showMembers === 1 && index === selectedMember && "selected"}`} key={index} onClick={()=>setSelectedMember(index)}>
                                            <img src={profile} alt="" />
                                            <div className='box'>
                                                <h3>{user.name}</h3>
                                                <h4>{user.email}</h4>
                                                <h4>{positions[member.status]}</h4>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="col">
                        {showMembers === 0 ? 
                            members[selectedMember] && <CardHeader userInfo={members[selectedMember] ? members[selectedMember].user_id : null} />
                            :
                            officers[selectedMember] && <CardHeader userInfo={officers[selectedMember] ? officers[selectedMember].user_id : null} />
                        }
                    </div>
                </div>

            </div>
        </div>
    )
}


export default Members;
