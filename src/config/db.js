const mongoose = require("mongoose");

async function connectDB() {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/bank_ledger";
    try {
        await mongoose.connect(mongoUri);
        console.log(`Server connected to DB successfully: ${mongoUri}`);
    } catch (error) {
        console.error("Database connection error:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;