import express from 'express';
import { authController } from '../controllers/user.controller.js';
import multer from 'multer'
import auth from '../middleware/auth.middleware.js';
const router = express.Router();
import rateLimit from 'express-rate-limit';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  message: "Too many accounts created from this IP, please try again after an hour"
});


/**
 * @openapi
 * /signup:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     responses:
 *       200:
 *         description: Successful response
 */
router.post('/signup', createAccountLimiter, upload.single('image'), authController.signUp);


router.post('/login', authController.logIn);


export default router;