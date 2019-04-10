const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const payload = jwt.verify(token, 'secretKey');
        const user = await User.findOne({ _id: payload._id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        next();
    } catch (e) {
        res.status(401).send({error: 'Please authenticate.'});
    }
}

module.exports = auth;