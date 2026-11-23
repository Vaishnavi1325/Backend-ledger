const userModel=require('../models/user.model')
const jwt=require('jsonwebtoken')
const tokenBlackListModel=require('../models/blackList.model')
const AppError=require('../utils/AppError')

async function authMiddleware(req,res,next){
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1];
    if(!token){
        return next(new AppError("Unauthorized access: User is not logged in.", 401))
    }

    try{
        const isBlacklisted = await tokenBlackListModel.findOne({ token })
        if (isBlacklisted) {
            return next(new AppError("Unauthorized access: token is invalid", 401))
        }

        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await userModel.findById(decoded.userId)
        if(!user){
            return next(new AppError("Unauthorized access: User not found.", 401))
        }
        req.user=user;
        return next();

    }catch(error){
        return next(new AppError("Unauthorized access: token is invalid", 401))
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return next(new AppError("Unauthorized access, token is missing", 401))
    }

    try {
        const isBlacklisted = await tokenBlackListModel.findOne({ token })
        if (isBlacklisted) {
            return next(new AppError("Unauthorized access, token is invalid", 401))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await userModel.findById(decoded.userId).select("+systemUser")
        if (!user || !user.systemUser) {
            return next(new AppError("Forbidden access, not a system user", 403))
        }

        req.user = user

        return next()
    }
    catch (err) {
        return next(new AppError("Unauthorized access, token is invalid", 401))
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}