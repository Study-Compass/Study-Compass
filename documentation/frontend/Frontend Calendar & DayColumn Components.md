# Frontend: Calendar & DayColumn Components

Created by: James Liu
Created time: March 27, 2024 1:28 PM
Tags: Frontend, UI

## **Overview**

The **`Calendar`** component provides a weekly view for scheduling or displaying events, while the **`DayColumn`** component represents each day within the calendar. Together, they offer a detailed view of daily events, support for adding or removing queries (such as free time slots), and visual feedback for user interactions. These components are designed to be flexible, allowing integration into applications that require scheduling features, such as room booking or class schedules.

## **Features**

- **Dynamic Data Loading:** Displays events based on the provided data, with support for loading states.
- **Interactive Time Selection:** Users can select time slots directly on the calendar, which can be used to query free times or schedule new events.
- **Abbreviation Support:** Handles day abbreviations and maps them to their full names or vice versa, enhancing readability.
- **Color Coding:** Events can be color-coded for quick identification, with colors dynamically assigned to different event types.
- **Responsive Design:** Adapts to different screen sizes, providing a clean and usable interface on both desktop and mobile devices.

## **Props**

### **Calendar**

- **`className`**: name of the classroom currently being displayed (i know the name is bad, i’m too lazy though)
- **`data`**: The event data to be displayed in the calendar, typically fetched from an API.
- **`isLoading`**: A boolean to indicate if the data is currently being loaded, allowing the display of loading indicators.
- **`addQuery`**, **`removeQuery`**: Functions to handle the addition and removal of queries, such as selecting free time slots.
- **`query`**: An object representing the current state of selected queries (time slots).

### **DayColumn**

- **`day`**: A string representing the day of the week.
- **`dayEvents`**: An array of event objects to be displayed for a given day.
- **`eventColors`**: A **`Map`** object used for storing and retrieving colors assigned to different events.
- **`empty`**: A boolean indicating if the day column should allow interactions for selecting time slots.
- **`add`**, **`remove`**: Functions passed from the **`Calendar`** to add or remove selected time slots.
- **`queries`**: An object representing the current state of selected queries, passed from the **`Calendar`**

## **State Management**

- Internal states manage user interactions, such as selection start and end times (**`selectionStart`**, **`selectionEnd`**), and whether the user is currently selecting a time slot (**`isSelecting`**).

## **Key Functions and Hooks**

- **`handleMouseDown`**, **`handleMouseMove`**, **`handleMouseUp`**: Manage the user's selection of time slots by updating state based on mouse events.
- **`useEffect`** hooks: Perform actions on component updates, such as clearing colors when data changes or managing loading states.

## **Styling**

Styling is managed via CSS classes defined in **`Calendar.css`** and **`DayColumn.css`**. These styles can be customized to fit the design requirements of the application.

## **Usage**

The **`Calendar`** component is designed to be used in applications that require a visual representation of weekly schedules. It is particularly suited for displaying available time slots, booked events, or class schedules. The **`DayColumn`** component is used internally by **`Calendar`** but follows a similar design philosophy, focusing on displaying daily events within the provided framework.

Example of integration:

```jsx
<Calendar
  className="custom-class"
  data={fetchedData}
  isLoading={dataLoading}
  addQuery={handleAddQuery}
  removeQuery={handleRemoveQuery}
  query={currentQuery}
/>
```

This setup assumes **`fetchedData`**, **`dataLoading`**, **`handleAddQuery`**, **`handleRemoveQuery`**, and **`currentQuery`** are managed by the parent component, which passes them as props to the **`Calendar`**.

## **Notes**

- Ensure that the data passed to the **`Calendar`** component is in the expected format, with day keys and event arrays.
- Customize the **`addQuery`** and **`removeQuery`** functions to integrate with your application's specific requirements for handling time slot selections.
- The color coding for events is managed dynamically but can be customized or extended based on specific needs.