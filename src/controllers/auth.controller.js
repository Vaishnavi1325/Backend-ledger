const userModel=require('../models/user.model')
const jwt=require('jsonwebtoken')
const emailService=require('../services/email.service')
const tokenBlackListModel=require('../models/blackList.model')
const AppError=require('../utils/AppError')

// Creates the signed login token (JWT) for a user.
// One place to change if the expiry or payload ever changes.
function generateAuthToken(userId){
    return jwt.sign({userId:userId},process.env.JWT_SECRET,{expiresIn:"3d"})
}

/**
 * - User Register Controller
 * - POST /api/auth/register
 */
async function userRegisterController(req,res){
    const {email,password,name}=req.body

    const isExists=await userModel.findOne({
        email:email
    })

    if(isExists){
        // 409 Conflict: this email is already registered
        throw new AppError("User already exists.",409)
    }

    const user=await userModel.create({
        email,password,name
    })

    const token=generateAuthToken(user._id)
    res.cookie("token",token)

    res.status(201).json({
        success:true,
        data:{
            user:{
                id:user.id,
                email:user.email,
                name:user.name
            },
            token
        },
        error:null
    })

    // Email is sent after the response, so a slow email server never delays the API
    await emailService.sendregistrationEmail(user.email,user.name)
}

/**
 * - User Login Controller
 * - POST /api/auth/login
 */
async function userLoginController(req,res){
    const {email,password}=req.body
    const user=await userModel.findOne({email}).select("+password")

    // Same message for wrong email and wrong password,
    // so attackers cannot find out which emails are registered
    if(!user){
        throw new AppError("Email or password is invalid.",401)
    }

    const isValidPassword=await user.comparePassword(password);
    if(!isValidPassword){
        throw new AppError("Email or password is invalid.",401)
    }

    const token=generateAuthToken(user._id)
    res.cookie("token",token)

    res.status(200).json({
        success:true,
        data:{
            user:{
                id:user.id,
                email:user.email,
                name:user.name
            },
            token
        },
        error:null
    })
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    // Blacklist the token so it cannot be used again after logout.
    // The check avoids a duplicate key error when logout is called twice.
    if (token) {
        const isAlreadyBlacklisted = await tokenBlackListModel.findOne({ token: token })

        if (!isAlreadyBlacklisted) {
            await tokenBlackListModel.create({ token: token })
        }
    }

    res.clearCookie("token")

    res.status(200).json({
        success: true,
        data: {
            message: "User logged out successfully"
        },
        error: null
    })
}


module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}
