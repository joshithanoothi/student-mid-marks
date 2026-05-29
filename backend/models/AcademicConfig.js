const mongoose = require('mongoose');

const academicConfigSchema = new mongoose.Schema({
  branches:  [{ type: String }],
  semesters: [{ type: String }],
  sections:  [{ type: String }],
  subjects: [{
    code:     { type: String, required: true },
    name:     { type: String, required: true },
    branch:   String,
    semester: String
  }],
  markLimits: {
    midExam:       { type: Number, default: 25 },
    assignment:    { type: Number, default: 5  },
    totalInternal: { type: Number, default: 30 }
  },
  bestOfTwoWeightage: {
    best:   { type: Number, default: 80 },
    second: { type: Number, default: 20 }
  }
}, { timestamps: true });

module.exports = mongoose.model('AcademicConfig', academicConfigSchema);