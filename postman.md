# API Routes Documentation

## Authentication

### POST - Login

-  **Endpoint**: `http://localhost:3000/api/auth/login`
-  **Body** (raw - JSON):
   ```json
   {
   	"email": "admin1@test.com",
   	"password": "admin123"
   }
   ```

### POST - Logout

-  **Endpoint**: `http://localhost:3000/api/auth/logout`

---

## Test

### GET - Test

-  **Endpoint**: `http://localhost:3000/api/test`

---

## Users

### POST - Create User

-  **Endpoint**: `http://localhost:3000/api/users`
-  **Body** (raw - JSON):
   ```json
   {
   	"email": "staff1@test.com",
   	"password": "staff123",
   	"name": "John Staff"
   }
   ```

### GET - Get Users

-  **Endpoint**: `http://localhost:3000/api/users`

### PUT - Toggle User Status

-  **Endpoint**: `http://localhost:3000/api/users/[id]/toggle-status`
-  **Description**: Toggles the active status of a user.

---

## Farmers

### POST - Create Farmer

-  **Endpoint**: `http://localhost:3000/api/farmers`
-  **Body** (form-data):
   -  `farmerName`: John Smith
   -  `relationship`: SELF
   -  `gender`: MALE
   -  `community`: General
   -  `aadharNumber`: 123456789011
   -  `contactNumber`: 9876543210
   -  `state`: Karnataka
   -  `district`: Bangalore Rural
   -  `mandal`: Devanahalli
   -  `village`: Vishwanathapura
   -  `panchayath`: Vishwanathapura1
   -  `dateOfBirth`: 1990-05-15
   -  `age`: 33
   -  `ifscCode`: SBIN0125640
   -  `accountNumber`: 89674523145
   -  `branchName`: Devanahalli Branch
   -  `bankAddress`: Main Road, Devanahalli
   -  `bankName`: State Bank of India
   -  `bankCode`: SBI1234
   -  `fields`:
      ```json
      [
      	{ "areaHa": "5.5", "yieldEstimate": "2000", "location": "{\"lat\":13.2468,\"lng\":77.7134}" },
      	{ "areaHa": "3.2", "yieldEstimate": "1500", "location": "{\"lat\":13.2470,\"lng\":77.7136}" }
      ]
      ```
   -  `profilePic`: (file)
   -  `aadharDoc`: (file)
   -  `fieldDoc_0`: (file)
   -  `fieldDoc_1`: (file)
   -  `bankDoc`: (file)

### GET - Pagination

-  **Endpoint**: `http://localhost:3000/api/farmers?page=1&limit=10`
-  **Query Params**:
   -  `page`: 1
   -  `limit`: 10

### GET - Search Farmer

-  **Endpoint**: `http://localhost:3000/api/farmers?search=John`
-  **Query Params**:
   -  `search`: John

### GET - Search Farmer by State

-  **Endpoint**: `http://localhost:3000/api/farmers?state=Telangana`
-  **Query Params**:
   -  `state`: Telangana

### GET - Search Farmer by Survey Number

-  **Endpoint**: `http://localhost:3000/api/farmers/?surveyNumber=DJNS1391377`
-  **Query Params**:
   -  `surveyNumber`: DJNS1391377

### PUT - Edit Farmer

-  **Endpoint**: `http://localhost:3000/api/farmers/[id]`
-  **Body** (form-data):
   -  `farmerName`: edited name 2

### DELETE - Delete Farmer

-  **Endpoint**: `http://localhost:3000/api/farmers/[surveyNumber]`
   -  Example: `http://localhost:3000/api/farmers/TKYO7877204`

---

## Documents

### GET - Get Document URL

-  **Endpoint**: `http://localhost:3000/api/documents/[type]/[id]/url`
   -  Example: `http://localhost:3000/api/documents/aadhar/FWON7464748/url`

---

## Export

### POST - Export Farmers

-  **Endpoint**: `http://localhost:3000/api/export/farmers`
-  **Body** (raw - JSON):
   ```json
   {
   	"options": {
   		"format": "EXCEL", // or 'PDF' or 'CSV'
   		"range": "ALL"
   	}
   }
   ```

---

## Folder Structure Reference

```
── 📁 app/
│   ├── 📁 api/
│   │   ├── 📁 auth/
│   │   │   ├── 📁 login/
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 logout/
│   │   │       └── 📄 route.ts
│   │   ├── 📁 documents/
│   │   │   └── 📁 [type]/
│   │   │       └── 📁 [id]/
│   │   │           └── 📁 url/
│   │   │               └── 📄 route.ts
│   │   ├── 📁 export/
│   │   │   └── 📁 farmers/
│   │   │       └── 📄 route.ts
│   │   ├── 📁 farmers/
│   │   │   ├── 📁 [id]/
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📄 route.ts
│   │   ├── 📁 test/
│   │   │   └── 📄 route.ts
│   │   └── 📁 users/
│   │       ├── 📁 [id]/
│   │       │   └── 📁 toggle-status/
│   │       │       └── 📄 route.ts
│   │       └── 📄 route.ts
```

---

### Notes:

-  Replace `[id]`, `[type]`, and `[surveyNumber]` with actual values when making requests.
-  For file uploads (e.g., `profilePic`, `aadharDoc`), ensure the files are correctly attached in the request.

```

This markdown document provides a clear and structured overview of your API routes, making it easy to reference and use.
```
