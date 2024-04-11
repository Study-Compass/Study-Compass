function sortByAvailability(objects){
    let availability = {};
    for(let i=0;i<objects.length;i++){
        const room = objects[i];
        if(room.availability){
            availability[room.name] = findNext(room.weekly_schedule);
        }
    }
    objects.sort((a,b) => {
        if(availability[a.name] === 9999){
            return 1;
        } else if (availability[b.name] === 9999){
            return -1;
        }
        return availability[a.name] - availability[b.name];
    });
    
    return objects;

}

const findChain = (schedule, time) => {
    for(let i=0;i<schedule.length;i++){
        const event = schedule[i];
        if(event.start_time === time){
            return findChain(schedule, event.end_time);
        }
    }
    return time;
};

const findNext = (schedule) => {
    const days = ["M","T","W","R","F"];
    const today = new Date();
    const day = today.getDay();
    const minutes = (today.getHours()*60) + today.getMinutes() + 10;
    // console.log(minutes);

    if(day === 0 || day === 6){
        return { message: "for the day", free: true };
    } else {
        if(schedule[days[day-1]].length === 0 ){
            return{ message: "for the day", free: true };
        }
        let free = true;
        let next = 9999;
        for(let i=0; i<schedule[days[day-1]].length;i++){
            const event = schedule[days[day-1]][i];
            // console.log('time:', minutes, "compare", event.start_time);
            if(event.end_time < minutes){ // passed already
                continue;
            } else if (event.start_time < minutes){ // right now
                free = false;
                next = event.end_time;
                next = findChain(schedule[days[day-1]], next);
                break;
            } else { // in the future
                next = Math.min(next, event.start_time); 
            }
        }
        if(free === true && next === 9999){
            return 9999;
        } else if (free === false){
            return -(minutesToTime(next));
        } else {
            return minutesToTime(next);
        }   
    }
};

module.exports = { sortByAvailability, findNext, findChain };