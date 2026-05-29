const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const MidMark = require('../models/MidMark');
const AcademicConfig = require('../models/AcademicConfig');
const { protect, authorize } = require('../middleware/auth');
const fa = [protect, authorize('faculty', 'admin')];

// ── GET students ──────────────────────────────────────
router.get('/students', ...fa, async (req, res) => {
  try {
    const { branch, semester, section } = req.query;
    if (!branch || !semester || !section)
      return res.status(400).json({ success: false, message: 'branch, semester, section required' });
    const students = await User.find({
      role: 'student', branch, semester, section, isActive: true
    }).select('name rollNo branch semester section');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET config ────────────────────────────────────────
router.get('/config', protect, async (req, res) => {
  try {
    const config = await AcademicConfig.findOne();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET faculty's own marks ───────────────────────────
router.get('/marks', ...fa, async (req, res) => {
  try {
    const filter = { faculty: req.user._id };
    if (req.query.branch)      filter.branch      = req.query.branch;
    if (req.query.semester)    filter.semester    = req.query.semester;
    if (req.query.section)     filter.section     = req.query.section;
    if (req.query.subjectCode) filter.subjectCode = req.query.subjectCode;
    if (req.query.midNumber)   filter.midNumber   = parseInt(req.query.midNumber);
    const marks = await MidMark.find(filter).populate('student', 'name rollNo');
    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST save marks (draft) ───────────────────────────
router.post('/marks', ...fa, async (req, res) => {
  try {
    const {
      studentId, subjectCode, subjectName, midNumber,
      partA, partB, assignmentMarks,
      branch, semester, section
    } = req.body;

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    // Check if already locked
    const existing = await MidMark.findOne({
      student: studentId, subjectCode, midNumber: parseInt(midNumber)
    });
    if (existing?.isLocked)
      return res.status(403).json({ success: false, message: 'Marks locked after HOD approval' });

    // ✅ Explicitly calculate totals here (don't rely only on pre-save)
    const pa = partA || {};
    const pb = partB || {};

    const partATotal = ['a1','a2','a3','a4','a5']
      .reduce((sum, k) => sum + Math.min(Number(pa[k]) || 0, 2), 0);

    const partBRaw = ['b1','b2','b3']
      .reduce((sum, k) => sum + Math.min(Number(pb[k]) || 0, 10), 0);

    const partBTotal    = Math.round(partBRaw / 2);
    const midExamMarks  = partATotal + partBTotal;
    const totalMidMarks = Math.min(midExamMarks + (Number(assignmentMarks) || 0), 30);

    console.log(`Saving marks — ${student.name} | ${subjectCode} | Mid${midNumber}`);
    console.log(`  partA:`, pa, '| partATotal:', partATotal);
    console.log(`  partB:`, pb, '| partBRaw:', partBRaw, '| partBTotal:', partBTotal);
    console.log(`  written: ${midExamMarks} | assign: ${assignmentMarks} | total: ${totalMidMarks}`);

    const data = {
      student:         studentId,
      rollNo:          student.rollNo,
      studentName:     student.name,
      faculty:         req.user._id,
      branch, semester, section,
      subjectCode,     subjectName,
      midNumber:       parseInt(midNumber),
      partA:           pa,
      partB:           pb,
      assignmentMarks: Number(assignmentMarks) || 0,
      // ✅ Set calculated values directly
      partATotal,
      partBRaw,
      partBTotal,
      midExamMarks,
      totalMidMarks,
      status: 'draft'
    };

    let mark;
    if (existing) {
      Object.assign(existing, data);
      existing.auditLog.push({
        action: 'updated', performedBy: req.user._id, details: 'Updated by faculty'
      });
      mark = await existing.save();
    } else {
      mark = new MidMark(data);
      mark.auditLog.push({
        action: 'created', performedBy: req.user._id, details: 'Created by faculty'
      });
      await mark.save();
    }

    res.status(201).json({ success: true, mark });
  } catch (err) {
    console.error('Save marks error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT bulk-submit (MUST be before /:id) ─────────────
router.put('/marks/bulk-submit', ...fa, async (req, res) => {
  try {
    const { branch, semester, section, subjectCode, midNumber } = req.body;
    console.log('Bulk submit:', { branch, semester, section, subjectCode, midNumber });

    const marks = await MidMark.find({
      faculty:    req.user._id,
      branch, semester, section,
      subjectCode,
      midNumber:  parseInt(midNumber),
      status:     'draft'
    });

    console.log(`Found ${marks.length} draft records to submit`);

    if (marks.length === 0)
      return res.status(400).json({
        success: false,
        message: 'No draft marks found. Please click "Save Draft" first, then submit.'
      });

    for (const mark of marks) {
      mark.status      = 'submitted';
      mark.submittedAt = new Date();
      mark.auditLog.push({
        action: 'submitted', performedBy: req.user._id, details: 'Submitted to HOD'
      });
      await mark.save();
    }

    res.json({
      success: true,
      message: `${marks.length} records submitted to HOD successfully`,
      count:   marks.length
    });
  } catch (err) {
    console.error('Bulk submit error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT submit single ─────────────────────────────────
router.put('/marks/:id/submit', ...fa, async (req, res) => {
  try {
    const mark = await MidMark.findById(req.params.id);
    if (!mark)        return res.status(404).json({ success: false, message: 'Not found' });
    if (mark.isLocked) return res.status(403).json({ success: false, message: 'Marks locked' });
    mark.status      = 'submitted';
    mark.submittedAt = new Date();
    mark.auditLog.push({ action: 'submitted', performedBy: req.user._id, details: 'Submitted to HOD' });
    await mark.save();
    res.json({ success: true, mark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;