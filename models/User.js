import mongoose from 'mongoose';
import validator from 'validator';

const User = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    maxLength: [30, 'Please enter at most 30 characters'],
    minLength: [4, 'Name must be at least 4 characters']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email address'],
    unique: true,
    validate: [validator.isEmail, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  active: {
    type: Boolean,
    default: false
  },
  tokenForSignup: String,
  avatar: {
    public_id: {
      type: String
      // required: true
    },
    url: {
      type: String,
      default: 'abc.png',
      required: true
    }
  },
  roles: {
    type: String,
    default: 'guest'
  },
  tokenResetPass: {
    type: String,
    default: 123456
  },
  tokenResetPassExpire: {
    type: Date,
    default: Date.now()
  }
})

export default mongoose.model('User', User)