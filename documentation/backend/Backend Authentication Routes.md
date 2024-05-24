# Backend: Authentication Routes

Created by: James Liu
Created time: February 22, 2024 2:28 PM
Tags: Authentication, Backend

## Authentication API Endpoints

This API provides endpoints for managing user authentication, including registration, login, and token validation. It also supports logging in through Google OAuth.

### Endpoints

### POST /register

Registers a new user with a username, email, and password.

### Request Body

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "yourpassword"
}

```

### Responses

- **201 Created**
    - Description: User registered successfully.
    - Body:
        
        ```json
        {
          "success": true,
          "message": "User registered successfully",
          "data": {
            "token": "jwt.token.here"
          }
        }
        
        ```
        
- **400 Bad Request**
    - Description: Username or email already taken.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Email and/or username are taken"
        }
        
        ```
        
- **500 Internal Server Error**
    - Description: Error registering new user.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Error registering new user"
        }
        
        ```
        

### POST /login

Authenticates a user and returns a token.

### Request Body

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}

```

### Responses

- **200 OK**
    - Description: Logged in successfully.
    - Body:
        
        ```json
        {
          "success": true,
          "message": "Logged in successfully",
          "data": {
            "token": "jwt.token.here",
            "user": {
              "_id": "user_id",
              "username": "username",
              "email": "email@example.com",
              "picture": "url/to/picture",
              "admin": false,
              "saved": []
            }
          }
        }
        
        ```
        
- **500 Internal Server Error**
    - Description: Login failed.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Login failed"
        }
        
        ```
        

### GET /validate-token

Validates the user's token and returns user details if valid.

### Headers

- **Authorization**: Bearer jwt.token.here

### Responses

- **200 OK**
    - Description: Token is valid.
    - Body:
        
        ```json
        {
          "success": true,
          "message": "Token is valid",
          "data": {
            "user": {
              "_id": "user_id",
              "username": "username",
              "email": "email@example.com",
              "picture": "url/to/picture",
              "admin": false,
              "saved": []
            }
          }
        }
        
        ```
        
- **404 Not Found**
    - Description: User not found.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "User not found"
        }
        
        ```
        
- **500 Internal Server Error**
    - Description: Error fetching user details.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Error fetching user details"
        }
        
        ```
        

### POST /google-login

Logs in a user or registers a new user through Google OAuth.

### Request Body

```json
{
  "code": "authorization_code",
  "isRegister": true
}

```

### Responses

- **200 OK**
    - Description: Google login successful.
    - Body:
        
        ```json
        {
          "success": true,
          "message": "Google login successful",
          "data": {
            "token": "jwt.token.here",
            "user": {
              "_id": "user_id",
              "username": "username",
              "email": "email@example.com",
              "picture": "url/to/picture",
              "admin": false,
              "saved": []
            }
          }
        }
        
        ```
        
- **400 Bad Request**
    - Description: No authorization code provided.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "No authorization code provided"
        }
        
        ```
        
- **500 Internal Server Error**
    - Description: Google login failed.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Google login failed"
        }
        
        ```