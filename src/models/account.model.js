const mongoose=require('mongoose')
const ledgerModel=require('../models/ledger.model')

// Helper function to generate guaranteed unique 10-digit account numbers (1000000001 - 9999999999)
async function generateUniqueAccountNumber() {
    let unique = false;
    let candidate = "";
    while (!unique) {
        candidate = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const existing = await mongoose.models.account?.findOne({ accountNumber: candidate });
        if (!existing) {
            unique = true;
        }
    }
    return candidate;
}

const accountSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Account must be associated with a user."],
        index:true
    },
    accountNumber:{
        type:String,
        unique:true,
        sparse:true,
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["ACTIVE","FROZEN","CLOSED"],
            message:"Account can be either ACTIVE, FROZEN or CLOSED",
            
        },
        default:"ACTIVE",    
    },
    currency:{
        type:String,
        default:"INR",
        required:[true,"Currency is required for creating an account."]
    }
},
{
    timestamps:true
})
accountSchema.index({ user: 1, status: 1 })

accountSchema.pre('save', async function () {
    if (!this.accountNumber) {
        this.accountNumber = await generateUniqueAccountNumber();
    }
})

accountSchema.statics.generateUniqueAccountNumber = generateUniqueAccountNumber;

accountSchema.methods.getBalance = async function () {
    const accountObjectId = new mongoose.Types.ObjectId(this._id);

    const balanceData = await ledgerModel.aggregate([
        { $match: { account: accountObjectId } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "DEBIT" ] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "CREDIT" ] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: [ "$totalCredit", "$totalDebit" ] }
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[ 0 ].balance
}
const accountModel=mongoose.model("account", accountSchema)

module.exports=accountModel