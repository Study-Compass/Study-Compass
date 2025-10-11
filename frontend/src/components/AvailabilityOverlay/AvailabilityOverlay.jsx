import React, { useMemo } from 'react';
import './AvailabilityOverlay.scss';

/**
 * AvailabilityOverlay Component
 * 
 * Renders visual availability indicators across the calendar grid.
 * Shows availability states: available, conflict, blocked
 * 
 * Philosophy: Visual feedback should be immediate and intuitive
 */
const AvailabilityOverlay = ({ 
    days, 
    events, 
    timeIncrement = 15,
    showAvailability = true 
}) => {
    const MINUTE_HEIGHT = 1; // 1px per minute

    /**
     * Calculate availability state for each time slot
     * Returns: 'available', 'conflict', 'blocked'
     */
    const calculateAvailabilityGrid = useMemo(() => {
        if (!showAvailability || !days || days.length === 0) return [];

        const availabilityGrid = [];
        const totalMinutes = 24 * 60; // 1440 minutes in a day
        const slotsPerDay = Math.floor(totalMinutes / timeIncrement);

        days.forEach((day, dayIndex) => {
            const dayAvailability = [];
            
            for (let slotIndex = 0; slotIndex < slotsPerDay; slotIndex++) {
                const slotStartMinutes = slotIndex * timeIncrement;
                const slotEndMinutes = slotStartMinutes + timeIncrement;
                
                // Create time objects for this slot
                const slotStart = new Date(day);
                slotStart.setHours(Math.floor(slotStartMinutes / 60));
                slotStart.setMinutes(slotStartMinutes % 60);
                slotStart.setSeconds(0);
                
                const slotEnd = new Date(day);
                slotEnd.setHours(Math.floor(slotEndMinutes / 60));
                slotEnd.setMinutes(slotEndMinutes % 60);
                slotEnd.setSeconds(0);
                
                // Check for conflicts with existing events
                const hasConflict = events.some(event => {
                    const eventStart = new Date(event.start_time);
                    const eventEnd = new Date(event.end_time);
                    
                    // Same day check
                    if (eventStart.toDateString() !== day.toDateString()) {
                        return false;
                    }
                    
                    // Time overlap check
                    return !(eventEnd <= slotStart || slotEnd <= eventStart);
                });
                
                // Determine availability state
                let availabilityState = 'available';
                if (hasConflict) {
                    availabilityState = 'conflict';
                }
                
                // Future enhancement: Add 'blocked' state for business rules
                // (e.g., outside business hours, holidays, etc.)
                
                dayAvailability.push({
                    dayIndex,
                    slotIndex,
                    startMinutes: slotStartMinutes,
                    endMinutes: slotEndMinutes,
                    startTime: slotStart.toISOString(),
                    endTime: slotEnd.toISOString(),
                    state: availabilityState
                });
            }
            
            availabilityGrid.push(dayAvailability);
        });

        return availabilityGrid;
    }, [days, events, timeIncrement, showAvailability]);

    /**
     * Render availability indicators for a single day
     */
    const renderDayAvailability = (dayAvailability, dayIndex) => {
        return dayAvailability.map((slot, slotIndex) => {
            // Skip rendering for available slots to reduce DOM overhead
            if (slot.state === 'available') return null;
            
            const top = slot.startMinutes * MINUTE_HEIGHT;
            const height = timeIncrement * MINUTE_HEIGHT;
            
            return (
                <div
                    key={`${dayIndex}-${slotIndex}`}
                    className={`availability-indicator availability-${slot.state}`}
                    style={{
                        position: 'absolute',
                        top: `${top}px`,
                        left: '0',
                        right: '0',
                        height: `${height}px`,
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                    data-availability-state={slot.state}
                    data-time-slot={`${slot.startTime}-${slot.endTime}`}
                />
            );
        });
    };

    if (!showAvailability || calculateAvailabilityGrid.length === 0) {
        return null;
    }

    return (
        <div className="availability-overlay">
            {calculateAvailabilityGrid.map((dayAvailability, dayIndex) => (
                <div
                    key={dayIndex}
                    className="day-availability"
                    style={{
                        position: 'absolute',
                        left: `${(dayIndex / 7) * 100}%`,
                        width: `${100 / 7}%`,
                        height: '100%',
                        pointerEvents: 'none'
                    }}
                >
                    {renderDayAvailability(dayAvailability, dayIndex)}
                </div>
            ))}
        </div>
    );
};

export default AvailabilityOverlay;