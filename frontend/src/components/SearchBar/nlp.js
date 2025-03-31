export function nlp(query) {
    // Regular expression to match the "from _ to _" pattern
    const timeRegex = /from\s+(\d{1,2}(:\d{2})?)\s*(am|pm)?\s*to\s+(\d{1,2}(:\d{2})?)\s*(am|pm)?/i;
  
    const match = query.match(timeRegex);
  
    if (!match) {
      return { startMinutes: null, endMinutes: null, cleanedQuery: query }; // Return as-is if no match
    }
  
    const convertToMinutes = (time, meridiem, assumePm = false) => {
      let [hours, minutes = 0] = time.split(":").map(Number);
  
      // Handle AM/PM assumption and conversion
      if (!meridiem && assumePm) {
        meridiem = "pm";
      }
  
      if (meridiem && meridiem.toLowerCase() === "pm" && hours < 12) {
        hours += 12;
      }
      if (meridiem && meridiem.toLowerCase() === "am" && hours === 12) {
        hours = 0;
      }
  
      return hours * 60 + minutes; // Normalize to minutes from midnight
    };
  
    const startTime = match[1]; // Start time
    const startMeridiem = match[3] || ""; // AM/PM for start time (if any)
    const endTime = match[4]; // End time
    const endMeridiem = match[6] || ""; // AM/PM for end time (if any)
  
    // Convert times to minutes from midnight
    const startMinutes = convertToMinutes(
      startTime,
      startMeridiem,
      !startMeridiem && Number(startTime.split(":")[0]) <= 7 // Assume PM for ambiguous times in range
    );
    let endMinutes = convertToMinutes(
      endTime,
      endMeridiem,
      !endMeridiem && Number(endTime.split(":")[0]) <= 7
    );
  
    // Adjust end time if it is earlier than start time (assume the same day)
    if (endMinutes < startMinutes) {
      endMinutes += 12 * 60; // Add 12 hours to end time
    }
  
    // Ensure times fall within the 7 AM to 9 PM window
    const startLimit = 7 * 60; // 7:00 AM
    const endLimit = 21 * 60; // 9:00 PM
  
    const adjustedStartMinutes = Math.max(startMinutes, startLimit);
    const adjustedEndMinutes = Math.min(endMinutes, endLimit);
  
    // Remove the matched "from _ to _" part from the query
    const cleanedQuery = query.replace(timeRegex, "").trim();
  
    const newQuery = {
      class_name: "search",
      start_time: adjustedStartMinutes,
      end_time: adjustedEndMinutes,
    };
  
    return {
      newQuery,
      cleanedQuery,
    };
  }
