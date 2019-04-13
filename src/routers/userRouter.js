const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const auth = require('../middleware/auth');
const multer = require ('multer');
const sharp = require('sharp');

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

//Login route
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password); 
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send();
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })

        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
 }) 

 router.post('/users/logoutall', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
 })

//User profile
router.get('/users/me', auth, async (req, res) => {
   res.send(req.user);
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
router.patch('/users/me', auth, async (req, res) => {

    //Validation to check that user is not updating properties that don't exist or are not allowed.
    //Mongoose ignores properties which do not exist.
    const updates = Object.keys(req.body); //this is an array of strings where each string is a property in the body object.
    const allowedUpdates = ['name', 'email'];

    const isValidOperation = updates.every( (update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'});
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
})

//Delete user
router.delete('/users/me', auth, async (req, res) => {
    try {
        req.user.remove();
        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please unpload an image.'))
        }

        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
}) 

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
})

router.get('/users/:id/avatar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            return new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }    
})

module.exports = router;