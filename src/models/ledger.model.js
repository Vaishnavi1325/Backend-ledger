const mongoose=require('mongoose')

const ledgerSchema=new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        index:true,
        required:[true,"Ledger must be associated with an account"],
        immutable:true
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating a ledger"]
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        index:true,
        required:[true,"Ledger must be associated with a transaction"],
        immutable:true
    },
    type:{
        type:String,
        enum:{values:["CREDIT","DEBIT"],message:"Type must be either credit or debit"},
        required:[true,"Ledger tyoe is required"],
        immutable:true
    }
    
})
function preventLedgerModification() {
    throw new Error("Ledger entries are immutable and cannot be modified or deleted");
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);


const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;