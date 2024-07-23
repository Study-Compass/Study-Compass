import axios from 'axios';

const onboardUser = async (name, username, classroom, recommendation) => {
    try{
        let classroomPreferences = "";
        for(let i = 0; i  < classroom.length ; i++){
            classroomPreferences += classroom[i][0];
        }

        const response = await axios.post('/update-user', {name, username, classroom : classroomPreferences, recommendation, onboarded : true}, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
        const responseBody = response.data;
        console.log(responseBody);

    } catch (error){
        throw(error);
    }
}

export { onboardUser }