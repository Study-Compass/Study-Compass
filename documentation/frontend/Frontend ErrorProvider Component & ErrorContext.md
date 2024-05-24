# Frontend: ErrorProvider Component & ErrorContext

Created by: James Liu
Created time: March 27, 2024 12:59 PM
Tags: Frontend

## **Overview**

The **`ErrorProvider`** component is designed to manage application-wide error handling in a React application. It provides a systematic way to handle errors, log them, and navigate the user to a designated error page. The component uses a context (**`ErrorContext`**) to allow child components to trigger error handling mechanisms and access error information conveniently.

notes:

This context is meant to prevent breakage at all costs. When writing code, make sure to wrap all code that has even a tiny percentage of breakage or throwing an error in try catch blocks (see more in usage). 

## **Functionality**

- **Error Handling:** Centralizes the logic for handling errors throughout the application.
- **Error Logging and Storage:** Logs errors to the console and stores the error message in local storage for access on the error page.
- **Navigation to Error Page:** Utilizes a **`navigate`** function (presumably passed from React Router's **`useNavigate`**) to redirect users to a generic error page.

## **Key Hooks**

- **`createContext`** and **`useContext`**: Used to create and consume the error context throughout the application.

## **Provided Functions**

### **newError**

Accepts an error object and a **`navigate`** function. It logs the error to the console, stores the error message in local storage, and navigates the user to a designated error page. This function is designed to be called within catch blocks or error handling functions across the application.

### **getError**

Returns the last error message stored in local storage. This function can be used on the error display page to retrieve and show the error message to the user.

## **Context**

- **ErrorContext:** Provides child components with access to error handling functions, allowing them to trigger error handling and retrieve error information.

## **Usage**

Wrap the root component of your application with the **`ErrorProvider`** to make the error handling functions available throughout your application:

```jsx
<ErrorProvider>
  <App />
</ErrorProvider>
```

Consume the context in child components to handle errors and access error information:

```jsx
const { newError, getError } = useError();
```

Example of handling an error:

```jsx
try {
  // Potentially failing operation
} catch (error) {
  newError(error.message, navigate);
}
```

## **Error Handling Strategy**

The provided mechanism is a basic example of centralized error handling. It's recommended to extend this approach by considering different types of errors, user-friendly error messages, and possibly retry mechanisms for recoverable errors.

## **Dependencies**

- **React Router's `useNavigate`**: It's implied that **`navigate`** function should be provided by the caller, usually obtained from React Router's **`useNavigate`** hook, for redirecting users to an error page.

## **Props**

- **children**: The child components that **`ErrorProvider`** will wrap. This pattern allows **`ErrorProvider`** to function as a context provider that encapsulates the entire application or a specific part of it that requires error handling.

## **Notes**

- Considering implementing a more detailed error logging mechanism or integrating with external error tracking services for production applications.