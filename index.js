import app from './app.js'
import { dbConnect } from './config/db.js';

dbConnect(); //connect to mongodb

app.listen(5000, () => {
  console.log('Connect successfully')
})

