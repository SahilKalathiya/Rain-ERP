# ERP Rain (Preclinic - Medical & Hospital ERP)

This project contains a client-side React SPA (Vite + Bootstrap 5) for the Preclinic Hospital & Medical Management ERP dashboard.

## How to Run on Localhost

Because this application uses modern ES modules (`<script type="module">`) and React Router, it requires a local web server (opening the `.html` file directly using `file:///` causes browser CORS/module errors).

### Option 1: Double-Click (Easiest on Windows)
Simply double-click [`start.bat`](start.bat). It will launch the local server and automatically open your default browser.

### Option 2: Using Node / NPM (Terminal)
Open terminal in this directory and run:
```bash
npm start
```
or
```bash
node server.js
```

### Accessing the Application
- Open: [http://localhost:3000](http://localhost:3000)
- The server will automatically redirect to the login and dashboard view:
  `http://localhost:3000/react/dashboard`

### Features of the Local Server
- **Zero external dependencies**: Built using standard Node.js libraries.
- **SPA routing support**: Automatically handles all React sub-routes (e.g., `/react/dashboard`, `/react/doctor`, `/react/login`, etc.).
- **Missing asset cache**: Automatically proxies and caches any missing images on first visit so they are available offline.
