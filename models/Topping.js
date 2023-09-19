import mongoose from "mongoose";

// Create a schema for the Topping model
const toppingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Create the Topping model
export default mongoose.model('Topping', toppingSchema);
