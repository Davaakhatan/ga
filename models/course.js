import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  COURSE_NUMBER: String,
  TITLE_START_DATE: String,
  ACADEMIC_LEVEL: String,
  CAPACITY: Number,
  NUMBER_OF_STUDENTS: Number,
  STATUS: String,
  INSTRUCTOR: String,
  START_TIME: String,
  END_TIME: String,
  MEETING_DAYS: String,
  BUILDING: String,
  ROOM: String,
  FEE: String,
  MIN_CREDITS: Number,
  MAX_CREDITS: Number,
  SECTION: String,
  TERM: String,
  SEQ_NO: Number,
  SCHOOLS: String,
  ACADEMIC_LEVEL_1: String
});

export const Course = mongoose.model('Course', courseSchema);