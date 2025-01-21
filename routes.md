# API Routes Documentation

## Authentication

### Login

-  **Route**: `/api/auth/login`
-  **Method**: POST
-  **Protected**: No

### Logout

-  **Route**: `/api/auth/logout`
-  **Method**: POST
-  **Protected**: Yes

## User Management

### List/Create Users

-  **Route**: `/api/users`
-  **Methods**:
   -  GET (list users)
   -  POST (create staff)
-  **Protected**: Admin Only

### Toggle User Status

-  **Route**: `/api/users/[id]/toggle-status`
-  **Method**: POST
-  **Protected**: Admin Only

## Farmer Management

### List/Create Farmers

-  **Route**: `/api/farmers`
-  **Methods**:
   -  GET (list farmers)
   -  POST (create farmer)
-  **Protected**: Staff & Admin

### Single Farmer Operations

-  **Route**: `/api/farmers/[id]`
-  **Methods**:
   -  GET (get details)
   -  PUT (update)
   -  DELETE (remove)
-  **Protected**: GET (All), PUT/DELETE (Admin Only)

## Document Management

### Get Document URL

-  **Route**: `/api/documents/[type]/[id]/url`
-  **Method**: GET
-  **Protected**: Yes
-  **Types**: profile-pic, aadhar, bank, land

## Export

### Export Farmers Data

-  **Route**: `/api/export/farmers`
-  **Method**: POST
-  **Protected**: Admin Only

## Test Route

### Auth Test

-  **Route**: `/api/test`
-  **Method**: GET
-  **Protected**: Yes
