# Frontend: SearchBar Component

Created by: James Liu
Created time: March 27, 2024 1:21 PM
Tags: Frontend, UI

## **Overview**

The **`SearchBar`** component is a customizable search bar designed for applications requiring a search functionality with autocomplete and support for abbreviations. It provides visual feedback on matching results as the user types, supports keyboard navigation, and allows users to select a result either by clicking on it or pressing the Enter key. Additionally, it incorporates an abbreviated versions feature for specific terms.

## **Features**

- **Dynamic Search Results:** Updates search results in real-time as the user types, filtering based on input.
- **Abbreviation Support:** Can handle both full names and their corresponding abbreviations for defined terms.
- **Keyboard Navigation:** Allows users to navigate through the search results using the Arrow keys and to select a result with the Enter key.
- **Custom Actions:** Supports custom functions to be called on selecting a result or executing a search.
- **Responsive Design:** Adapts its appearance based on focus state and provides a clear button when input is not empty.

## **Props**

- **`data`**: An array of strings representing all searchable items.
- **`onEnter`**: A function that is called when a user selects a result or presses the Enter key. It receives the selected item as its argument.
- **`onSearch`**: A function called when the Enter key is pressed without selecting a specific result. Useful for handling general search queries.
- **`room`**: A string that prepopulates the search bar with an initial value, representing the current room or search term.
- **`onX`**: A function called when the clear button (marked with an 'x') is clicked.

## **State Management**

- **`searchInput`**: Controls the input value of the search bar.
- **`results`**: An array of search results filtered from the **`data`** prop based on the user's input.
- **`isFocused`**: Indicates whether the search bar is currently focused.
- **`selected`**: An index marking the currently highlighted result in the dropdown list.

## **Key Functions**

### **handleInputChange**

Updates the **`searchInput`** state as the user types in the search bar.

### **next**

Handles the action when the Enter key is pressed, either executing a search or selecting the currently highlighted result.

### **handleKeyDown**

Manages keyboard interactions, including navigation through results and selection.

### **click**

Handles the selection of a search result when clicked with the mouse.

### **handleX**

Clears the current search input and executes the **`onX`** prop function.

## **Usage**

The **`SearchBar`** component can be integrated into any application that requires a search functionality with support for keyboard navigation and abbreviation matching. It requires the parent component to provide searchable data and handle the selection of items from the search results.

Example:

```jsx
<SearchBar
  data={['Darrin Communications Center', 'Jonsson Engineering Center']}
  onEnter={(selectedItem) => console.log('Selected:', selectedItem)}
  onSearch={(query) => console.log('Search Query:', query)}
  room="Darrin Communications Center"
  onX={() => console.log('Search cleared')}
/>
```

## **Notes**

- Ensure the **`data`** prop contains all searchable items
- The **`onEnter`** and **`onSearch`** functions must be defined to handle the selection of items and execution of search queries, respectively.
- The component is designed to be flexible and easily integrated into larger applications requiring search capabilities.