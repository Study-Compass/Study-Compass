# Requirements Document

## Introduction

This feature enhances the existing OIE Event Calendar WeeklyCalendar component with advanced event manipulation capabilities. Currently, the calendar displays events as static elements and has a drag selection feature for creating new time selections. This enhancement will add the ability to drag events to new times, resize events by dragging their bottom edge, merge overlapping events automatically, and delete events directly from the calendar interface. The feature also improves the existing drag selection behavior to prevent conflicts with event manipulation.

## Requirements

### Requirement 1

**User Story:** As an OIE administrator, I want to drag existing events to different time slots, so that I can quickly reschedule events without having to edit them through forms.

#### Acceptance Criteria

1. WHEN I click and hold on an existing event THEN the system SHALL enter event drag mode and show visual feedback
2. WHEN I drag an event vertically THEN the system SHALL move the event preview to follow my cursor with real-time positioning
3. WHEN I drag an event THEN the system SHALL maintain the same event duration during the move
4. WHEN I drag an event THEN the system SHALL snap the event position to the configured time increment (15 minutes by default)
5. WHEN I release the event in a valid position THEN the system SHALL update the event's start_time and end_time
6. WHEN I release the event in an invalid position THEN the system SHALL return the event to its original position
7. WHEN I drag an event THEN the system SHALL show a visual indicator (cursor change to 'move') during the drag operation
8. WHEN I drag an event beyond calendar boundaries THEN the system SHALL constrain the event within valid time ranges (0-24 hours)

### Requirement 2

**User Story:** As an OIE administrator, I want to resize events by dragging their bottom edge, so that I can adjust event durations directly on the calendar.

#### Acceptance Criteria

1. WHEN I hover over the bottom 8px of an event THEN the system SHALL show a resize cursor ('ns-resize')
2. WHEN I click and drag the bottom edge of an event THEN the system SHALL enter resize mode
3. WHEN I resize an event THEN the system SHALL only modify the end_time while keeping start_time fixed
4. WHEN I resize an event THEN the system SHALL snap the new end time to the configured time increment
5. WHEN I resize an event THEN the system SHALL enforce a minimum duration of one time increment (15 minutes)
6. WHEN I release after resizing THEN the system SHALL update only the event's end_time
7. WHEN I try to resize an event to less than minimum duration THEN the system SHALL prevent the resize and maintain minimum duration
8. WHEN I resize an event THEN the system SHALL show real-time visual feedback of the new event height

### Requirement 3

**User Story:** As an OIE administrator, I want events to automatically merge when they overlap, so that I can easily combine related events without manual coordination.

#### Acceptance Criteria

1. WHEN I drag or resize an event to overlap with another event THEN the system SHALL detect the collision in real-time
2. WHEN events overlap during drag/resize THEN the system SHALL highlight all affected events with visual indicators
3. WHEN I release an event that overlaps with others THEN the system SHALL automatically merge them into a single event
4. WHEN events are merged THEN the system SHALL create a new event spanning from the earliest start_time to the latest end_time
5. WHEN events are merged THEN the system SHALL inherit properties from the primary event (the one being dragged)
6. WHEN events are merged THEN the system SHALL call onEventsMerge(primaryEventId, mergedEventIds, newStartTime, newEndTime)
7. WHEN multiple events overlap in a chain THEN the system SHALL merge all overlapping events into one
8. WHEN events are about to merge THEN the system SHALL show a preview of the final merged event size before release

### Requirement 4

**User Story:** As an OIE administrator, I want the drag selection mode to intelligently detect whether I'm clicking on an event or empty space, so that I can seamlessly switch between creating new selections and manipulating existing events.

#### Acceptance Criteria

1. WHEN I click on an existing event while in drag selection mode THEN the system SHALL switch to event manipulation mode for that event
2. WHEN I click on empty space while in drag selection mode THEN the system SHALL start a new time selection
3. WHEN I click on an event while NOT in drag selection mode THEN the system SHALL immediately enter event drag mode
4. WHEN I finish manipulating an event THEN the system SHALL return to the previous mode (selection or normal)
5. WHEN the allowCrossDaySelection variable is false THEN the system SHALL prevent dragging events between different days
6. WHEN the allowCrossDaySelection variable is true THEN the system SHALL allow dragging events to different days
7. WHEN I press Escape during event manipulation THEN the system SHALL cancel the operation and return the event to its original position
8. WHEN I click outside the calendar during event manipulation THEN the system SHALL complete the current operation

### Requirement 5

**User Story:** As an OIE administrator, I want to delete events directly from the calendar interface, so that I can quickly remove events without navigating to separate forms.

#### Acceptance Criteria

1. WHEN I hover over an event THEN the system SHALL show a delete button at the center-bottom of the event
2. WHEN I click the delete button THEN the system SHALL call onEventDelete(eventId) callback
3. WHEN I hover away from an event THEN the system SHALL hide the delete button with a smooth fade-out animation
4. WHEN I hover over an event THEN the system SHALL show the delete button with a smooth fade-in animation
5. WHEN the delete button is visible THEN it SHALL be styled as a small circular button with an X or trash icon
6. WHEN I click the delete button THEN the system SHALL prevent the click from triggering event drag mode
7. WHEN the delete button is clicked THEN the system SHALL immediately remove the visual event (optimistic update)
8. IF the delete operation fails THEN the system SHALL restore the event to the calendar

### Requirement 6

**User Story:** As an OIE administrator, I want visual feedback during all event manipulations, so that I understand what actions are being performed and their effects.

#### Acceptance Criteria

1. WHEN I start dragging an event THEN the system SHALL show the event with increased z-index and visual emphasis
2. WHEN events will merge on release THEN the system SHALL highlight all merge candidates with pulsing or glowing effects
3. WHEN I drag or resize an event THEN the system SHALL show a translucent preview of the final position/size
4. WHEN I drag an event to an invalid position THEN the system SHALL show visual indicators for invalid drop zones
5. WHEN events are snapping to time increments THEN the system SHALL show visual snap indicators
6. WHEN I hover over resize handles THEN the system SHALL show appropriate cursor changes
7. WHEN operations are in progress THEN the system SHALL use different cursor styles ('move', 'ns-resize', 'not-allowed')
8. WHEN merge previews are shown THEN the system SHALL display the combined event boundaries with distinct styling

### Requirement 7

**User Story:** As an OIE administrator, I want keyboard shortcuts for event manipulation, so that I can efficiently control the calendar interface.

#### Acceptance Criteria

1. WHEN I press Escape during any event manipulation THEN the system SHALL cancel the current operation
2. WHEN I press Escape during event drag THEN the system SHALL return the event to its original position
3. WHEN I press Escape during event resize THEN the system SHALL restore the original event size
4. WHEN I press Escape during merge preview THEN the system SHALL cancel the merge and restore original positions
5. WHEN I press Delete key while an event is selected THEN the system SHALL trigger the delete functionality
6. WHEN I use Ctrl/Cmd + Z THEN the system SHOULD support undo for the last event manipulation (optional enhancement)
7. WHEN I press Escape THEN the system SHALL exit any active manipulation mode and return to normal state
8. WHEN keyboard shortcuts are used THEN the system SHALL provide the same visual feedback as mouse interactions

### Requirement 8

**User Story:** As a system administrator, I want the event manipulation features to maintain high performance, so that the calendar remains responsive even with many events.

#### Acceptance Criteria

1. WHEN manipulating events THEN the system SHALL use requestAnimationFrame for smooth animations
2. WHEN detecting collisions THEN the system SHALL use efficient algorithms that don't block the UI thread
3. WHEN multiple events are present THEN drag operations SHALL maintain 60fps performance
4. WHEN events are being manipulated THEN the system SHALL throttle mouse move events to prevent performance degradation
5. WHEN collision detection runs THEN it SHALL complete within 16ms to maintain 60fps
6. WHEN events are merged THEN the operation SHALL complete without noticeable UI lag
7. WHEN the calendar has 100+ events THEN manipulation operations SHALL remain responsive
8. WHEN performance monitoring is enabled THEN the system SHALL record metrics for drag, resize, and merge operations