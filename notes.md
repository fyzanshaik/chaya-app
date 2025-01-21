### Basic route structure

```
/api/
  /auth/
    /login
    /logout
  /farmers/
    /[id]     // GET, PUT, DELETE
    /create   // POST
    /list     // GET with pagination/filters
  /users/     // admin only
    /create
    /list
    /[id]
  /documents/
    /upload
    /download/[id]
```

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant S as Server (Next.js)
    participant DB as Database

    C->>S: POST /api/auth/login {email, password}

    S->>DB: Find user by email
    DB-->>S: Return user data

    Note over S: Hash provided password<br/>Compare with stored hash

    alt Invalid Credentials
        S-->>C: 401 Unauthorized
    else Valid Credentials
        Note over S: Create session token<br/>{userId, role, exp}
        S->>S: Set HTTP-only cookie<br/>with session token
        S-->>C: 200 OK + Set-Cookie header<br/>{user data without password}
        Note over C: Browser stores cookie<br/>automatically
    end

    Note over C,S: Future requests will<br/>automatically include cookie
```
