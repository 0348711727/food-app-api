import mongoose from "mongoose";

// Create a schema for the Product model
const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  imageName: {
    type: String,
  },
  topping: [{
    default: [],
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topping'
  }]
});

// Create the Product model
export default mongoose.model('Product', productSchema);
