# Middleware: Token Validation

Created by: James Liu
Created time: May 8, 2024 5:58 PM
Tags: Middleware

### **Documentation for JWT Token Verification Middleware**

This module provides two middleware functions for handling JWT (JSON Web Token) verification in a Node.js application using Express.js. These functions help manage user authentication by checking the presence and validity of tokens in request headers.

### **1. `verifyToken`**

**`verifyToken`** is a middleware that strictly requires a valid JWT for the request to proceed.

**Parameters:**

- **`req`** (Object): The request object from Express.js.
- **`res`** (Object): The response object from Express.js.
- **`next`** (Function): A callback function that passes control to the next middleware function.

**Usage:**
Attach **`verifyToken`** to any route to require authentication:

```jsx
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route' });
});
```

**Behavior:**

- Extracts the token from the **`Authorization`** header (expected in the format **`Bearer TOKEN`**).
- If no token is present, it immediately ends the request and sends a 401 status code (Unauthorized).
- If a token is present but invalid or expired, it ends the request and sends a 403 status code (Forbidden).
- If the token is valid, it adds the decoded user information to **`req.user`** and passes control to the next middleware or route handler.

### **2. `verifyTokenOptional`**

**`verifyTokenOptional`** is a middleware that allows the request to proceed regardless of the JWT's presence or validity but attaches user info if the JWT is valid.

**Parameters:**

- **`req`** (Object): The request object from Express.js.
- **`res`** (Object): The response object from Express.js.
- **`next`** (Function): A callback function that passes control to the next middleware function.

**Usage:**
Attach **`verifyTokenOptional`** to routes where authentication is optional but recognized if provided:

```jsx
router.get('/optional-auth', verifyTokenOptional, (req, res) => {
  if (req.user) {
    res.json({ message: 'Authenticated request', user: req.user });
  } else {
    res.json({ message: 'Unauthenticated request' });
  }
});
```

**Behavior:**

- Extracts the token from the **`Authorization`** header (expected in the format **`Bearer TOKEN`**).
- If no token is present, simply moves to the next middleware or route handler without adding user info.
- If a token is present and valid, adds the decoded user information to **`req.user`**.
- Proceeds with the request regardless of token validity, allowing flexibility in route protection.

**Security Note:**
Both middleware functions depend on the **`JWT_SECRET`** environment variable for token verification. Ensure that this secret is kept secure and is only known to the server.

These middleware functions help enforce security policies on routes while providing flexibility in how strictly these policies are enforced.