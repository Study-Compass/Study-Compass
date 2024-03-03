function minutesToTime(minutes){
    let hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if(hours > 12){
        hours -= 12;
    }
    return `${hours}:${mins.toString().padStart(2, '0')}`;
}

const findNext = (schedule) => {
    const days = ["M","T","W","R","F"];
    const today = new Date();
    const day = 1;
    const minutes = (today.getHours()*60) + today.getMinutes()-500;
    console.log(minutes);

    if(day === 0 || day === 6){
        return "for the day";
    } else {
        if(schedule[days[day]].length === 0 ){
            return "for the day";
        }
        let free = true;
        let next = 9999;
        for(let i=0; i<schedule[days[day]].length;i++){
            const event = schedule[days[day]][i];
            console.log('time:', minutes, "compare", event.start_time);
            if(event.end_time < minutes){ // passed already
                continue;
            } else if (event.start_time < minutes){ // right now
                free = false;
                next = event.end_time;
                break;
            } else { // in the future
                next = Math.min(next, event.start_time); 
            }
        }
        if(free === true && next === 9999){
            console.log("here");

            return "for the day"
        } else if (free === false){
            return `at ${minutesToTime(next)}`
        } else {
            return `until ${minutesToTime(next)}`
        }   
    }
};



export { findNext };