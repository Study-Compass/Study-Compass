# Frontend: SearchBar Component

Created by: James Liu
Created time: March 27, 2024 1:21 PM
Tags: Frontend, UI

## **Overview**

The **`SearchBar`** component is a customizable search bar designed for Study Compass requiring a search functionality with autocomplete and support for abbreviations. It provides visual feedback on matching results as the user types, supports keyboard navigation, and allows users to select a result either by clicking on it or pressing the Enter key. Additionally, it incorporates an abbreviated versions feature for specific terms.

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
- **`dataAbb`**: (**`array`**) An array that includes both the full names and their corresponding abbreviations derived from the **`data`** prop.

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

## Key useEffect Hooks

### **Effect to Handle Abbreviations**

```jsx
useEffect(() => {
    if(!data){return}
    let newData = [...data];
    data.map(item => {
        if(removeLastWord(item) in abbreviations){
            newData.push(abbreviations[removeLastWord(item)]+" "+item.split(' ').pop());
        }
    });
    setDataAbb(newData);
}, [data]);
```

- **Purpose:** Adds support for abbreviations by creating a new data array that includes both full names and their corresponding abbreviations.
- **Dependencies:** Runs whenever the **`data`** prop changes.
- **Explanation:** It checks each item in the **`data`** array, and if the item's base name matches an abbreviation, it adds the abbreviated version to the new data array (**`newData`**). The updated array is then set to the **`dataAbb`** state.

### **Effect to Filter Results Based on Search Input**

```jsx
useEffect(() => {
    setSearchInput(searchInput.toLowerCase());
    if(searchInput === "none"){
        setSearchInput("");
    }
    if (searchInput === '' || !isFocused) {
        setResults([]);
        setLower("");
    } else {
        setSelected(0);
        const filteredResults = dataAbb.filter(item =>
            item.toLowerCase().startsWith(searchInput)
        );
        const newfilteredResults = dataAbb.filter(item => {
            const includesSearchInput = item.toLowerCase().includes(searchInput.toLowerCase());
            const notInResults = !results.includes(item);
            return includesSearchInput && notInResults;
        });
        filteredResults.push(...newfilteredResults);
        if (filteredResults.length === 0) {
            filteredResults.push("no results found");
            setLower("");
        } else {
            if(filteredResults.length > 1){
                if(filteredResults[0].toLowerCase().startsWith(searchInput.toLowerCase())){
                    setLower(filteredResults[0].toLowerCase());
                } else {
                    setLower("");
                }
            }
        }
        setResults(filteredResults);
    }
}, [searchInput, dataAbb]);
```

- **Purpose:** Filters the search results based on the current **`searchInput`**.
- **Dependencies:** Runs whenever the **`searchInput`** or **`dataAbb`** state changes.
- **Explanation:** Handler for the general search logic. It normalizes the **`searchInput`** to lowercase and checks if it's empty or if the search bar is not focused. If either condition is true, it clears the results and **`lower`** state. Otherwise, it filters **`dataAbb`** based on whether items start with the **`searchInput`** and updates the results accordingly. It then filters dataAbb for items that include the **`searchInput`** but don’t start with the **`searchInput`**, appending those entries to the end (first display search results that start with query, then display search results that include query).

## **Usage**

The **`SearchBar`** component is used in Study Compass for the nameSearch, allowing users to search for classrooms by name. All classroom names are passed into the search bar. The **`SearchBar`** component can be integrated into any application that requires a search functionality with support for keyboard navigation and abbreviation matching. It requires the parent component to provide searchable data and handle the selection of items from the search results.

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