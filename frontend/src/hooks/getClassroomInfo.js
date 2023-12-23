import { useState, useEffect } from 'react';

export const getClassroomInfo = (classroomID) => {
    const [classroomInfo, setClassroomInfo] = useState(null);
    useEffect(() => {
        fetch(`/api/classrooms/${classroomID}`)
            .then((response) => response.json())
            .then((data) => {
                setClassroomInfo(data);
            });
    }, [classroomID]);
    return classroomInfo;
};