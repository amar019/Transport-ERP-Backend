# Labour Management Backend

A backend API service built with Node.js, Express, and MongoDB for managing a Labour Hire / Management System.

---

## 🚀 Getting Started

The crash you encountered (`ERR_MODULE_NOT_FOUND` or nodemon app crashed) occurs because the required packages have not been installed. Follow these setup steps to get the server running.

### 1. Install Dependencies
Run the following command in the project root directory to install all necessary packages defined in `package.json`:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to a new file named `.env` and fill in the configuration details:
```bash
cp .env.example .env
```
Open `.env` and configure your credentials (e.g., database connection string, ports, and JWT secret).

### 3. Run the Server
* **Development Mode** (with hot-reloading enabled via Nodemon):
  ```bash
  npm run dev
  ```
* **Production Mode**:
  ```bash
  npm start
  ```

---

## 📦 Packages Used

Here is an analysis of all the packages defined in your `package.json` and what they do in this application:

### Production Dependencies (`dependencies`)

| Package Name | Version | Description & Role in the Project |
| :--- | :--- | :--- |
| **[express](https://www.npmjs.com/package/express)** | `^5.2.1` | The core web server framework for routing, handling requests/responses, and implementing middleware. |
| **[mongoose](https://www.npmjs.com/package/mongoose)** | `^9.4.1` | An Object Data Modeling (ODM) library for MongoDB. Used to connect to the database and define schemas/models. |
| **[cors](https://www.npmjs.com/package/cors)** | `^2.8.6` | Middleware enabling Cross-Origin Resource Sharing. Essential for allowing your frontend (e.g., React/Vite running on port 5173) to communicate with this backend. |
| **[cookie-parser](https://www.npmjs.com/package/cookie-parser)** | `^1.4.7` | Middleware to parse cookies attached to the client requests. Crucial for secure cookie-based user authentication. |
| **[dotenv](https://www.npmjs.com/package/dotenv)** | `^17.4.1` | Loads configuration variables from your `.env` file into Node's `process.env`. |

### Development Dependencies (`devDependencies`)

| Package Name | Version | Description & Role in the Project |
| :--- | :--- | :--- |
| **[nodemon](https://www.npmjs.com/package/nodemon)** | `^3.1.14` | Monitors your files for changes and automatically restarts the server during development, eliminating the need to stop and start the server manually. |

---

## 📂 Project Structure

This project uses an ES Modules setup (`"type": "module"` in `package.json`) and is structured as follows:

* 📄 **[package.json](file:///c:/Transport-Software/labour-management-backend-main/package.json)** — Contains package metadata, scripts, and dependencies.
* 📄 **[.env.example](file:///c:/Transport-Software/labour-management-backend-main/.env.example)** — Template for the environment variables configuration.
* 📂 **src/** — Main application source directory.
  * 📄 **[index.js](file:///c:/Transport-Software/labour-management-backend-main/src/index.js)** — The server entry point. Loads configurations, establishes the database connection, and spins up the Express server.
  * 📄 **[app.js](file:///c:/Transport-Software/labour-management-backend-main/src/app.js)** — Sets up the Express application, configures global middlewares (CORS, body-parsers, cookie-parsers), registers endpoints, and defines global error and 404 handlers.
  * 📄 **[constants.js](file:///c:/Transport-Software/labour-management-backend-main/src/constants.js)** — Defines global application constants (such as the database name `labour-management`).
  * 📂 **db/**
    * 📄 **[index.js](file:///c:/Transport-Software/labour-management-backend-main/src/db/index.js)** — Mongoose database connection setup logic.
  * 📂 **utils/**
    * 📄 **[asyncHandler.js](file:///c:/Transport-Software/labour-management-backend-main/src/utils/asyncHandler.js)** — A wrapper function to safely handle exceptions in asynchronous Express route handlers and pass them to the global error handler.
    * 📄 **[ApiErrors.js](file:///c:/Transport-Software/labour-management-backend-main/src/utils/ApiErrors.js)** — A custom class to throw standardized API error responses.
    * 📄 **[ApiResponse.js](file:///c:/Transport-Software/labour-management-backend-main/src/utils/ApiResponse.js)** — A standardized class to structure successful API responses.
