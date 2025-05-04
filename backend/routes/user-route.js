const express = require('express');
const userModel = require('../models/user');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth')

// signup logic

// router.post('/signup', async(req, res) =>{
    
//     try{
//         let {name, email, password, clgId} = req.body;

//         let checkUser = await userModel.findOne({email});
//         if(checkUser){
//             return res.status(400).json({message: 'User already exists, Please signin!'});
//         }

//         // hashing password, creating user and generating token

//         bcrypt.genSalt(10, (err, salt) => {
//             bcrypt.hash(password, salt, async(err, hash) => {
//                 if(err) res.send(err.message);
//                 else{
//                     let newUser = new userModel({
//                         name,
//                         email,
//                         password: hash, // hashed password
//                         clgId
//                         });

//                         await newUser.save();   //saving user to db
//                         res.status(201).json({ message: "User created!", userId: newUser._id });

//                     let token = jwt.sign({email, id: newUser._id}, process.env.JWT_Secret);
//                     res.cookie("token", token);
//                 }
//             })
//         })
//     }
//     catch(err){
//         res.send(err.message);
//         console.log(err.message);
//     }
// });

router.post('/signup', async(req, res) => {
    try {
        let {name, email, password, clgId} = req.body;

        let checkUser = await userModel.findOne({email});
        if(checkUser){
            return res.status(400).json({message: 'User already exists, Please signin!'});
        }

        // Hashing and user creation
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        let newUser = new userModel({
            name,
            email,
            password: hash,
            clgId
        });

        await newUser.save();

        // Generate token and set cookie
        let token = jwt.sign(
            {_id: newUser._id, email: newUser.email},
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        
        // Set cookie AND send response in one go
        res.status(201)
           .cookie("token", token, {
               httpOnly: true,
               secure: process.env.NODE_ENV === 'production',
               sameSite: 'strict'
           })
           .json({ 
               message: "User created!", 
               userId: newUser._id 
           });

    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Server error during signup" });
    }
});

// signin logic

router.post('/signin', async(req, res) => {
    let {email, password} = req.body;

    // console.log(req.body);

    // checking if user exists

    let existingUser = await userModel.findOne({email});
    // console.log(existingUser);
    if(!existingUser){
        return res.status(404).json({message: 'User does not exist, Please register!'});
    }

    // authenticating user password

    // console.log(existingUser.password)

    let isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

    if(!isPasswordCorrect){
        return res.json({message: 'Invalid credentials!'});
    }
    else{
        let token = jwt.sign(
            {_id: existingUser._id, email: existingUser.email},
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log("token: " + token); //for testing purpose

        res.cookie("token", token,
            {
                httpOnly: true,
                sameSite: 'strict'
            }
        );
        res.json({message: 'User signed in successfully!'});
    }
});  

// logged in user route

router.get('/me', auth, async (req, res) => {
    try {
      const user = await userModel.findById(req.user._id).select('-password');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;