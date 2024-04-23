function sortByAvailability(objects) {
    let availability = {};
    for (let i = 0; i < objects.length; i++) {
        const room = objects[i];
        availability[room.name] = findNext(room.weekly_schedule);
    }
    objects.sort((a, b) => {
        if (availability[a.name] === 9999 && availability[b.name] !== 9999) {
            return -1; // a comes before b
        } else if (availability[b.name] === 9999 && availability[a.name] !== 9999) {
            return 1; // b comes before a
        }
        return availability[b.name] - availability[a.name];
    });
    return objects;

}

const findChain = (schedule, time) => {
    for (let i = 0; i < schedule.length; i++) {
        const event = schedule[i];
        if (event.start_time === time) {
            return findChain(schedule, event.end_time);
        }
    }
    return time;
};

const findNext = (schedule) => {
    const days = ["M", "T", "W", "R", "F"];
    const today = new Date();
    const day = today.getDay();
    const minutes = (today.getHours() * 60) + today.getMinutes() + 10;

    if (day === 0 || day === 6) {
        return 9999;
    } else {
        if (schedule[days[day - 1]].length === 0) {
            return 9999;
        }
        let free = true;
        let next = 9999;
        for (let i = 0; i < schedule[days[day - 1]].length; i++) {
            const event = schedule[days[day - 1]][i];
            // console.log('time:', minutes, "compare", event.start_time);
            if (event.end_time < minutes) { // passed already
                continue;
            } else if (event.start_time < minutes) { // right now
                free = false;
                next = event.end_time;
                next = findChain(schedule[days[day - 1]], next);
                break;
            } else { // in the future
                next = Math.min(next, event.start_time);
            }
        }
        if (free === true && next === 9999) {
            return 9999;
        } else if (free === false) {
            return -next;
        } else {
            return next;
        }
    }
};

module.exports = { sortByAvailability, findNext, findChain };


