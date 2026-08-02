const User = require('../models/user')
const { UnauthorizedAccessError } = require('../helpers/exceptions');
const { hashPassword, comparePassword } = require('../helpers/auth')
const jwt = require('jsonwebtoken');
const messages = require('../helpers/messages');

const test = (req, res) => {
    res.json('الاختبارات تعمل بشكل صحيح')
}

const registerUser = async (req, res) => {
    try {
        const { email, password, username, number, address } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: messages.EMAIL_REQUIRED
            })
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                error: messages.PASSWORD_MIN_LENGTH
            })
        }

        if (!username) {
            return res.status(400).json({
                error: messages.USERNAME_REQUIRED
            })
        } 
        if (!number) {
            return res.status(400).json({
                error: messages.NUMBER_REQUIRED
            })
        }
        if (!address) {
            return res.status(400).json({
                error: messages.ADDRESS_REQUIRED
            })
        }

        const hashedPassword = await hashPassword(password)
        const newUser = new User({
            username, email, number, address, password:hashedPassword, avatar_url:"", type:"client",
        })
        await newUser.save();
        res.status(201).json({ message: messages.REGISTRATION_SUCCESS });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                error: "البريد الإلكتروني أو رقم الهاتف أو العنوان مسجل بالفعل"
            })
        }
        res.status(400).json({ 
            error: messages.REGISTRATION_FAILED,
            message: error.message 
        });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        
        if (!email || !password) {
            return res.status(400).json({
                error: "البريد الإلكتروني وكلمة المرور مطلوبان"
            })
        }
        
        const user = await User.findOne({ email }).maxTimeMS(5000).exec();
        if (!user) {
            return res.status(401).json({
                error: messages.NO_USER_FOUND
            })
        }

        const match = await comparePassword(password, user.password)
        if (match) {
            jwt.sign({
                email: user.email,
                userId: user._id,
                name: user.username,
                type: user.type
            }, process.env.JWT_SECRET, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token, {
                    secure: false,
                    httpOnly: true,
                    maxAge: 2 * 60 * 1000, // 2 minutes
                })
                .json({ token, type: user.type, name: user.username})
            })
        }
        else{
            throw new UnauthorizedAccessError(messages.WRONG_PASSWORD)
        }
    } catch (error) {
        if (error.name === 'MongoTimeoutError' || error.message.includes('buffering timed out')) {
            return res.status(503).json({
                error: messages.DATABASE_TIMEOUT
            })
        }
        if (error.name === 'MongoError') {
            return res.status(500).json({
                error: messages.DATABASE_ERROR
            })
        }
        res.status(401).json({
            error: error.name,
            message: error.message
        })
    }
}

const readUser = (req, res) => {
}

module.exports = { test, registerUser, loginUser, readUser }
