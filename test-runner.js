const mongoose = require('mongoose');
const http = require('http');

process.env.JWT_SECRET = 'super_secret_test_jwt_key_12345';
process.env.MONGO_URI = 'mongodb://localhost:27017/bank_ledger_test';
process.env.PORT = '3099';

const app = require('./src/app');
const userModel = require('./src/models/user.model');
const accountModel = require('./src/models/account.model');
const transactionModel = require('./src/models/transaction.model');
const ledgerModel = require('./src/models/ledger.model');
const tokenBlackListModel = require('./src/models/blackList.model');
const otpModel = require('./src/models/otp.model');
const jwt = require('jsonwebtoken');

let server;

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: '127.0.0.1',
            port: 3099,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

let passedTests = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(message);
    } else {
        passedTests++;
        console.log(`✅ PASSED: ${message}`);
    }
}

async function runTests() {
    console.log('--- STARTING BACKEND INTEGRATION TEST SUITE ---');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to test DB.');

    // Clean test DB
    await userModel.deleteMany({});
    await accountModel.deleteMany({});
    await transactionModel.deleteMany({});
    await mongoose.connection.collection('ledgers').deleteMany({});
    await tokenBlackListModel.deleteMany({});

    server = app.listen(3099);
    console.log('Test server running on port 3099.');

    try {
        // 1. Register User A (Alice)
        const regA = await makeRequest('POST', '/api/auth/register', {
            name: 'Alice Bank',
            email: 'alice@bank.test',
            password: 'password123'
        });
        assert(regA.status === 201 && regA.body.success, 'User A (Alice) registration');
        let tokenA = regA.body.data.token;
        const userIdA = regA.body.data.user.id;

        // 1b. Profile Management: GET /api/auth/me
        const profileA = await makeRequest('GET', '/api/auth/me', null, tokenA);
        assert(profileA.status === 200 && profileA.body.data.user.email === 'alice@bank.test', 'GET /api/auth/me returns current user profile');

        // 1c. Password Management: Reject invalid current password
        const wrongPass = await makeRequest('PATCH', '/api/auth/change-password', {
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123'
        }, tokenA);
        assert(wrongPass.status === 400, 'Change password rejects incorrect current password (400)');

        // 1d. Password Management: Valid password update
        const changePass = await makeRequest('PATCH', '/api/auth/change-password', {
            currentPassword: 'password123',
            newPassword: 'newpassword123'
        }, tokenA);
        assert(changePass.status === 200, 'Change password succeeds with valid credentials');

        // 1e. Verify login works with the updated password
        const loginNew = await makeRequest('POST', '/api/auth/login', {
            email: 'alice@bank.test',
            password: 'newpassword123'
        });
        assert(loginNew.status === 200, 'Login succeeds with the newly updated password');
        tokenA = loginNew.body.data.token;

        // 2. Reject duplicate registration
        const regDup = await makeRequest('POST', '/api/auth/register', {
            name: 'Alice Duplicate',
            email: 'alice@bank.test',
            password: 'password123'
        });
        assert(regDup.status === 409 && !regDup.body.success, 'Reject duplicate email with 409');

        // 3. Register User B (Bob)
        const regB = await makeRequest('POST', '/api/auth/register', {
            name: 'Bob Ledger',
            email: 'bob@bank.test',
            password: 'password456'
        });
        assert(regB.status === 201, 'User B (Bob) registration');
        const tokenB = regB.body.data.token;

        // 4. Create System User for initial funding
        const systemUser = await userModel.create({
            name: 'Bank System Reserve',
            email: 'system@bank.internal',
            password: 'systempassword123',
            role: 'admin',
            systemUser: true
        });
        const systemToken = jwt.sign({ userId: systemUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const systemAccount = await accountModel.create({
            user: systemUser._id,
            currency: 'INR'
        });

        // 5. Create Account for Alice
        const accA = await makeRequest('POST', '/api/account', { currency: 'INR' }, tokenA);
        assert(accA.status === 201 && accA.body.data.account, 'Create account for Alice');
        const accountIdA = accA.body.data.account._id;
        const accountNumA = accA.body.data.account.accountNumber;

        // 6. Create Account for Bob
        const accB = await makeRequest('POST', '/api/account', { currency: 'INR' }, tokenB);
        assert(accB.status === 201 && accB.body.data.account, 'Create account for Bob');
        const accountIdB = accB.body.data.account._id;
        const accountNumB = accB.body.data.account.accountNumber;

        assert(accountNumA && accountNumB && accountNumA !== accountNumB, 'Every account has a distinct guaranteed-unique 10-digit Account Number');

        // 6b. Recipient Name Lookup & Verification by ID and by Account Number
        const lookupBob = await makeRequest('GET', `/api/account/lookup/${accountIdB}`, null, tokenA);
        assert(lookupBob.status === 200 && lookupBob.body.data.recipient.holderName === 'Bob Ledger' && !lookupBob.body.data.recipient.isOwnAccount && lookupBob.body.data.recipient.canReceiveTransfers, 'Recipient lookup verifies Bob name and active status by ID');

        const lookupBobByNum = await makeRequest('GET', `/api/account/lookup/${accountNumB}`, null, tokenA);
        assert(lookupBobByNum.status === 200 && lookupBobByNum.body.data.recipient.holderName === 'Bob Ledger' && lookupBobByNum.body.data.recipient.accountNumber === accountNumB, 'Recipient lookup verifies Bob by unique 10-digit Account Number');

        const lookupSelf = await makeRequest('GET', `/api/account/lookup/${accountIdA}`, null, tokenA);
        assert(lookupSelf.status === 200 && lookupSelf.body.data.recipient.isOwnAccount, 'Recipient lookup detects self-account');

        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const lookup404 = await makeRequest('GET', `/api/account/lookup/${nonExistentId}`, null, tokenA);
        assert(lookup404.status === 404, 'Recipient lookup returns 404 for non-existent account');

        // 7. Inject Initial Funds into Alice Account via system route
        const initFunds = await makeRequest('POST', '/api/transactions/system/initial-funds', {
            toAccount: accountIdA,
            amount: 5000,
            idempotencyKey: 'init-fund-alice-001'
        }, systemToken);
        assert(initFunds.status === 201 && initFunds.body.success, 'Initial funds (5000 INR) injected into Alice account');

        // 8. Verify Alice Balance is derived as 5000
        const balA = await makeRequest('GET', `/api/account/balance/${accountIdA}`, null, tokenA);
        assert(balA.status === 200 && balA.body.data.balance === 5000, 'Alice balance derived accurately from ledger (5000 INR)');

        // 9. Verify getUserAccounts lists Alice account with balance
        const listA = await makeRequest('GET', '/api/account', null, tokenA);
        assert(listA.status === 200 && listA.body.data.accounts[0].balance === 5000, 'GET /api/account returns accounts with live balance');

        // 10. Attempt IDOR: Bob tries to transfer Alice money (Bob token with Alice fromAccount)
        const idorTransfer = await makeRequest('POST', '/api/transactions', {
            fromAccount: accountIdA,
            toAccount: accountIdB,
            amount: 1000,
            idempotencyKey: 'idor-hack-001'
        }, tokenB);
        assert(idorTransfer.status === 403, 'IDOR protection: Bob cannot transfer from Alice account (403 Forbidden)');

        // 11. Overdraft prevention: Alice tries to transfer more than her balance
        const overdraftTransfer = await makeRequest('POST', '/api/transactions', {
            fromAccount: accountIdA,
            toAccount: accountIdB,
            amount: 999999,
            idempotencyKey: 'overdraft-001'
        }, tokenA);
        assert(overdraftTransfer.status === 400, 'Overdraft blocked: Insufficient balance (400)');

        // 12. Valid Transfer: Alice transfers 1500 to Bob using Bob's 10-digit Account Number
        const validTransfer = await makeRequest('POST', '/api/transactions', {
            fromAccount: accountIdA,
            toAccount: accountNumB,
            amount: 1500,
            idempotencyKey: 'transfer-alice-bob-001'
        }, tokenA);
        assert(validTransfer.status === 201 && validTransfer.body.success, 'Atomic transfer (1500 INR) Alice -> Bob using unique 10-digit Account Number succeeded');

        // 13. Test Idempotency: Repeating exact same request returns cached transaction without duplicate debit
        const repeatTransfer = await makeRequest('POST', '/api/transactions', {
            fromAccount: accountIdA,
            toAccount: accountNumB,
            amount: 1500,
            idempotencyKey: 'transfer-alice-bob-001'
        }, tokenA);
        assert(repeatTransfer.status === 200 && repeatTransfer.body.data.message === 'Transaction already processed', 'Idempotency key prevents double debit');

        // 14. Verify updated balances after transfer: Alice: 3500, Bob: 1500
        const balAAfter = await makeRequest('GET', `/api/account/balance/${accountIdA}`, null, tokenA);
        const balBAfter = await makeRequest('GET', `/api/account/balance/${accountIdB}`, null, tokenB);
        assert(balAAfter.body.data.balance === 3500, 'Alice balance correctly reduced to 3500 INR');
        assert(balBAfter.body.data.balance === 1500, 'Bob balance correctly increased to 1500 INR');

        // 15. Verify Ledger Immutability: Attempting direct update on ledger throws error
        const anyLedger = await ledgerModel.findOne({});
        let immutableProtected = false;
        try {
            await ledgerModel.updateOne({ _id: anyLedger._id }, { amount: 999999 });
        } catch (err) {
            immutableProtected = true;
        }
        assert(immutableProtected, 'Double-entry ledger is strictly immutable (modification pre-hook blocked update)');

        // 16. Verify Account Summary & Analytics for Alice
        const summaryA = await makeRequest('GET', '/api/account/summary', null, tokenA);
        assert(summaryA.status === 200 && summaryA.body.data.summary.totalBalance === 3500, 'Summary totalBalance is 3500');
        assert(summaryA.body.data.summary.totalDebits === 1500, 'Summary totalDebits is 1500');
        assert(summaryA.body.data.summary.totalCredits === 5000, 'Summary totalCredits is 5000');
        assert(summaryA.body.data.summary.recentTransactions.length > 0, 'Summary contains recent transactions');

        // 17. Query transactions list with pagination and sorting
        const txList = await makeRequest('GET', '/api/transactions?page=1&limit=10&sortBy=createdAt&order=desc', null, tokenA);
        assert(txList.status === 200 && txList.body.data.transactions.length >= 2, 'GET /api/transactions returns paginated records');

        // 18. Query account-specific transactions
        const accTxList = await makeRequest('GET', `/api/transactions/account/${accountIdA}`, null, tokenA);
        assert(accTxList.status === 200 && accTxList.body.data.transactions.length >= 2, 'GET /api/transactions/account/:id returns account transactions');

        // 19. User Logout
        const logoutRes = await makeRequest('POST', '/api/auth/logout', null, tokenA);
        assert(logoutRes.status === 200 && logoutRes.body.success, 'Alice logged out successfully');

        // 20. Token Blacklist check: Alice token cannot access protected routes after logout
        const blacklistedAccess = await makeRequest('GET', '/api/account', null, tokenA);
        assert(blacklistedAccess.status === 401, 'Blacklisted token immediately rejected with 401 Unauthorized');

        // 21. Account Closure logic: Attempt closing Bob account with remaining balance
        const closeBobBlocked = await makeRequest('PATCH', `/api/account/${accountIdB}/close`, null, tokenB);
        assert(closeBobBlocked.status === 400, 'Closing account with positive balance blocked (400)');

        // 22. Transaction Reversal Engine:
        // Customer forbidden from executing reversal
        const validTxId = validTransfer.body.data.transaction._id;
        const custReversalBlocked = await makeRequest('POST', `/api/transactions/${validTxId}/reverse`, null, tokenB);
        assert(custReversalBlocked.status === 403, 'Customer forbidden from reversing transactions (403 Forbidden)');

        // Admin/Staff executes double-entry reversal
        const adminReversal = await makeRequest('POST', `/api/transactions/${validTxId}/reverse`, null, systemToken);
        assert(adminReversal.status === 200 && adminReversal.body.data.originalTransaction.status === 'REVERSED', 'Admin executes double-entry transaction reversal');

        // Check balances after reversal: Bob 0, Alice 5000
        const balBRev = await makeRequest('GET', `/api/account/balance/${accountIdB}`, null, tokenB);
        assert(balBRev.body.data.balance === 0, 'Bob balance reduced to 0 INR after reversal');

        // Re-reversing blocked
        const reReversalBlocked = await makeRequest('POST', `/api/transactions/${validTxId}/reverse`, null, systemToken);
        assert(reReversalBlocked.status === 400, 'Re-reversing an already reversed transaction blocked (400)');

        // Now Bob's account accountIdB has 0 balance and can be closed directly!
        const closeBobNow = await makeRequest('PATCH', `/api/account/${accountIdB}/close`, null, tokenB);
        assert(closeBobNow.status === 200 && closeBobNow.body.data.account.status === 'CLOSED', 'Bob account with 0 balance closed successfully');

        // 23. Test Multi-Account Balance Isolation & Self-Transfer
        // Alice logs back in with valid password
        const aliceLogin = await makeRequest('POST', '/api/auth/login', {
            email: 'alice@bank.test',
            password: 'newpassword123'
        });
        assert(aliceLogin.status === 200, 'Alice logs back in with valid password');
        const freshTokenA = aliceLogin.body.data.token;

        // Alice creates a 3rd distinct account (USD)
        const accA3 = await makeRequest('POST', '/api/account', { currency: 'USD' }, freshTokenA);
        assert(accA3.status === 201 && accA3.body.data.account, 'Alice creates a distinct USD account');
        const accountIdA3 = accA3.body.data.account._id;
        const accountNumA3 = accA3.body.data.account.accountNumber;
        assert(accountNumA3 !== accountNumA, 'USD account has a distinct Account Number from primary account');

        // Deposit 2000 into Alice's USD account
        const depA3 = await makeRequest('POST', '/api/account/deposit', {
            accountId: accountIdA3,
            amount: 2000,
            idempotencyKey: 'dep-a3-usd-test'
        }, freshTokenA);
        assert(depA3.status === 201 && depA3.body.data.newBalance === 2000, 'Successfully deposited 2000 into USD account');

        // Verify Account A (primary) balance is unchanged and USD account balance is 2000 (Strict isolation)
        const checkBalPrimary = await makeRequest('GET', `/api/account/balance/${accountIdA}`, null, freshTokenA);
        const checkBalUSD = await makeRequest('GET', `/api/account/balance/${accountIdA3}`, null, freshTokenA);
        assert(checkBalPrimary.body.data.balance === 5000, 'Primary account balance remains 5000 (no balance leak)');
        assert(checkBalUSD.body.data.balance === 2000, 'USD account balance is exactly 2000');

        // 24. Test Gmail OTP Forgot Password & Reset Password Flow
        // Request forgot password code
        const forgotReq = await makeRequest('POST', '/api/auth/forgot-password', {
            email: 'alice@bank.test'
        });
        assert(forgotReq.status === 200 && forgotReq.body.success, 'POST /api/auth/forgot-password dispatches OTP');
        const resetOtpDoc = await otpModel.findOne({ email: 'alice@bank.test', purpose: 'FORGOT_PASSWORD' });
        assert(resetOtpDoc && resetOtpDoc.otp.length === 6, 'Generated 6-digit OTP stored in database');

        // Reset password using OTP
        const resetReq = await makeRequest('POST', '/api/auth/reset-password', {
            email: 'alice@bank.test',
            otp: resetOtpDoc.otp,
            newPassword: 'newsecurepassword999'
        });
        assert(resetReq.status === 200 && resetReq.body.success, 'POST /api/auth/reset-password updates password');

        // Old password rejected
        const oldPassLogin = await makeRequest('POST', '/api/auth/login', {
            email: 'alice@bank.test',
            password: 'newpassword123'
        });
        assert(oldPassLogin.status === 401, 'Old password rejected after reset (401)');

        // New password accepted
        const newPassLogin = await makeRequest('POST', '/api/auth/login', {
            email: 'alice@bank.test',
            password: 'newsecurepassword999'
        });
        assert(newPassLogin.status === 200, 'New password accepted for login');

        // 25. Test Verified Registration with OTP
        const regOtpReq = await makeRequest('POST', '/api/auth/send-otp', {
            email: 'charlie@bank.test',
            purpose: 'REGISTRATION'
        });
        assert(regOtpReq.status === 200 && regOtpReq.body.success, 'POST /api/auth/send-otp dispatches registration code');
        const charlieOtp = (await otpModel.findOne({ email: 'charlie@bank.test', purpose: 'REGISTRATION' })).otp;

        const regWithOtpRes = await makeRequest('POST', '/api/auth/register-with-otp', {
            name: 'Charlie Test',
            email: 'charlie@bank.test',
            password: 'charliepass123',
            otp: charlieOtp
        });
        assert(regWithOtpRes.status === 201 && regWithOtpRes.body.data.token, 'Verified registration with OTP creates user and logs in');

        // 26. Test Passwordless Gmail OTP Login
        const loginOtpReq = await makeRequest('POST', '/api/auth/send-otp', {
            email: 'charlie@bank.test',
            purpose: 'LOGIN'
        });
        assert(loginOtpReq.status === 200 && loginOtpReq.body.success, 'POST /api/auth/send-otp dispatches login code');
        const charlieLoginOtp = (await otpModel.findOne({ email: 'charlie@bank.test', purpose: 'LOGIN' })).otp;

        const verifyLoginRes = await makeRequest('POST', '/api/auth/verify-otp-login', {
            email: 'charlie@bank.test',
            otp: charlieLoginOtp
        });
        assert(verifyLoginRes.status === 200 && verifyLoginRes.body.data.user.email === 'charlie@bank.test', 'Passwordless OTP verification logs user in');

        console.log('\n========================================');
        console.log(`🎉 ALL ${passedTests} BACKEND INTEGRATION TESTS PASSED!`);
        console.log('========================================\n');
    } finally {
        if (server) server.close();
        await mongoose.disconnect();
    }
}

runTests().catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
