const mongoose = require('mongoose');
const {Schema} = mongoose

// Schema
const userSchema = new Schema({
    username: {
        type: String,
        required: [true, "اسم المستخدم مطلوب"],
    },
    email: {
        type: String,
        unique: true,
        required: [true, "البريد الإلكتروني مطلوب"],
    },
    number: {
        type: String,
        unique: true,
        required: [true, "رقم الهاتف مطلوب"],
    },
    address: {
        type: String,
        unique: true,
        required: [true, "العنوان مطلوب"],
    },
    
    password: {
        type: String,
        required: [true, "كلمة المرور مطلوبة"],
    },
    avatar_url: {
        type: String,
        
    },
    type: {
        type: String,
        required: [true, "نوع المستخدم مطلوب"],
    },
    rating: {
        type: {

        }
    }
})

// Model
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel  