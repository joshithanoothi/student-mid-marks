const mongoose = require('mongoose');

const midMarkSchema = new mongoose.Schema({
  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNo:      { type: String, required: true },
  studentName: { type: String, required: true },
  faculty:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branch:      { type: String, required: true },
  semester:    { type: String, required: true },
  section:     { type: String, required: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  midNumber:   { type: Number, enum: [1, 2], required: true },

  // Part A: 5 questions × 2 marks each = max 10
  partA: {
    a1: { type: Number, default: 0 },
    a2: { type: Number, default: 0 },
    a3: { type: Number, default: 0 },
    a4: { type: Number, default: 0 },
    a5: { type: Number, default: 0 }
  },

  // Part B: 3 questions × 10 marks each = max 30, then ÷2 = max 15
  partB: {
    b1: { type: Number, default: 0 },
    b2: { type: Number, default: 0 },
    b3: { type: Number, default: 0 }
  },

  partATotal:      { type: Number, default: 0 },  // max 10
  partBRaw:        { type: Number, default: 0 },  // max 30
  partBTotal:      { type: Number, default: 0 },  // max 15 (after ÷2)
  midExamMarks:    { type: Number, default: 0 },  // partATotal + partBTotal = max 25
  assignmentMarks: { type: Number, default: 0 },  // max 5
  totalMidMarks:   { type: Number, default: 0 },  // midExamMarks + assignment = max 30
  internalMarks:   { type: Number, default: null },

  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  hodComment:  { type: String, default: '' },
  isLocked:    { type: Boolean, default: false },
  submittedAt: { type: Date },
  approvedAt:  { type: Date },
  auditLog: [{
    action:      String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp:   { type: Date, default: Date.now },
    details:     String
  }]
}, { timestamps: true });

// ✅ FIXED pre-save: safely read plain object or mongoose subdoc
midMarkSchema.pre('save', function (next) {
  try {
    // Safely get partA values
    const pa = this.partA
      ? (typeof this.partA.toObject === 'function' ? this.partA.toObject() : this.partA)
      : {};

    // Safely get partB values
    const pb = this.partB
      ? (typeof this.partB.toObject === 'function' ? this.partB.toObject() : this.partB)
      : {};

    // Part A total: a1+a2+a3+a4+a5, each max 2, total max 10
    const partATotal = ['a1','a2','a3','a4','a5']
      .reduce((sum, k) => sum + Math.min(Number(pa[k]) || 0, 2), 0);

    // Part B raw: b1+b2+b3, each max 10, raw max 30
    const partBRaw = ['b1','b2','b3']
      .reduce((sum, k) => sum + Math.min(Number(pb[k]) || 0, 10), 0);

    // Part B total: raw ÷ 2, max 15
    const partBTotal = Math.round(partBRaw / 2);

    // Written = partA + partB, max 25
    const midExamMarks = partATotal + partBTotal;

    // Grand total = written + assignment, max 30
    const totalMidMarks = Math.min(
      midExamMarks + (Number(this.assignmentMarks) || 0),
      30
    );

    this.partATotal    = partATotal;
    this.partBRaw      = partBRaw;
    this.partBTotal    = partBTotal;
    this.midExamMarks  = midExamMarks;
    this.totalMidMarks = totalMidMarks;

    console.log(`[MidMark] ${this.studentName} | Mid${this.midNumber} | ${this.subjectCode}`);
    console.log(`  partA:`, pa, '=> total:', partATotal);
    console.log(`  partB:`, pb, '=> raw:', partBRaw, '=> /2:', partBTotal);
    console.log(`  written: ${midExamMarks} | assign: ${this.assignmentMarks} | TOTAL: ${totalMidMarks}`);
  } catch (err) {
    console.error('[MidMark pre-save error]', err);
  }
  next();
});

midMarkSchema.index({ student: 1, subjectCode: 1, midNumber: 1 }, { unique: true });

module.exports = mongoose.model('MidMark', midMarkSchema);