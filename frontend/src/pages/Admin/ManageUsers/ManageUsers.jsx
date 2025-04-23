import React, { useEffect, useState } from 'react';
import UserSearch from '../../../components/UserSearch';
import './ManageUsers.scss'
import useAuth from '../../../hooks/useAuth';
import CardHeader from '../../../components/ProfileCard/CardHeader/CardHeader'

function ManageUsers({}){
    const {user} = useAuth();
    const [selectedUser, setSelectedUser] = useState(user);
    return (
        <div className="manage-users">
            <CardHeader userInfo={selectedUser} />
            <UserSearch onUserSelect={setSelectedUser}/>
        </div>
    )
}

export default ManageUsers;