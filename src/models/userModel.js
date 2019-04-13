const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: 'Anonymous'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {   //ES6 Method Definition Syntax 
            if (!validator.isEmail(value)) {
                throw new Error("Email is not valid!")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"');
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

//when we pass an object to res.send(), express calls JSON.stringify() behind the scenes.
//toJSON() function is called whenever the object is stringified
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject(); //convert document to raw object (removes extra mongoose properties/methods)

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

//Generate JWT token
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, 'secretKey');

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
}

//Custom function to validate a user
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});

    if (!user) {
        throw new Error("The email id doesn't exist");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error ("email id and password doesn't match")
    }

    return user;
}

//Middleware - Hash the plain text password before saving
userSchema.pre('save', async function(next) {
    //here this keyword represents the document we're trying to save. Note - Arrow functions don't bind this
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;