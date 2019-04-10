const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Everything in Mongoose starts with a Schema. Each schema maps to a MongoDB collection and defines the shape of the documents within that collection.
//To use our schema definition, we need to convert our Schema into a Model we can work with. To do so, we pass it into mongoose.model(modelName, schema)
//A model is a class with which we construct documents. Instances of Models are documents. 

//Terminologies:
// Collections - ‘Collections’ in Mongo are equivalent to tables in relational databases. They can hold multiple JSON documents.
// Documents - 'Documents’ are equivalent to records or rows of data in SQL. While a SQL row can reference data in other tables, Mongo documents usually combine that in a document.
// Fields - ‘Fields’ or attributes are similar to columns in a SQL table.
// Schema - While Mongo is schema-less, SQL defines a schema via the table definition. A Mongoose ‘schema’ is a document data structure (or shape of the document) that is enforced via the application layer.
// Models - ‘Models’ are higher-order constructors that take a schema and create an instance of a document equivalent to records in a relational database.

//A Mongoose model is a wrapper on the Mongoose schema. A Mongoose schema defines the structure of the document, default values, validators, etc., whereas a Mongoose model provides an interface to the database for creating, querying, updating, deleting records, etc.
//A schema defines document properties through an object where the key name corresponds to the property name in the collection.
//Schema - A formal description of the structure of a database: the names of the tables, the names of the columns of each table, and the data type and other attributes of each column.

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
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

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
    //here this keyword represents the document we're trying to save
    //arrow functions don't bind this
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    console.log('Before Save');

    next();
})

const User = mongoose.model('User', userSchema);

module.exports = User;