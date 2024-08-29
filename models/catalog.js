import mongoose from 'mongoose';

const catalogSchema = new mongoose.Schema({
  curriculumType: { type: String, required: true },
  FRESHMAN: {
    Fall: [{ credits: Number, course: String }],
    Spring: [{ credits: Number, course: String }]
  },
  SOPHOMORE: {
    Fall: [{ credits: Number, course: String }],
    Spring: [{ credits: Number, course: String }]
  },
  JUNIOR: {
    Fall: [{ credits: Number, course: String }],
    Spring: [{ credits: Number, course: String }]
  },
  SENIOR: {
    Fall: [{ credits: Number, course: String }],
    Spring: [{ credits: Number, course: String }]
  }
}, { strict: false });

const Catalog = mongoose.model('Catalog', catalogSchema);

export { Catalog };
