const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const AcademicConfig = require('../models/AcademicConfig');
const MidMark = require('../models/MidMark');
const { protect, authorize } = require('../middleware/auth');
const a = [protect, authorize('admin')];

router.post('/users', ...a, async (req, res) => {
  try {
    const exists = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }]
    });
    if (exists)
      return res.status(400).json({ success: false, message: 'Username or email exists' });
    const user = await User.create(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/users', ...a, async (req, res) => {
  try {
    const filter = {};
    if (req.query.role)   filter.role   = req.query.role;
    if (req.query.branch) filter.branch = req.query.branch;
    const users = await User.find(filter).select('-password');
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id', ...a, async (req, res) => {
  try {
    const { password, ...data } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/users/:id', ...a, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/config', ...a, async (req, res) => {
  try {
    let config = await AcademicConfig.findOne();
    if (!config) config = await AcademicConfig.create({});
    res.json({ success: true, config });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/config', ...a, async (req, res) => {
  try {
    let config = await AcademicConfig.findOne();
    if (!config) config = await AcademicConfig.create(req.body);
    else { Object.assign(config, req.body); await config.save(); }
    res.json({ success: true, config });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/dashboard', ...a, async (req, res) => {
  try {
    const [totalStudents, totalFaculty, totalHODs, totalMarksSubmitted, totalApproved] =
      await Promise.all([
        User.countDocuments({ role: 'student',  isActive: true }),
        User.countDocuments({ role: 'faculty',  isActive: true }),
        User.countDocuments({ role: 'hod',      isActive: true }),
        MidMark.countDocuments({ status: 'submitted' }),
        MidMark.countDocuments({ status: 'approved'  })
      ]);
    res.json({ success: true, stats: { totalStudents, totalFaculty, totalHODs, totalMarksSubmitted, totalApproved } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;