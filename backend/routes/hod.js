const express = require('express');
const router  = express.Router();
const MidMark = require('../models/MidMark');
const { protect, authorize } = require('../middleware/auth');
const ha = [protect, authorize('hod', 'admin')];

// ── GET marks for HOD review ──────────────────────────
router.get('/marks', ...ha, async (req, res) => {
  try {
    const filter = {};
    // Default: show submitted + approved + rejected
    filter.status = req.query.status
      ? req.query.status
      : { $in: ['submitted', 'approved', 'rejected'] };

    if (req.query.branch)      filter.branch      = req.query.branch;
    if (req.query.semester)    filter.semester    = req.query.semester;
    if (req.query.section)     filter.section     = req.query.section;
    if (req.query.subjectCode) filter.subjectCode = req.query.subjectCode;

    const marks = await MidMark.find(filter)
      .populate('student', 'name rollNo')
      .populate('faculty',  'name')
      .sort({ createdAt: -1 });

    console.log(`HOD: found ${marks.length} marks with filter`, filter);
    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT approve ───────────────────────────────────────
router.put('/marks/:id/approve', ...ha, async (req, res) => {
  try {
    const mark = await MidMark.findById(req.params.id);
    if (!mark)
      return res.status(404).json({ success: false, message: 'Mark not found' });
    if (mark.status !== 'submitted')
      return res.status(400).json({ success: false, message: 'Only submitted marks can be approved' });

    mark.status     = 'approved';
    mark.isLocked   = true;
    mark.approvedAt = new Date();
    mark.auditLog.push({ action: 'approved', performedBy: req.user._id, details: 'Approved by HOD' });
    await mark.save();

    // Try calculating internal marks if both mids are approved
    await calculateInternal(mark.student, mark.subjectCode);

    res.json({ success: true, message: 'Marks approved and locked', mark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT reject ────────────────────────────────────────
router.put('/marks/:id/reject', ...ha, async (req, res) => {
  try {
    const mark = await MidMark.findById(req.params.id);
    if (!mark)
      return res.status(404).json({ success: false, message: 'Mark not found' });
    if (mark.status !== 'submitted')
      return res.status(400).json({ success: false, message: 'Only submitted marks can be rejected' });

    mark.status     = 'rejected';
    mark.hodComment = req.body.comment || '';
    mark.auditLog.push({
      action: 'rejected', performedBy: req.user._id,
      details: req.body.comment || 'Rejected by HOD'
    });
    await mark.save();
    res.json({ success: true, message: 'Marks rejected', mark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET dashboard stats ───────────────────────────────
router.get('/dashboard', ...ha, async (req, res) => {
  try {
    const [submitted, approved, rejected, draft] = await Promise.all([
      MidMark.countDocuments({ status: 'submitted' }),
      MidMark.countDocuments({ status: 'approved'  }),
      MidMark.countDocuments({ status: 'rejected'  }),
      MidMark.countDocuments({ status: 'draft'     })
    ]);
    res.json({ success: true, stats: { submitted, approved, rejected, draft } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Best-of-Two internal marks calculation ────────────
async function calculateInternal(studentId, subjectCode) {
  try {
    const mids = await MidMark.find({
      student: studentId, subjectCode, status: 'approved'
    }).sort({ midNumber: 1 });

    if (mids.length < 2) {
      console.log(`Only ${mids.length} mid approved for ${subjectCode} — internal pending`);
      return;
    }

    const scores   = mids.map(m => Number(m.totalMidMarks) || 0);
    const best     = Math.max(...scores);
    const second   = Math.min(...scores);
    const internal = Math.round((best * 0.8) + (second * 0.2));

    console.log(`Internal calc: best=${best}, second=${second}, internal=${internal}`);

    await MidMark.updateMany(
      { student: studentId, subjectCode },
      { $set: { internalMarks: internal } }
    );
  } catch (err) {
    console.error('Internal calc error:', err.message);
  }
}

module.exports = router;