const express = require('express');
const router  = express.Router();
const MidMark = require('../models/MidMark');
const { protect, authorize } = require('../middleware/auth');

// ── GET student's own approved marks ─────────────────
router.get('/marks', protect, authorize('student'), async (req, res) => {
  try {
    const marks = await MidMark.find({
      student: req.user._id,
      status:  'approved'
    }).select('-auditLog').sort({ subjectCode: 1, midNumber: 1 });

    console.log(`Student ${req.user.rollNo}: found ${marks.length} approved marks`);

    // Group by subject
    const grouped = {};
    for (const m of marks) {
      if (!grouped[m.subjectCode]) {
        grouped[m.subjectCode] = {
          subjectCode:   m.subjectCode,
          subjectName:   m.subjectName,
          mids:          [],
          internalMarks: m.internalMarks || null
        };
      }
      grouped[m.subjectCode].mids.push(m);
      // Use latest internalMarks value
      if (m.internalMarks) {
        grouped[m.subjectCode].internalMarks = m.internalMarks;
      }
    }

    const result = Object.values(grouped);
    res.json({ success: true, marks: result });
  } catch (err) {
    console.error('Student marks error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;