# Design Document

## Overview

This design document outlines the architecture and implementation approach for enhancing the OIE Event Calendar WeeklyCalendar component with advanced availability discovery and timeslot selection capabilities. The primary focus is enabling students to:

1. **Discover available timeslots** - Visually identify when they are free to schedule events or meetings
2. **Select optimal timeslots** - Choose from available periods with intelligent conflict detection
3. **Find alternative times** - Get suggestions when their preferred times are unavailable
4. **Handle scheduling conflicts** - Understand and resolve conflicts with existing commitments
5. **Flexible selection patterns** - Support single timeslot selection, multiple discrete selections, or range selections

The solution builds upon the existing drag selection infrastructure while adding sophisticated availability analysis and smart conflict resolution. The design prioritizes the student workflow of discovering and selecting available time periods while also supporting administrative event management tasks.

The design leverages the existing luxon-based time management, performance monitoring system, and absolute positioning architecture while introducing enhanced selection modes, smart conflict detection, and contextual visual feedback systems.

## Architecture

### Core Components

#### 1. Availability Discovery Manager
A centralized system that helps students find and select available timeslots:

```javascript
const useAvailabilityDiscovery = () => {
  const [discoveryState, setDiscoveryState] = useState({
    mode: 'discovery', // 'discovery' | 'selection' | 'conflict-resolution'
    discoveryType: 'available-slots', // 'available-slots' | 'optimal-times' | 'alternative-suggestions'
    
    // Availability visualization
    availabilityMap: new Map(), // dayIndex -> timeSlot -> availability status
    highlightedSlots: [], // Currently highlighted available slots
    
    // Selection state
    activeSelections: [],
    selectionConstraints: {
      minDuration: 15,
      maxDuration: null,
      preferredTimes: [],
      avoidConflicts: true
    },
    
    // Discovery results
    availableSlots: [],
    conflictingEvents: [],
    suggestedAlternatives: [],
    optimalRecommendations: []
  });
}
```

#### 2. Intelligent Availability Engine
A comprehensive system for availability discovery and conflict resolution:

```javascript
class AvailabilityEngine {
  // Core availability discovery
  discoverAvailableSlots(timeRange, duration, constraints) {
    // Finds all available timeslots matching criteria
    // Returns ranked list of available periods
  }
  
  analyzeAvailability(selectedSlot, existingEvents, userSchedule) {
    // Deep analysis of availability including:
    // - Hard conflicts (overlapping events)
    // - Soft conflicts (back-to-back meetings)
    // - User preferences and patterns
    return {
      isAvailable: boolean,
      conflictLevel: 'none' | 'soft' | 'hard',
      conflictReasons: string[],
      availabilityScore: number // 0-100
    };
  }
  
  suggestOptimalTimes(requirements, userPreferences) {
    // AI-powered suggestions based on:
    // - Historical scheduling patterns
    // - Optimal meeting times
    // - Conflict minimization
    return rankedSuggestions;
  }
  
  findAlternatives(conflictedSlot, flexibility) {
    // Suggests nearby available alternatives
    // Considers user flexibility preferences
  }
}
```

#### 3. Contextual Visual Feedback System
A layered rendering system that provides context-aware feedback for different user types and scenarios:

```javascript
const SelectionOverlay = ({ state, userContext, availabilityData }) => {
  return (
    <>
      <AvailabilityIndicators />
      <SelectionPreview />
      <ConflictWarnings />
      <AlternativeSuggestions />
      <SnapIndicators />
      {userContext.isAdmin && <EventManipulationOverlay />}
    </>
  );
};
```

### Availability Discovery Patterns

#### Visual Availability Indicators
The calendar provides multiple visual cues to help students quickly identify available timeslots:

```javascript
const AvailabilityVisualization = {
  // Color-coded availability states
  availabilityStates: {
    'fully-available': '#e8f5e8', // Light green
    'partially-available': '#fff3cd', // Light yellow  
    'soft-conflict': '#ffeaa7', // Orange
    'hard-conflict': '#ffcccb', // Light red
    'blocked': '#f0f0f0' // Gray
  },
  
  // Interactive discovery modes
  discoveryModes: {
    'highlight-available': 'Shows only available slots prominently',
    'show-conflicts': 'Displays conflicts with explanations',
    'suggest-optimal': 'Highlights AI-recommended times',
    'find-alternatives': 'Shows alternatives to selected times'
  }
};
```

#### Smart Discovery Workflows
```javascript
const discoveryWorkflows = {
  // Quick availability check
  quickCheck: (timeRange) => {
    // Instant visual feedback on availability
    return availabilityEngine.getQuickAvailability(timeRange);
  },
  
  // Detailed availability analysis
  detailedAnalysis: (selection) => {
    // Comprehensive conflict analysis with suggestions
    return availabilityEngine.analyzeWithSuggestions(selection);
  },
  
  // Optimal time finding
  findOptimalTime: (requirements) => {
    // AI-powered optimal time discovery
    return availabilityEngine.findBestTimes(requirements);
  }
};
```

### Integration with Existing System

The enhanced functionality integrates seamlessly with the existing WeeklyCalendar architecture:

- **Enhanced drag selection**: Improved to support multiple selection modes and availability-aware selection
- **Smart interaction detection**: Automatically determines whether user is selecting timeslots or manipulating events
- **Performance monitoring**: Extended to track selection operations and conflict detection
- **Time calculations**: Reuses and enhances existing `getTimeFromPosition` and snapping logic
- **Event rendering**: Builds upon existing `processEvents` with added availability visualization
- **Cross-day selection**: Respects `allowCrossDaySelection` for flexible timeslot selection scenarios

## Components and Interfaces

### Enhanced WeeklyCalendar Component

#### New Props
```javascript
WeeklyCalendar.propTypes = {
  // Existing props...
  
  // Availability discovery props
  discoveryMode: PropTypes.oneOf(['find-available', 'check-conflicts', 'suggest-optimal']), // Default: 'find-available'
  availabilityData: PropTypes.array, // User's existing schedule/commitments
  onAvailabilityCheck: PropTypes.func, // (timeRange) => availability analysis
  showAvailabilityIndicators: PropTypes.bool, // Default: true
  
  // Primary timeslot selection props  
  selectionMode: PropTypes.oneOf(['single', 'multiple', 'range']), // Default: 'single'
  onTimeslotSelect: PropTypes.func, // (selections) => void - Primary callback
  onAlternativeSuggestion: PropTypes.func, // (alternatives) => void - When conflicts found
  
  // User context for adaptive behavior
  userRole: PropTypes.oneOf(['student', 'admin', 'viewer']), // Default: 'student'
  selectionContext: PropTypes.string, // 'event-creation', 'booking', 'availability-check'
  
  // Event manipulation (admin/advanced users)
  onEventMove: PropTypes.func, // (eventId, newStartTime, newEndTime) => void
  onEventResize: PropTypes.func, // (eventId, newEndTime) => void
  onEventDelete: PropTypes.func, // (eventId) => void
  onEventsMerge: PropTypes.func, // (primaryId, mergedIds, newStart, newEnd) => void
  enableEventManipulation: PropTypes.bool, // Default: false for students, true for admins
  
  // Flexible configuration
  minSelectionDuration: PropTypes.number, // Minutes, default: 15
  maxSelectionDuration: PropTypes.number, // Minutes, optional
  allowSelectionMerging: PropTypes.bool, // Default: true
  conflictResolution: PropTypes.oneOf(['warn', 'block', 'suggest']), // Default: 'warn'
};
```

#### Enhanced State Structure
```javascript
const [interactionState, setInteractionState] = useState({
  // Primary selection state
  mode: 'selection', // 'selection' | 'event-manipulation' | 'conflict-resolution'
  selectionType: 'single', // 'single' | 'multiple' | 'range'
  activeSelections: [], // Array of selected timeslots
  
  // Availability and conflict management
  availableSlots: [],
  conflictingEvents: [],
  suggestedAlternatives: [],
  
  // Event manipulation (for admin users)
  activeEventId: null,
  manipulationType: null, // 'move' | 'resize'
  originalBounds: null,
  
  // Interaction tracking
  isDragging: false,
  startPosition: null,
  currentPosition: null,
  previewBounds: null,
  
  // Context-aware behavior
  userContext: {
    role: 'student',
    selectionPurpose: 'event-creation',
    preferences: {}
  }
});
```

### Enhanced CalendarEvent Component

#### Context-Aware Event Rendering
Events now render differently based on user context and interaction mode:

- **Student View**: Events show availability impact and conflict indicators
- **Admin View**: Events show manipulation handles and advanced controls
- **Selection Mode**: Events show how they interact with current selections

#### Component Structure
```javascript
const CalendarEvent = ({ 
  event, 
  userRole,
  selectionState,
  availabilityData,
  onInteractionStart,
  isConflicting,
  isAvailabilityBlocker
}) => {
  const showManipulationControls = userRole === 'admin' && !selectionState.isDragging;
  const showAvailabilityIndicator = userRole === 'student' || selectionState.mode === 'selection';
  
  return (
    <div className={`calendar-event ${getContextualClasses()}`}>
      {showAvailabilityIndicator && (
        <AvailabilityIndicator 
          isBlocking={isAvailabilityBlocker}
          conflictLevel={getConflictLevel(event, selectionState)}
        />
      )}
      
      <div className="event-content" onMouseDown={handleInteractionStart}>
        {/* Existing event content with contextual styling */}
      </div>
      
      {showManipulationControls && (
        <>
          <div className="event-resize-handle" onMouseDown={handleResizeStart} />
          <DeleteButton visible={showDelete} onClick={onDelete} />
        </>
      )}
    </div>
  );
};
```

### Smart Availability & Conflict System

#### Availability Detection Algorithm
```javascript
class AvailabilityEngine {
  constructor(events, availabilityRules, userPreferences) {
    this.spatialGrid = new Map(); // dayIndex -> timeSlot -> availability[]
    this.conflictRules = availabilityRules;
    this.userPreferences = userPreferences;
  }
  
  checkAvailability(timeslot) {
    const conflicts = this.getConflictingEvents(timeslot);
    const availability = this.calculateAvailabilityScore(timeslot, conflicts);
    return {
      isAvailable: conflicts.length === 0,
      conflictLevel: this.getConflictSeverity(conflicts),
      alternatives: this.suggestAlternatives(timeslot),
      availability
    };
  }
  
  optimizeSelections(selections) {
    // Suggests optimal timeslot combinations for multiple selections
    return this.findOptimalCombination(selections);
  }
}
```

#### Smart Conflict Resolution
```javascript
const conflictResolver = {
  analyzeSelection: (selection, existingEvents, availabilityData) => {
    // Returns comprehensive conflict analysis
  },
  
  suggestAlternatives: (conflictedSelection, preferences) => {
    // Returns nearby available alternatives
  },
  
  optimizeMultipleSelections: (selections) => {
    // Optimizes multiple selections to minimize conflicts
  },
  
  validateSelectionConstraints: (selection, constraints) => {
    // Validates against duration, time, and availability constraints
  }
};
```

## Data Models

### Timeslot Selection State
```javascript
interface SelectionState {
  mode: 'selection' | 'event-manipulation' | 'conflict-resolution';
  selectionType: 'single' | 'multiple' | 'range';
  activeSelections: TimeslotSelection[];
  availabilityData: AvailabilityPeriod[];
  conflictingEvents: CalendarEvent[];
  suggestedAlternatives: TimeslotSuggestion[];
  userContext: UserContext;
  isDragging: boolean;
}

interface TimeslotSelection {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
  isAvailable: boolean;
  conflictLevel: 'none' | 'minor' | 'major' | 'blocking';
  purpose: string; // 'event-creation', 'booking', 'availability-check'
}

interface AvailabilityPeriod {
  startTime: string;
  endTime: string;
  dayIndex: number;
  availabilityType: 'available' | 'busy' | 'tentative' | 'blocked';
  source: string; // 'existing-event', 'user-preference', 'system-rule'
}

interface UserContext {
  role: 'student' | 'admin' | 'viewer';
  selectionPurpose: string;
  preferences: {
    preferredDuration?: number;
    avoidConflicts?: boolean;
    suggestAlternatives?: boolean;
  };
}
```

### Enhanced Event Model
```javascript
interface CalendarEvent {
  // Existing properties...
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  type: string;
  location: string;
  
  // New manipulation properties
  isManipulationTarget?: boolean;
  manipulationState?: 'dragging' | 'resizing' | 'merge-target' | 'merge-preview';
  originalBounds?: EventBounds; // For undo functionality
}
```

### Availability Analysis Results
```javascript
interface AvailabilityResult {
  isAvailable: boolean;
  conflictLevel: 'none' | 'minor' | 'major' | 'blocking';
  conflictingEvents: CalendarEvent[];
  availabilityScore: number; // 0-100, higher is better
  alternatives: TimeslotSuggestion[];
  optimizedSelection?: TimeslotSelection; // For multi-selection optimization
}

interface TimeslotSuggestion {
  timeslot: TimeslotSelection;
  score: number;
  reason: string; // 'nearby-available', 'preferred-duration', 'no-conflicts'
  distance: number; // Minutes from original selection
}
```

## Error Handling

### Manipulation Error Recovery
```javascript
const errorRecovery = {
  // Revert event to original position on error
  revertEventPosition: (eventId, originalBounds) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, ...originalBounds }
        : event
    ));
  },
  
  // Handle merge operation failures
  handleMergeFailure: (primaryId, targetIds, originalStates) => {
    // Restore all events to pre-merge state
  },
  
  // Validate manipulation constraints
  validateManipulation: (event, newBounds, constraints) => {
    const errors = [];
    if (newBounds.duration < constraints.minDuration) {
      errors.push('Duration too short');
    }
    if (!constraints.allowCrossDayDrag && newBounds.dayIndex !== event.dayIndex) {
      errors.push('Cross-day drag not allowed');
    }
    return errors;
  }
};
```

### Performance Error Handling
```javascript
const performanceGuards = {
  // Throttle collision detection for performance
  throttledCollisionCheck: throttle((event, allEvents) => {
    return collisionDetector.detectCollisions(event, allEvents);
  }, 16), // 60fps
  
  // Fallback for performance issues
  performanceFallback: () => {
    console.warn('Performance degradation detected, reducing collision accuracy');
    // Reduce collision detection frequency or accuracy
  }
};
```

## Testing Strategy

### Unit Tests

#### Event Manipulation Logic
```javascript
describe('Event Manipulation', () => {
  test('should move event to new time slot', () => {
    const originalEvent = createTestEvent();
    const newPosition = { dayIndex: 0, minutes: 480 }; // 8:00 AM
    const result = moveEvent(originalEvent, newPosition);
    expect(result.start_time).toBe('2024-01-01T08:00:00Z');
  });
  
  test('should resize event duration', () => {
    const event = createTestEvent();
    const newEndMinutes = 540; // 9:00 AM
    const result = resizeEvent(event, newEndMinutes);
    expect(getEventDuration(result)).toBe(60); // 1 hour
  });
});
```

#### Collision Detection Tests
```javascript
describe('Collision Detection', () => {
  test('should detect overlapping events', () => {
    const events = [createTestEvent(), createOverlappingEvent()];
    const result = collisionDetector.detectCollisions(events[0], events);
    expect(result.hasCollisions).toBe(true);
    expect(result.overlappingEvents).toHaveLength(1);
  });
  
  test('should calculate correct merge bounds', () => {
    const events = [
      createEventWithTime('08:00', '09:00'),
      createEventWithTime('08:30', '10:00')
    ];
    const bounds = collisionDetector.calculateMergeBounds(events);
    expect(bounds.startMinutes).toBe(480); // 8:00 AM
    expect(bounds.endMinutes).toBe(600); // 10:00 AM
  });
});
```

### Integration Tests

#### User Interaction Flows
```javascript
describe('User Interaction Flows', () => {
  test('should complete drag and drop operation', async () => {
    const { getByTestId } = render(<WeeklyCalendar {...props} />);
    const event = getByTestId('calendar-event-1');
    
    fireEvent.mouseDown(event, { clientY: 100 });
    fireEvent.mouseMove(document, { clientY: 200 });
    fireEvent.mouseUp(document);
    
    expect(mockOnEventMove).toHaveBeenCalledWith(
      'event-1',
      expect.any(String),
      expect.any(String)
    );
  });
  
  test('should merge overlapping events', async () => {
    // Test complete merge workflow
  });
});
```

### Performance Tests

#### Drag Performance Benchmarks
```javascript
describe('Performance Tests', () => {
  test('should maintain 60fps during drag operations', async () => {
    const monitor = new PerformanceMonitor();
    monitor.startMonitoring();
    
    // Simulate intensive drag operation
    await simulateDragOperation(100); // 100 events
    
    monitor.stopMonitoring();
    expect(monitor.metrics.averageFrameTime).toBeLessThan(16.67);
  });
  
  test('should handle collision detection efficiently', () => {
    const events = generateTestEvents(500);
    const startTime = performance.now();
    
    collisionDetector.detectCollisions(events[0], events);
    
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(5); // 5ms max
  });
});
```

### Visual Regression Tests

#### Manipulation State Rendering
```javascript
describe('Visual States', () => {
  test('should render drag preview correctly', () => {
    const component = render(
      <WeeklyCalendar 
        {...props} 
        manipulationState={{ mode: 'drag', activeEventId: '1' }}
      />
    );
    expect(component).toMatchSnapshot();
  });
  
  test('should show merge preview with correct styling', () => {
    // Test merge preview visual state
  });
});
```

## Implementation Phases

### Phase 1: Availability Discovery Foundation (Week 1)
- Implement visual availability indicators across the calendar
- Add availability discovery modes (find-available, check-conflicts, suggest-optimal)
- Create basic availability analysis engine
- Implement flexible selection modes (single, multiple, range) with availability awareness

### Phase 2: Smart Availability Analysis (Week 2)
- Implement comprehensive availability analysis engine
- Add intelligent conflict detection with detailed explanations
- Create AI-powered alternative suggestion system
- Implement optimal time recommendations based on user patterns
- Enhanced visual feedback for all availability states

### Phase 3: Event Manipulation for Admin Users (Week 3)
- Add event drag and resize functionality for admin users
- Implement event merging and deletion capabilities
- Create role-based interaction modes
- Advanced visual feedback and animations

### Phase 4: Cross-Day Selection & Performance (Week 4)
- Implement cross-day selection support (when allowCrossDaySelection is true)
- Performance optimization for large event sets
- Comprehensive test suite covering all user scenarios
- Polish and accessibility improvements

## Performance Considerations

### Optimization Strategies

#### 1. Collision Detection Optimization
- **Spatial Partitioning**: Divide calendar into time-based grid cells
- **Early Exit**: Stop checking when no more overlaps possible
- **Memoization**: Cache collision results for unchanged events
- **Throttling**: Limit collision checks to 60fps maximum

#### 2. Rendering Optimization
- **Virtual Scrolling**: Only render visible time slots for large calendars
- **RAF Batching**: Batch DOM updates using requestAnimationFrame
- **CSS Transforms**: Use transform3d for hardware acceleration
- **Selective Re-rendering**: Only update affected events during manipulation

#### 3. Memory Management
- **Event Pooling**: Reuse event objects to reduce garbage collection
- **Cleanup**: Remove event listeners and cancel animations on unmount
- **Debouncing**: Debounce expensive operations like merge calculations

### Performance Monitoring Integration

```javascript
const enhancedPerformanceMonitor = {
  // Extend existing monitor with manipulation metrics
  recordDragOperation: (duration, eventCount) => {
    // Track drag performance metrics
  },
  
  recordCollisionDetection: (duration, eventCount, collisionCount) => {
    // Track collision detection performance
  },
  
  recordMergeOperation: (duration, mergedEventCount) => {
    // Track merge operation performance
  }
};
```

## Security Considerations

### Input Validation
- Validate all time boundaries to prevent invalid dates
- Sanitize event data before manipulation
- Prevent manipulation of events user doesn't have permission to modify

### State Integrity
- Validate manipulation operations before applying
- Implement rollback mechanisms for failed operations
- Prevent race conditions in concurrent manipulations

## Accessibility Considerations

### Keyboard Navigation
- Tab navigation through manipulable events
- Arrow keys for fine-grained positioning
- Enter/Space for activating manipulation modes
- Escape for canceling operations

### Screen Reader Support
- ARIA labels for manipulation states
- Live regions for announcing drag/resize operations
- Descriptive text for merge operations

### Visual Accessibility
- High contrast mode support for manipulation indicators
- Reduced motion support for animations
- Clear visual distinction between manipulation states