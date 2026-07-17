//work of app.js-> create a server and config the server(middlewares used and api endpoints used)
const express=require('express')
const authRouter=require('./routes/auth.route');
const accountRouter=require('./routes/account.route')
const cookieParser = require('cookie-parser');
const app=express();
app.use(express.json())
app.use(cookieParser())
app.use('/api/auth',authRouter)
app.use('/api/account',accountRouter)
module.exports=app;