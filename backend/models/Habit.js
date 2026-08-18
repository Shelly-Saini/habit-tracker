const mongoose = require('mongoose');

// Define the Habit schema
const habitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Study', 'Health', 'Fitness', 'Personal', 'Other'],
    default: 'Study',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedDates: {
    type: [String], // Array of strings formatted as "YYYY-MM-DD"
    default: [],
  },
});

// Export the Habit model
module.exports = mongoose.model('Habit', habitSchema);


