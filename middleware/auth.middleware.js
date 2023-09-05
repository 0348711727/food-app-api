import jwt from 'jsonwebtoken';
import User from "../models/User.js";

const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || '';

  try {
    // if (!token) return res.status(401).send({ error: 'Not authorized to access this resource' })
    const data = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: data._id, 'tokens.token': token })
    if (!user) {
      throw new Error()
    }
    req.user = user
    req.token = token
    next();
  } catch (error) {
    res.status(401).send({ error: 'Not authorized to access this resource' })
  }
}
export default auth;