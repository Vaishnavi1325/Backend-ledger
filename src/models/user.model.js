const mongoose=require('mongoose');
const bcrypt=require("bcryptjs")
const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email field is required"],
        trim:true,
        lowercase:true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Invalid email"],
        unique:[true,"Email already exists."]
    },
    name:{
        type:String,
        required:[true,"Name is required"]
    },
    password:{
        type:String,
        required:[true,"Password field is required"],
        minlength:[6,"Password must be of more than 6 characters"],
        select:false
    },
    // Used for authorization (RBAC). Never set from client input:
    // registration always creates a "customer", roles are changed only by admins.
    role:{
        type:String,
        enum:{
            values:["customer","support","admin"],
            message:"Role can be either customer, support or admin"
        },
        default:"customer"
    }
},{
    timsetamps:true
})
//Checks if a password is modified , hash the password and save it , if not return it as it is
userSchema.pre("save",async function(){      
 if(!this.isModified("password")){
    return 
 }
 const hash=await bcrypt.hash(this.password,10);
 this.password=hash

 return 
})
//comapres the existing  password with the usser;s entered password
userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password)
}

const userModel=mongoose.model("user",userSchema);

module.exports=userModel