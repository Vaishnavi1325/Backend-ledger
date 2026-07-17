require("dotenv").config()      //we cannot use process.env.MONGO_URI in db model without this configuration 
const app=require('./src/app')
const connectDB=require('./src/config/db')

connectDB()

app.listen(3000,()=>{
    console.log("Server running on port 3000")
})