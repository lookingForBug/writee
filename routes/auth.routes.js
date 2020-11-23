const { Router } = require('express');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

const router = Router();

router.post(
  '/register',
  [
    check('email', 'incorrect email').isEmail(),
    check('password', 'minimum password length is 6 characters').isLength({ min: 6 })
  ],
  async (req,res) => {
    try {
      const errors = validationResult(req);

      if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), message: "incorrect data" })
      }

      const { email, password } = req.body;
      const candidate = await User.findOne({ email });

      if(candidate) {
        return res.status(400).json({ message: 'This email is already registered' })
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });

      await user.save();

      res.status(201).json({ message: 'User have been created' })

    } catch(e) {
      res.status(500).json({ message: 'Something goes wrong, try again' })
    }
  }
);

router.post(
  '/login',
  [
    check('email', 'incorrect email').normalizeEmail().isEmail(),
    check('password', 'minimum password length is 6 characters').isLength({ min: 6 })
  ],
  async (req,res) => {
    try {
      const errors = validationResult(req);

      if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), message: "incorrect data" })
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if(!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if(!isPasswordMatch) {
        return res.status(400).json({ message: "incorrect password" })
      }

      const token = jwt.sign(
        { userId: user.id },
        config.get('jwt'),
        { expiresIn: '1h' }
      )

      res.json({ token, userId: user.id })

    } catch(e) {
      res.status(500).json({ message: 'Something goes wrong, try again' })
    }
  }
);

module.exports = router;