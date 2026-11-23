const mongoose=require("mongoose")

const transactionSchema=new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must be associated with a 'from' account"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Transaction must be associated with a 'to' account"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["PENDING","COMPLETED","FAILED","REVERSED"],
            message:"Status can either be PENDING, COMPLETED, FAILED or REVERSED."
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating a transaction."],
        min:[0,"Transaction amount cannot be negative"]
    },
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency key is required for creating a transaction."],
        index:true,
        unique:true
    }
},{
    timestamps:true
})

// Compound indexes: account-scoped queries sorted by date
transactionSchema.index({ fromAccount: 1, createdAt: -1 })
transactionSchema.index({ toAccount: 1, createdAt: -1 })

// Single-field indexes for filtering
transactionSchema.index({ amount: 1 })
transactionSchema.index({ status: 1 })

const transactionModel=mongoose.model("transaction",transactionSchema)
module.exports=transactionModel