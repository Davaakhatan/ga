import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  credits: {
    type: Number,
    required: true,
  },
  course: {
    type: String,
    required: true,
  }
});

const catalogSchema = new mongoose.Schema({
  FRESHMAN: {
    Fall: [courseSchema],
    Spring: [courseSchema]
  },
  SOPHOMORE: {
    Fall: [courseSchema],
    Spring: [courseSchema]
  },
  JUNIOR: {
    Fall: [courseSchema],
    Spring: [courseSchema]
  },
  SENIOR: {
    Fall: [courseSchema],
    Spring: [courseSchema]
  }
});

export const Catalog = mongoose.model('Catalog', catalogSchema);
