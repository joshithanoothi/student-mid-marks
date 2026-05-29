const express     = require('express');
const router      = express.Router();
const ExcelJS     = require('exceljs');
const PDFDocument = require('pdfkit');
const MidMark     = require('../models/MidMark');
const { protect } = require('../middleware/auth');

function buildFilter(req) {
  const filter = {};
  if (req.user.role === 'student') { filter.student = req.user._id; filter.status = 'approved'; }
  if (req.query.branch)      filter.branch      = req.query.branch;
  if (req.query.semester)    filter.semester    = req.query.semester;
  if (req.query.section)     filter.section     = req.query.section;
  if (req.query.subjectCode) filter.subjectCode = req.query.subjectCode;
  if (req.query.midNumber)   filter.midNumber   = parseInt(req.query.midNumber);
  if (req.query.status)      filter.status      = req.query.status;
  return filter;
}

async function getMarks(filter) {
  return MidMark.find(filter)
    .populate('student', 'name rollNo branch semester section')
    .populate('faculty', 'name')
    .sort({ rollNo: 1 });
}

router.get('/excel', protect, async (req, res) => {
  try {
    const marks = await getMarks(buildFilter(req));
    const wb    = new ExcelJS.Workbook();
    const ws    = wb.addWorksheet('Mid Marks');
    ws.columns = [
      { header: 'Roll No',      key: 'rollNo',          width: 14 },
      { header: 'Student Name', key: 'studentName',     width: 22 },
      { header: 'Branch',       key: 'branch',          width: 10 },
      { header: 'Semester',     key: 'semester',        width: 10 },
      { header: 'Section',      key: 'section',         width: 10 },
      { header: 'Subject Code', key: 'subjectCode',     width: 14 },
      { header: 'Subject Name', key: 'subjectName',     width: 24 },
      { header: 'Mid No',       key: 'midNumber',       width: 8  },
      { header: 'Written /25',  key: 'midExamMarks',    width: 12 },
      { header: 'Assign /5',    key: 'assignmentMarks', width: 12 },
      { header: 'Total /30',    key: 'totalMidMarks',   width: 12 },
      { header: 'Internal',     key: 'internalMarks',   width: 12 },
      { header: 'Status',       key: 'status',          width: 12 }
    ];
    const hr = ws.getRow(1);
    hr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    hr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    marks.forEach(m => ws.addRow({
      rollNo: m.rollNo, studentName: m.studentName,
      branch: m.branch, semester: m.semester, section: m.section,
      subjectCode: m.subjectCode, subjectName: m.subjectName,
      midNumber: m.midNumber, midExamMarks: m.midExamMarks,
      assignmentMarks: m.assignmentMarks, totalMidMarks: m.totalMidMarks,
      internalMarks: m.internalMarks ?? 'Pending', status: m.status
    }));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=mid_marks.xlsx');
    await wb.xlsx.write(res); res.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/pdf', protect, async (req, res) => {
  try {
    const marks = await getMarks(buildFilter(req));
    const doc   = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=mid_marks.pdf');
    doc.pipe(res);
    doc.fontSize(16).font('Helvetica-Bold').text('VEMU Institute of Technology', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Student Mid Marks Report', { align: 'center' });
    doc.moveDown();
    const headers   = ['Roll No','Name','Subject','Mid','Written','Assign','Total','Internal','Status'];
    const colWidths = [70, 110, 100, 35, 60, 55, 55, 60, 60];
    let x = 40; const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    headers.forEach((h, i) => {
      doc.rect(x, y, colWidths[i], 18).fill('#1E3A5F').stroke();
      doc.fillColor('white').text(h, x + 2, y + 4, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });
    doc.fillColor('black').moveDown(1.5);
    doc.font('Helvetica').fontSize(8);
    marks.forEach((m, idx) => {
      if (doc.y > 520) doc.addPage({ layout: 'landscape' });
      x = 40; const ry = doc.y; const bg = idx % 2 === 0 ? '#f5f5f5' : '#ffffff';
      const cells = [m.rollNo, m.studentName, m.subjectCode, `Mid ${m.midNumber}`,
        m.midExamMarks, m.assignmentMarks, m.totalMidMarks, m.internalMarks ?? 'Pending', m.status];
      cells.forEach((c, i) => {
        doc.rect(x, ry, colWidths[i], 16).fill(bg).stroke('#cccccc');
        doc.fillColor('black').text(String(c), x + 2, ry + 3, { width: colWidths[i] - 4 });
        x += colWidths[i];
      });
      doc.moveDown(1.1);
    });
    doc.end();
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;