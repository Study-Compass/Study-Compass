# Frontend: Room Page

Created by: James Liu
Created time: March 27, 2024 12:34 PM
Tags: Frontend, UI

## **Overview**

The **`Room`** component serves as a core part of the application, facilitating the display and interaction with classroom or room data. It integrates several subcomponents and utilizes hooks for state management, routing, and context access. Its primary functionalities include:

- Displaying information about a specific room or classroom.
- Handling room searches and displaying results.
- Managing and displaying queries for available rooms based on selected timeslots.
- Adjusting its layout and content dynamically based on the application's state and the viewport width.

Caution:

The `Room` component is by far the most complex component/page in the frontend, and so changes to it can have far reaching and meaningful implications, as it is deeply intertwined with other components, be careful.

## **Key Features**

- **Responsive Design:** Adapts its layout for mobile and desktop views.
- **Dynamic Content Loading:** Fetches and displays room data based on URL parameters and user interactions.
- **Search Functionality:** Supports searching for rooms by name or availability.
- **Calendar Integration:** Includes a calendar component for selecting availability slots and querying free rooms accordingly.
- **Error Handling:** Integrates with an error context for managing application-wide error states.

## **State Management**

The component utilizes React's **`useState`** and **`useEffect`** hooks for local state management, along with context hooks like **`useAuth`** and custom hooks such as **`useCache`** and **`useError`** for accessing shared application states and functionalities.

### **Local States**

- **`room`**, **`rooms`**, **`roomIds`**: Manage the current room data, list of all rooms, and a mapping of room IDs, respectively.
- **`data`**, **`loading`**, **`calendarLoading`**: Control the display of fetched room data and loading states.
- **`contentState`**: Tracks the current content display state to adjust the UI accordingly.
- **`results`**, **`loadedResults`**, **`numLoaded`**: Manage the search results display, including pagination or batching of loaded results.
- **`query`**, **`noquery`**, **`searchQuery`**: Handle the state of search queries and flags for their presence.
- **`width`**, **`viewport`**: Manage viewport dimensions for responsive design considerations.
- **`showMobileCalendar`**: Controls the visibility of the mobile calendar view.

### **Effects**

Multiple **`useEffect`** hooks are used to:

- Handle component resizing for responsive layouts.
- Fetch initial room data and manage room IDs, or initial search query
- React to changes in the URL parameters, application state, or search queries to fetch and display relevant room or search data.

## **Functions**

note: most implementations of these functions can be found in RoomHelpers.js, component would be far too cluttered if they were included in main definition

- **`fetchData`**, **`fetchFreeRooms`**, **`fetchFreeNow`**, **`fetchSearch`**: Async functions for fetching room or search-related data.
- **`addQuery`**, **`removeQuery`**, **`clearQuery`**: Manage the construction and deconstruction of search queries based on user interactions.
- **`changeURL`**, **`changeURL2`**: Navigate to different rooms or search results.
- **`onX`**: Resets the component state to its initial condition, typically following a search clear action.
- **`debouncedFetchData`**: A debounced wrapper around **`fetchData`** to limit the frequency of fetch calls during rapid state changes.

## **Subcomponents and External Components**

- **`Calendar`**, **`MobileCalendar`**: Components for displaying and interacting with the calendar view.
- **`Classroom`**: Displays detailed information about a specific classroom or room.
- **`Results`**: Manages and displays the results of room searches.
- **`Header`**, **`SearchBar`**: Utility components for the application's layout and functionality.

## **Usage**

This component is intended to be used as part of a larger application that manages room or classroom data. It requires the surrounding infrastructure to provide context providers (**`CacheContext`**, **`ErrorContext`**), hooks (**`useAuth`**), and routing (**`useParams`**, **`useNavigate`**) to function correctly.

## **Notes**

- This component is designed for flexibility and can be adapted or extended based on specific application needs.
- Ensure that all dependencies, especially context providers and hooks, are correctly implemented in the application for this component to function as intended.
- The responsive design and dynamic content loading are key aspects of this component, making it suitable for a wide range of devices and use cases.

[https://www.notion.so](https://www.notion.so)

[https://www.notion.so](https://www.notion.so)

[https://www.notion.so](https://www.notion.so)