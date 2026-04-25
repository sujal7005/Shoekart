# Shoekart

Shoekart is an e-commerce web application for selling shoes. It includes a React-based front end and a Node.js/Express back end with MongoDB for data storage.

## Project Structure

- `client/` - React frontend built with Vite.
- `server/` - Express backend API.

## Features

- Product listing and details
- Shopping cart and checkout flow
- User authentication and profile management
- Admin dashboard for product, category, brand, customer, order, coupon management
- Email and payment integration

## Setup

### Frontend

1. Open a terminal in `client/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend

1. Open a terminal in `server/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

## Notes

- Configure environment variables for the backend (database URI, JWT secret, email settings, payment keys).
- Ensure MongoDB is running and accessible.
- Update CORS or proxy settings if needed for local development.

## Helpful Files

- `client/src/App.jsx` - React application entry point
- `server/index.js` - Express server entry point
- `server/routes/` - API route definitions
- `server/controllers/` - Business logic for endpoints
- `server/models/` - MongoDB schemas

## License

This project does not include a license file by default. Add one if you plan to share or publish the code.
