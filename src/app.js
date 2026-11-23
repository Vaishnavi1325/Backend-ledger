//work of app.js-> create a server and config the server(middlewares used and api endpoints used)
const express=require('express')
const cors=require('cors')
const authRouter=require('./routes/auth.route');
const accountRouter=require('./routes/account.route')
const transactionRoutes=require('./routes/transaction.route')
const adminRoutes=require('./routes/admin.route')
const cookieParser = require('cookie-parser');
const notFound=require('./middlewares/notFound')
const errorHandler=require('./middlewares/errorHandler')

const app=express();

// Allow the frontend to call this API from the browser.
// credentials:true lets the auth cookie travel with cross-origin requests.
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001"
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(new Error("Not allowed by CORS"))
    },
    credentials: true
}))

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