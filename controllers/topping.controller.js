import catchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import dotenv from 'dotenv';
import Topping from "../models/Topping.js";

dotenv.config();

export const toppingController = {
  addTopping: catchAsyncError(async (req, res, next) => {
    const { title, price } = req.body;
    try {
      if (!title || !price) return next(new ErrorHandler('Please fullfill in the body', 200))

      let topping = await Topping.findOne({ title });
      if (topping) return next(new ErrorHandler(`Topping already exist`, 400));

      const newTopping = new Topping({
        title,
        price,
      })
      topping = await newTopping.save();

      return res.status(200).send({ topping })

    } catch (error) {
      return next(new ErrorHandler(`Can't add topping`, 404))
    }
  }),
  deleteTopping: catchAsyncError(async (req, res, next) => {

  }),
  getAllTopping: catchAsyncError(async (req, res, next) => {
    try {
      const topping = await Topping.find({});
      return res.status(200).json({
        success: true,
        data: topping
      })
    } catch (error) {
      return next(new ErrorHandler(`Can't get Topping`, 404))
    }
  }),
}