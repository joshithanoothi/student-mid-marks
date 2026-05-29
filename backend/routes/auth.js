const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Provide username and password' });
  try {
    const user = await User.findOne({ username });
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id, name: user.name, username: user.username,
        email: user.email, role: user.role, branch: user.branch,
        department: user.department, rollNo: user.rollNo,
        semester: user.semester, section: user.section
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!await user.matchPassword(currentPassword))
      return res.status(400).json({ success: false, message: 'Wrong current password' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;