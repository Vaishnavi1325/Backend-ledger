//work of app.js-> create a server and config the server(middlewares used and api endpoints used)
const express=require('express')
const authRouter=require('./routes/auth.route');
const accountRouter=require('./routes/account.route')
const transactionRoutes=require('./routes/transaction.route')
const adminRoutes=require('./routes/admin.route')
const cookieParser = require('cookie-parser');
const notFound=require('./middlewares/notFound')
const errorHandler=require('./middlewares/errorHandler')

const app=express();
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth',authRouter)
app.use('/api/account',accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/admin", adminRoutes)

// Handle unknown routes (must come after all routes)
app.use(notFound)

// Convert all errors into a consistent API response (must be registered last)
app.use(errorHandler)

module.exports=app;