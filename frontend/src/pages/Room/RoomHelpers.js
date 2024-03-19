function minutesToTime(minutes){
    let hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let end = hours === 12 ? "PM": "AM";
    if(hours > 12){
        hours -= 12;
        end = "PM";
    }
    if(mins == 0){
        return `${hours}${end}`;
    }
    return `${hours}:${mins.toString().padStart(2, '0')} ${end}`;
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
    const minutes = (today.getHours()*60) + today.getMinutes();
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
            return { message: "for the day", free: true };
        } else if (free === false){
            return { message: `until ${minutesToTime(next)}`, free };
        } else {
            return { message: `until ${minutesToTime(next)}`, free };
        }   
    }
};



export { findNext };