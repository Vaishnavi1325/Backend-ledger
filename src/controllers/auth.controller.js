const userModel=require('../models/user.model')
const jwt=require('jsonwebtoken')
const emailService=require('../services/email.service')
//register controller
async function userRegisterController(req,res){
    const {email,password,name}=req.body
    const isExists=await userModel.findOne({
        email:email
    })
    if(isExists){
        return res.status(422).json({
            mesasge:"User already exists.",
            status:"failed"
        })
    }
    const user=await userModel.create({
        email,password,name
    })
    const token=jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})
    res.cookie("token",token)

    res.status(201).json({
        user:{
            id:user.id,
            email:user.email,
            name:user.name
        },
        token
    })
    await emailService.sendregistrationEmail(user.email,user.name)
}

//login constroller
async function userLoginController(req,res){
    const {email,password}=req.body
    const user=await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message:"Email or password is invalid."
        })
    }
    const isValidPassword= await user.comparePassword(password);
    if(!isValidPassword){
        return res.status(401).json({
            message:"Email or password is invalid."
        })
    }
    const token=jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})
    res.cookie("token",token)

    res.status(201).json({
        user:{
            id:user.id,
            email:user.email,
            name:user.name
        },
        token
    })
}
module.exports={userRegisterController,userLoginController}