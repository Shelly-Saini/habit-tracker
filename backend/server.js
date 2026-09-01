const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Habit = require('./models/Habit');

const app = express();
const PORT = process.env.PORT || 5000;

// Shared validation constants
const VALID_CATEGORIES = ['Study', 'Health', 'Fitness', 'Personal', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get today's date as "YYYY-MM-DD"
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to get previous day's date string "YYYY-MM-DD"
function getPreviousDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

// Helper function to calculate current streak
// Rule: If today is completed -> count consecutive days backwards from today.
// If today is NOT completed -> streak = 0.
function calculateStreak(completedDates, todayStr) {
  const datesSet = new Set(completedDates);

  if (!datesSet.has(todayStr)) {
    return 0;
  }

  let streak = 0;
  let checkDate = todayStr;

  while (datesSet.has(checkDate)) {
    streak++;
    checkDate = getPreviousDateString(checkDate);
  }

  return streak;
}

// Helper function to calculate best streak (longest consecutive completed days sequence)
function calculateBestStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0;

  // Sort unique dates chronologically
  const sortedDates = Array.from(new Set(completedDates)).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    // Difference in calendar days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

// Helper function to calculate completion percentage
// Formula: (completed days / days since creation) * 100, rounded to whole number (max 100%)
function calculateCompletionPercentage(completedDates, createdAt) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);

  // Total calendar days elapsed since creation (minimum 1 day)
  const diffTime = today.getTime() - created.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = Math.max(1, diffDays);

  const totalCompleted = completedDates.length;
  let percentage = Math.round((totalCompleted / totalDays) * 100);

  if (percentage > 100) {
    percentage = 100;
  }

  return percentage;
}

// Format habit object with computed fields for frontend
function formatHabitResponse(habitDoc) {
  const todayStr = getTodayString();
  const completedDates = habitDoc.completedDates || [];
  const isCompletedToday = completedDates.includes(todayStr);
  const streak = calculateStreak(completedDates, todayStr);
  const bestStreak = calculateBestStreak(completedDates);
  const completionPercentage = calculateCompletionPercentage(completedDates, habitDoc.createdAt);

  return {
    _id: habitDoc._id,
    name: habitDoc.name,
    category: habitDoc.category || 'Study',
    priority: habitDoc.priority || 'Medium',
    createdAt: habitDoc.createdAt,
    completedDates: habitDoc.completedDates,
    isCompletedToday,
    streak,
    bestStreak,
    completionPercentage,
  };
}

// --- REST API ENDPOINTS ---

// Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Habit Tracker API is running!');
});

// GET /api/habits - Fetch all habits
app.get('/api/habits', async (req, res) => {
  try {
    const habits = await Habit.find().sort({ createdAt: -1 });
    const formattedHabits = habits.map(formatHabitResponse);
    res.json(formattedHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Unable to load habits. Please try again.' });
  }
});

// POST /api/habits - Create a new habit
app.post('/api/habits', async (req, res) => {
  try {
    const { name, category, priority } = req.body;

    // Basic Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Habit name cannot be empty.' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({ error: 'Habit name cannot exceed 100 characters.' });
    }

    const habitCategory = VALID_CATEGORIES.includes(category) ? category : 'Study';

    const habitPriority = VALID_PRIORITIES.includes(priority) ? priority : 'Medium';

    const newHabit = new Habit({
      name: trimmedName,
      category: habitCategory,
      priority: habitPriority,
      completedDates: [],
    });

    const savedHabit = await newHabit.save();
    res.status(201).json(formatHabitResponse(savedHabit));
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit. Please try again.' });
  }
});

// PUT /api/habits/:id - Edit habit name, category, or priority
app.put('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID format.' });
    }

    const updateFields = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Habit name cannot be empty.' });
      }
      const trimmedName = name.trim();
      if (trimmedName.length > 100) {
        return res.status(400).json({ error: 'Habit name cannot exceed 100 characters.' });
      }
      updateFields.name = trimmedName;
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Invalid category selected.' });
      }
      updateFields.category = category;
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority selected.' });
      }
      updateFields.priority = priority;
    }

    const updatedHabit = await Habit.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedHabit) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    res.json(formatHabitResponse(updatedHabit));
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Failed to update habit. Please try again.' });
  }
});



// DELETE /api/habits/:id - Delete a habit
app.delete('/api/habits/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID format.' });
    }

    const deletedHabit = await Habit.findByIdAndDelete(id);

    if (!deletedHabit) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    res.json({ message: 'Habit deleted successfully.', id });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Failed to delete habit. Please try again.' });
  }
});

// PUT /api/habits/:id/complete - Mark habit complete for today
app.put('/api/habits/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid habit ID format.' });
    }

    const habit = await Habit.findById(id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found.' });
    }

    const todayStr = getTodayString();

    // Prevent duplicate completion for the same day
    if (!habit.completedDates.includes(todayStr)) {
      habit.completedDates.push(todayStr);
      await habit.save();
    }

    res.json(formatHabitResponse(habit));
  } catch (error) {
    console.error('Error completing habit:', error);
    res.status(500).json({ error: 'Failed to mark habit complete. Please try again.' });
  }
});

// MongoDB Connection & Server Start
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.warn('WARNING: MONGO_URI is not set in environment variables.');
}

mongoose
  .connect(MONGO_URI || 'mongodb://127.0.0.1:27017/habit-tracker')
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    // Start Express server even if MongoDB connection fails initially so API endpoint errors can be caught gracefully
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (MongoDB disconnected)`);
    });
  });
