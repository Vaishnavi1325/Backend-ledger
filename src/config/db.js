const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Server connected to DB successfully");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

module.exports = connectDB;