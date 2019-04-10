const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user');

const router = express.Router();

//Create user
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save()
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password); 
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
})

//Find all users
router.get('/users', async (req, res) => {
    
    try {
        const users = await User.find({})
        res.send(users);
    } catch (e) {
        res.status(500).send();
    }
})

//Find user by id
router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    //To handle cast error "Cast to ObjectId failed for value \"1234\" at path \"_id\" for model \"User\""
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).send()
    }

    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).send()
        }

        res.send(user);

    } catch (e) {
        res.status(500).send(e);
    }
})

//Update user
router.patch('/users/:id', async (req, res) => {
    const _id = req.params.id;

    //Validation to check that user is not updating properties that don't exist or are not allowed.
    //Mongoose ignores properties which do not exist.
    const updates = Object.keys(req.body); //this is an array of strings where each string is a property in the body object.
    const allowedUpdates = ['name', 'email'];

    const isValidOperation = updates.every( (update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'});
    }

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).send()
    }

    try {
        //findByIdAndUpdate bypasses mongoose. It performs a direct operation on the database.
        //const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true})
        const user = await User.findById(_id);
        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();

        if (!user) {
            return res.status(404).send();
        }

        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }
})

//Delete user
router.delete('/users/:id', async (req, res) => {
    const _id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).send()
    }

    try {
        const user = await User.findByIdAndDelete(_id);

        if (!user) {
            return res.status(404).send();
        }
    
        res.send();
        
    } catch (e) {
        res.status(400).send(e);
    }
})

module.exports = router;