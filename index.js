import app from './app.js'
import { dbConnect } from './config/db.js';

dbConnect(); //connect to mongodb

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`)
})

