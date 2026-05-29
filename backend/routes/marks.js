const express = require('express');
const router  = express.Router();
const MidMark = require('../models/MidMark');
const { protect } = require('../middleware/auth');

router.get('/:id', protect, async (req, res) => {
  try {
    const mark = await MidMark.findById(req.params.id)
      .populate('student', 'name rollNo').populate('faculty', 'name');
    if (!mark) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, mark });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;