
import ErrorHandler from "../utils/ErrorHandler.js";

const errorMiddleware = (err, req, res, next) => {
  // console.log(err)
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';
  //wrong mongo id
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`
    err = new ErrorHandler(message, 404)
  }
  if (err.name === 'ValidationError') {
    Object.keys(err.errors).forEach((key) => {
      err[key] = err.errors[key].message;
    });
  }
  res.status(err.statusCode).json({
    success: false,
    field: "",
    error: err.message
  })
}
export default errorMiddleware;