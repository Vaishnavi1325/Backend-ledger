const mongoose = require('mongoose');
const accountModel = require('../models/account.model');

async function migrate() {
    await mongoose.connect('mongodb://localhost:27017/bank_ledger', { serverSelectionTimeoutMS: 5000 });
    const allAccounts = await accountModel.find({});
    console.log(`Checking ${allAccounts.length} accounts for missing account numbers...`);

    let updated = 0;
    for (const acc of allAccounts) {
        if (!acc.accountNumber) {
            const num = await accountModel.generateUniqueAccountNumber();
            acc.accountNumber = num;
            await acc.save();
            console.log(`Assigned account number ${num} to account ${acc._id}`);
            updated++;
        }
    }
    console.log(`Migration complete. Updated ${updated} accounts.`);
    await mongoose.disconnect();
}

migrate().catch(console.error);
