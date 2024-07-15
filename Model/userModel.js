import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const userSchema = mongoose.Schema({
    name: String,
    email:String,
    password:String,
    phone: String
  }, { timestamps: true });

userSchema.methods.generateJWT = function () {
    const token = jwt.sign({
        _id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone
    }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
    return token
}
//===============  user schema =========================

  const User= mongoose.model("User",userSchema);


export default User ;