const user = require("../models/user");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const asyncErrorHandler = require("./asyncErrorHandler");
const errorHandler = require("../utils/errorHandler");

const adminOnly = asyncErrorHandler(async (req, res, next) => {
  // Check if authorization header exists
  if (!req.headers.authorization) {
    console.log("No authorization header found");
    return next(new errorHandler("Authorization header missing", 401));
  }
  
  // Check if header has Bearer scheme
  const parts = req.headers.authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log("Invalid authorization format:", req.headers.authorization);
    return next(new errorHandler("Invalid authorization format. Use Bearer token", 401));
  }
  
  const token = parts[1];
  
  if (!token) {
    console.log("No token found in authorization header");
    return next(new errorHandler("Token not found", 401));
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, secret);
    const { id, email, role } = decoded;
    
    // Find the user
    const newUser = await user.findOne({ _id: id, email });
    
    if (!newUser) {
      console.log("User not found for id:", id);
      return next(new errorHandler("Invalid User", 401));
    }
    
    console.log("User role:", newUser.role);
    
    // Check if user is admin
    if (newUser.role !== "admin") {
      console.log("User is not admin:", newUser.role);
      return next(new errorHandler("You are not authorized as admin", 403));
    }
    
    // Set token info in request
    req.tokenId = id;
    req.tokenEmail = email;
    req.userRole = role;
    
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    
    if (error.name === "JsonWebTokenError") {
      return next(new errorHandler("Invalid token format", 400));
    }
    if (error.name === "TokenExpiredError") {
      return next(new errorHandler("Token has expired", 401));
    }
    
    return next(new errorHandler("Authentication failed", 401));
  }
});

const verifyToken = asyncErrorHandler(async (req, res, next) => {
  // Check if authorization header exists
  if (!req.headers.authorization) {
    console.log("No authorization header found");
    return next(new errorHandler("Authorization header missing", 401));
  }
  
  // Check if header has Bearer scheme
  const parts = req.headers.authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log("Invalid authorization format:", req.headers.authorization);
    return next(new errorHandler("Invalid authorization format. Use Bearer token", 401));
  }
  
  const token = parts[1];
  
  if (!token) {
    console.log("No token found in authorization header");
    return next(new errorHandler("Token not found", 401));
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, secret);
    const { id, email } = decoded;
    
    // Set token info in request
    req.tokenId = id;
    req.tokenEmail = email;
    
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    
    if (error.name === "JsonWebTokenError") {
      return next(new errorHandler("Invalid token format", 400));
    }
    if (error.name === "TokenExpiredError") {
      return next(new errorHandler("Token has expired", 401));
    }
    
    return next(new errorHandler("Authentication failed", 401));
  }
});

module.exports = { adminOnly, verifyToken };