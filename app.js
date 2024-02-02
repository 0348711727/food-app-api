import express from 'express';
import userRouter from './routes/user.route.js'
import toppingRouter from './routes/topping.route.js'
import productRouter from './routes/product.route.js'
import dotenv from 'dotenv';
import errorMiddleware from './middleware/error.js';
import morgan from 'morgan';
import cors from "cors";
import swaggerSetup from './utils/swagger.js';
import auth from './middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import ErrorHandler from './utils/ErrorHandler.js';

dotenv.config();

const corsOptions = {
  origin: ['http://localhost:3000', 'https://food-app-theta-brown.vercel.app'],
  default: 'http://localhost:3000'
}
const app = express();

//limit request
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150 // limit each IP to 100 requests per windowMs
});
app.use(limiter); // use before router ?

app.all('*', function (req, res, next) {
  let origin = req.headers.origin;
  if (corsOptions.origin.indexOf(origin) >= 0) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'))
app.use('/api/auth', userRouter);
app.use('/api/product', productRouter);
app.use('/api/topping', toppingRouter);

app.get("/", (_, res) => {
  res.send("Welcome to my API Food App");
});

app.all('*', (req, res, next) => {
  next(new ErrorHandler(`Can not find ${req.originalUrl} on this server.`, 404));
});


//swagger
const swaggerSpec = swaggerSetup(app);
app.get('docs.json', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
})


//middleware
app.use(errorMiddleware);
app.use(auth);
export default app;