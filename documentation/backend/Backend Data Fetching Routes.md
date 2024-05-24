# Backend: Data Fetching Routes

Created by: James Liu
Created time: February 22, 2024 2:46 PM
Tags: Backend

## Data Fetching API Endpoints

These endpoints are designed to facilitate data retrieval related to classrooms, schedules, and availability within a school or educational institution's system.

### Endpoints

### GET /getroom/:id

Retrieves details about a specific classroom by its ID.

### Path Parameters

- **id**: Classroom ID or "none" for an empty room object.

### Responses

- **200 OK**
    - Description: Successfully retrieved classroom details or empty room.
    - Body (example for a valid room ID):
        
        ```json
        {
          "success": true,
          "message": "Room found",
          "room": {
            "name": "Room101",
            "_id": "roomID"
          },
          "data": {
            // Schedule details
          }
        }
        ```
        
    - Body (example for "none"):
        
        ```json
        {
          "success": true,
          "message": "Empty room object returned",
          "room": {
            "name": null
          },
          "data": {}
        }
        ```
        
- **404 Not Found**
    - Description: Room not found.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Room not found"
        }
        ```
        
- **500 Internal Server Error**
    - Description: Error retrieving room.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Error retrieving room"
        }
        ```
        

### GET /getrooms

Fetches a dictionary of all classrooms with their names and IDs.

### Responses

- **200 OK**
    - Description: Successfully fetched all room names.
    - Body:
        
        ```json
        {
          "success": true,
          "message": "All room names fetched",
          "data": {
            "Room101": "roomID101",
            "Room102": "roomID102"
            // More rooms
          }
        }
        ```
        
- **500 Internal Server Error**
    - Description: Error fetching room names.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Error fetching room names"
        }
        ```
        

### POST /free

Finds classrooms that are available during specified free periods.

### Request Body

```json
{
  "query": {
    "M": [
      {
        "start_time": 900,
        "end_time": 1020
      }
    ],
    "W": [
      {
        "start_time": 690,
        "end_time": 930
      }
     ]
    // More days can be included
  }
}
```

note: start and end times are repesented by minutes from midnight

### Responses

- **200 OK**
    - Description: Successfully found rooms available during specified periods.
    - Body:
        
        ```json
        {
          "success": true,
          "message": "Rooms available during the specified periods",
          "data": ["Room101", "Room103"]
        }
        
        ```
        
- **500 Internal Server Error**
    - Description: Error finding free rooms.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Error finding free rooms"
        }
        
        ```
        

### POST /getbatch

Retrieves batch data for multiple queries.

### Request Body

```json
{
  "queries": ["roomID101", "roomID102"],
  "exhaustive": true
}

```

### Responses

- **200 OK**
    - Description: Successfully retrieved room and schedule data for multiple queries.
    - Body:
        
        ```json
        {
          "success": true,
          "message": "Rooms found",
          "data": [
            {
              "room": {
                "name": "Room101",
                "_id": "roomID101"
              },
              "data": {
                // Schedule details
              }
            },
            {
              "room": {
                "name": "Room102",
                "_id": "roomID102"
              },
              "data": {
                // Schedule details
              }
            }
          ]
        }
        ```
        
- **500 Internal Server Error**
    - Description: Error retrieving data.
    - Body:
        
        ```json
        {
          "success": false,
          "message": "Error retrieving data"
        }
        ```
        

### **Additional Notes**

- The **`/getroom/:name`** endpoint includes special handling for a parameter value of **`"none"`**, returning an empty classroom object. This can be useful for applications that need to display a placeholder or default state when no specific room is selected.
- The **`/free`** endpoint requires clients to structure their query carefully, specifying the free periods for each day they are interested in. This allows for flexible querying based on varying daily schedules.
- All responses include a **`success`** boolean to quickly indicate the outcome of the request, a **`message`** providing details about the response or any errors, and a **`data`** object or array containing the requested information or results.

**