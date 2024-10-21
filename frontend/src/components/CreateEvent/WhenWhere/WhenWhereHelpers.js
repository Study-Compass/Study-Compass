const addQueryHelper = (key, newValue, setQuery) => {
    setQuery(prev => {
        // Create a list that includes all existing timeslots plus the new one.
        const allSlots = [...prev[key], newValue];

        // Sort timeslots by start time.
        allSlots.sort((a, b) => a.start_time - b.start_time);

        // Merge overlapping or consecutive timeslots.
        const mergedSlots = allSlots.reduce((acc, slot) => {
            if (acc.length === 0) {
                acc.push(slot);
            } else {
                let lastSlot = acc[acc.length - 1];
                if (lastSlot.end_time >= slot.start_time) {
                    // If the current slot overlaps or is consecutive with the last slot in acc, merge them.
                    lastSlot.end_time = Math.max(lastSlot.end_time, slot.end_time);
                } else {
                    // If not overlapping or consecutive, just add the slot to acc.
                    acc.push(slot);
                }
            }
            return acc;
        }, []);

        // Return updated state.
        return { ...prev, [key]: mergedSlots };
    });
};

const removeQueryHelper = (key, value, setQuery) => {
    // setNoQuery(true); //failsafe, useEffect checks before query anyways
    setQuery(prev => {
        const existing = prev[key];
        if (existing === undefined) {
            // If the key does not exist, return the previous state unchanged.
            return prev;
        } else {
            // Filter the array to remove the specified value.
            const filtered = existing.filter(v => v !== value);
            // Always return the object with the key, even if the array is empty.
            const newQuery = { ...prev, [key]: filtered };
            const isQueryEmpty = Object.values(newQuery).every(arr => arr.length === 0);
            return newQuery;
        }
    });
    
    // Check if all keys in the query object have empty arrays and update `noQuery` accordingly.
}

export { addQueryHelper, removeQueryHelper };