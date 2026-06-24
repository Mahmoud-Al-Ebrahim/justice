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
        const hashedPassword = await hashPassword(password)
        if (!email) {
            return res.json({
                err: messages.EMAIL_REQUIRED
            })
        }

        if (!password || password.length < 6) {
            return res.json({
                err: messages.PASSWORD_MIN_LENGTH
            })
        }

        if (!username) {
            return res.json({
                err: messages.USERNAME_REQUIRED
            })
        } 
        if (!number) {
            return res.json({
                err: messages.NUMBER_REQUIRED
            })
        }
        if (!address) {
            return res.json({
                err: messages.ADDRESS_REQUIRED
            })
        }

        else {
            const newUser = new User({
                username, email, number, address, password:hashedPassword, avatar_url:"", type:"client",
            })
            await newUser.save();
            res.status(201).json({ message: messages.REGISTRATION_SUCCESS });
        }
    } catch (error) {
        res.status(400).json({ message: messages.REGISTRATION_FAILED });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
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
                    maxAge: 2 * 60 * 60 * 1000,
                })
                .json({ token, type: user.type, name: user.username})
            })
        }
        else{
            throw new UnauthorizedAccessError(messages.WRONG_PASSWORD)
        }
    } catch (error) {
        res.status(401).json({
            error: error.name,
            message: error.message
        })
    }
}

const readUser = (req, res) => {
}

module.exports = { test, registerUser, loginUser, readUser }
