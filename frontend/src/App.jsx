import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api/habits';
const CATEGORIES = ['Study', 'Health', 'Fitness', 'Personal', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];

function App() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state for creating a habit
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Study');
  const [newHabitPriority, setNewHabitPriority] = useState('Medium');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // State for editing a habit
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingCategory, setEditingCategory] = useState('Study');
  const [editingPriority, setEditingPriority] = useState('Medium');

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');

  // Light / Dark Theme state (persisted in localStorage)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Track action per habit ID to prevent double clicks
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Synchronize theme with html data-theme attribute and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch all habits from backend API
  const fetchHabits = async () => {
    try {
      setError(null);
      const res = await fetch(API_BASE);
      if (!res.ok) {
        throw new Error('Failed to fetch habits');
      }
      const data = await res.json();
      setHabits(data);
    } catch (err) {
      console.error('Error loading habits:', err);
      setError('Unable to load habits. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Toggle theme handler
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Add a new habit with category & priority
  const handleAddHabit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = newHabitName.trim();
    if (!trimmedName) {
      setFormError('Habit name cannot be empty.');
      return;
    }

    if (trimmedName.length > 100) {
      setFormError('Habit name cannot exceed 100 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          category: newHabitCategory,
          priority: newHabitPriority,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to add habit.');
        return;
      }

      setHabits((prev) => [data, ...prev]);
      setNewHabitName('');
      setNewHabitCategory('Study');
      setNewHabitPriority('Medium');
    } catch (err) {
      console.error('Error adding habit:', err);
      setFormError('Server connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark habit as completed for today
  const handleCompleteHabit = async (id) => {
    if (actionLoadingId === id) return;
    setActionLoadingId(id);

    try {
      const res = await fetch(`${API_BASE}/${id}/complete`, {
        method: 'PUT',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to mark habit as complete.');
        return;
      }

      setHabits((prev) =>
        prev.map((habit) => (habit._id === id ? data : habit))
      );
    } catch (err) {
      console.error('Error completing habit:', err);
      alert('Unable to complete habit. Please check backend connection.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Start edit mode for habit
  const handleStartEdit = (habit) => {
    setEditingId(habit._id);
    setEditingName(habit.name);
    setEditingCategory(habit.category || 'Study');
    setEditingPriority(habit.priority || 'Medium');
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingCategory('Study');
    setEditingPriority('Medium');
  };

  // Save edited habit name, category & priority
  const handleSaveEdit = async (id) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      alert('Habit name cannot be empty.');
      return;
    }

    if (actionLoadingId === id) return;
    setActionLoadingId(id);

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          category: editingCategory,
          priority: editingPriority,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to update habit.');
        return;
      }

      setHabits((prev) =>
        prev.map((habit) => (habit._id === id ? data : habit))
      );
      setEditingId(null);
      setEditingName('');
    } catch (err) {
      console.error('Error updating habit:', err);
      alert('Unable to update habit details.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete habit
  const handleDeleteHabit = async (id, name) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    if (actionLoadingId === id) return;
    setActionLoadingId(id);

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to delete habit.');
        return;
      }

      setHabits((prev) => prev.filter((habit) => habit._id !== id));
    } catch (err) {
      console.error('Error deleting habit:', err);
      alert('Unable to delete habit.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Calculate summary metrics
  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.isCompletedToday).length;
  const remainingToday = totalHabits - completedToday;
  const todayProgress = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Calculate Weekly Progress (days out of last 7 days with at least one completed habit)
  const getWeeklyCompletedDays = (habitsList) => {
    const past7Days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      past7Days.push(`${y}-${m}-${day}`);
    }

    const allCompletedDates = new Set();
    habitsList.forEach((h) => {
      (h.completedDates || []).forEach((dateStr) => allCompletedDates.add(dateStr));
    });

    return past7Days.filter((dateStr) => allCompletedDates.has(dateStr)).length;
  };
  const weeklyProgressDays = getWeeklyCompletedDays(habits);

  // Motivational message based on today's progress percentage
  const getMotivationalMessage = (progress) => {
    if (progress === 0) return "Let's get started! 💪";
    if (progress < 50) return "Great start! Keep going! 🔥";
    if (progress < 100) return "You're almost there! 🚀";
    return "Amazing! All habits completed! 🎉";
  };

  // Processed habits: Search -> Filter -> Sort
  const processedHabits = habits
    .filter((habit) =>
      habit.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
    .filter((habit) => {
      if (filter === 'Completed') return habit.isCompletedToday;
      if (filter === 'Remaining') return !habit.isCompletedToday;
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === 'Oldest First') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'Highest Streak') {
        return b.streak - a.streak;
      }
      if (sortBy === 'Alphabetical') {
        return a.name.localeCompare(b.name);
      }
      // Default: 'Newest First'
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  // Formatted date string
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="app-layout">
      <div className="container">
        {/* Header Section */}
        <header className="app-header">
          <div className="header-brand">
            <div className="logo-badge">⚡</div>
            <div>
              <h1 className="app-title">Habit Tracker</h1>
              <p className="app-subtitle">Build consistency, one day at a time.</p>
            </div>
          </div>
          <div className="header-controls">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className="header-date">
              <span className="date-icon">📅</span>
              <span>{todayFormatted}</span>
            </div>
          </div>
        </header>

        {/* Summary Cards Section (4 Columns) */}
        <section className="summary-section">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="card-top">
                <span className="summary-label">Total Habits</span>
                <span className="card-icon icon-blue">📋</span>
              </div>
              <div className="summary-value">{totalHabits}</div>
            </div>

            <div className="summary-card">
              <div className="card-top">
                <span className="summary-label">Completed Today</span>
                <span className="card-icon icon-green">✅</span>
              </div>
              <div className="summary-value text-success">{completedToday}</div>
            </div>

            <div className="summary-card">
              <div className="card-top">
                <span className="summary-label">Remaining Today</span>
                <span className="card-icon icon-amber">⏳</span>
              </div>
              <div className="summary-value text-amber">{remainingToday}</div>
            </div>

            <div className="summary-card progress-card">
              <div className="card-top">
                <span className="summary-label">Today's Progress</span>
                <span className="card-icon icon-purple">🎯</span>
              </div>
              <div className="summary-value text-purple">{todayProgress}%</div>
              <div className="mini-progress-bg">
                <div 
                  className="mini-progress-fill" 
                  style={{ width: `${todayProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Add Habit Compact Section */}
        <section className="add-section">
          <div className="add-habit-card">
            <h2 className="add-title">Add New Habit</h2>
            <form onSubmit={handleAddHabit} className="add-habit-form">
              <input
                type="text"
                className="habit-input"
                placeholder="What habit do you want to build? (e.g., Read 20 Pages)..."
                value={newHabitName}
                onChange={(e) => {
                  setNewHabitName(e.target.value);
                  if (formError) setFormError(null);
                }}
                disabled={submitting}
              />
              <select
                className="select-input"
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                disabled={submitting}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                className="select-input"
                value={newHabitPriority}
                onChange={(e) => setNewHabitPriority(e.target.value)}
                disabled={submitting}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} Priority
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Adding...' : '+ Add Habit'}
              </button>
            </form>

            {formError && <div className="alert alert-error">{formError}</div>}
          </div>
        </section>

        {/* Dashboard 2-Column Grid (Main habits list on left, Sidebar on right) */}
        <div className="dashboard-grid">
          {/* MAIN HABITS SECTION */}
          <main className="dashboard-main">
            <div className="section-header">
              <div>
                <h2 className="section-title">Today's Habits</h2>
                <p className="section-subtitle">Stay consistent and complete your daily goals.</p>
              </div>
            </div>

            {/* Controls Bar: Search, Filter Tabs, Sort Dropdown */}
            <div className="controls-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search habits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>
                    ✕
                  </button>
                )}
              </div>

              <div className="controls-right">
                <div className="filter-tabs">
                  {['All', 'Completed', 'Remaining'].map((f) => (
                    <button
                      key={f}
                      className={`filter-btn ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <select
                  className="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Newest First">Newest First</option>
                  <option value="Oldest First">Oldest First</option>
                  <option value="Highest Streak">Highest Streak</option>
                  <option value="Alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Habit Grid */}
            {loading ? (
              <div className="state-container">
                <div className="spinner"></div>
                <p>Loading your habits...</p>
              </div>
            ) : error ? (
              <div className="state-container error-state">
                <p>{error}</p>
                <button className="btn btn-secondary btn-sm" onClick={fetchHabits} style={{ marginTop: '0.75rem' }}>
                  Retry Connection
                </button>
              </div>
            ) : habits.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">🎯</div>
                <h3 className="empty-title">No habits tracked yet</h3>
                <p className="empty-text">Add your first habit to start tracking your consistency.</p>
              </div>
            ) : processedHabits.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No matching habits found</h3>
                <p className="empty-text">Try adjusting your search query or filter selection.</p>
              </div>
            ) : (
              <div className="habits-grid">
                {processedHabits.map((habit) => (
                  <div
                    key={habit._id}
                    className={`habit-card ${
                      habit.isCompletedToday ? 'is-completed' : ''
                    }`}
                  >
                    {editingId === habit._id ? (
                      <div className="edit-form">
                        <div className="edit-inputs">
                          <input
                            type="text"
                            className="habit-input"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            autoFocus
                          />
                          <select
                            className="select-input"
                            value={editingCategory}
                            onChange={(e) => setEditingCategory(e.target.value)}
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <select
                            className="select-input"
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value)}
                          >
                            {PRIORITIES.map((p) => (
                              <option key={p} value={p}>
                                {p} Priority
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="edit-actions">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSaveEdit(habit._id)}
                            disabled={actionLoadingId === habit._id}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={handleCancelEdit}
                            disabled={actionLoadingId === habit._id}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="habit-top">
                          <div className="habit-title-row">
                            <div className="title-with-badge">
                              <h3 className="habit-name">{habit.name}</h3>
                              <span className="category-badge">{habit.category || 'Study'}</span>
                              <span className={`priority-badge priority-${(habit.priority || 'Medium').toLowerCase()}`}>
                                {habit.priority || 'Medium'}
                              </span>
                            </div>
                            <span
                              className={`status-badge ${
                                habit.isCompletedToday
                                  ? 'status-completed'
                                  : 'status-pending'
                              }`}
                            >
                              {habit.isCompletedToday ? '✓ Done' : 'In Progress'}
                            </span>
                          </div>
                        </div>

                        <div className="habit-body">
                          <div className="metrics-row">
                            <div className="streaks-group">
                              <span className="streak-badge">
                                🔥 <strong className="streak-count">{habit.streak}</strong> {habit.streak === 1 ? 'day' : 'days'}
                              </span>
                              <span className="best-streak-badge">
                                🏆 Best: <strong>{habit.bestStreak || habit.streak}</strong>
                              </span>
                            </div>

                            <div className="rate-info">
                              <span>Rate:</span>
                              <strong>{habit.completionPercentage}%</strong>
                            </div>
                          </div>

                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(100, habit.completionPercentage)}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div className="habit-footer">
                          <span className="created-date">
                            {new Date(habit.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>

                          <div className="action-buttons">
                            {habit.isCompletedToday ? (
                              <button className="btn btn-sm btn-completed" disabled>
                                ✓ Done
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleCompleteHabit(habit._id)}
                                disabled={actionLoadingId === habit._id}
                              >
                                {actionLoadingId === habit._id
                                  ? '...'
                                  : 'Complete'}
                              </button>
                            )}

                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleStartEdit(habit)}
                              disabled={actionLoadingId === habit._id}
                            >
                              Edit
                            </button>

                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteHabit(habit._id, habit.name)}
                              disabled={actionLoadingId === habit._id}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="dashboard-sidebar">
            {/* THIS WEEK CARD */}
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <span className="sidebar-card-icon">📅</span>
                <h3 className="sidebar-card-title">This Week</h3>
              </div>
              <div className="sidebar-value-row">
                <span className="sidebar-big-num">{weeklyProgressDays}</span>
                <span className="sidebar-sub-num">/ 7 days active</span>
              </div>
              <div className="sidebar-progress-bg">
                <div
                  className="sidebar-progress-fill"
                  style={{ width: `${Math.round((weeklyProgressDays / 7) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* TODAY'S SUMMARY CARD */}
            {totalHabits > 0 && (
              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <span className="sidebar-card-icon">📊</span>
                  <h3 className="sidebar-card-title">Today's Summary</h3>
                </div>
                <div className="sidebar-value-row">
                  <span className="sidebar-big-num">{completedToday}</span>
                  <span className="sidebar-sub-num">/ {totalHabits} habits completed</span>
                </div>
                <p className="sidebar-desc">
                  You have <strong>{remainingToday}</strong> remaining habit{remainingToday === 1 ? '' : 's'} today.
                </p>
              </div>
            )}

            {/* MOTIVATIONAL CARD */}
            {totalHabits > 0 && (
              <div className="sidebar-card motivational-sidebar-card">
                <div className="sidebar-card-header">
                  <span className="sidebar-card-icon">🔥</span>
                  <h3 className="sidebar-card-title">Motivation</h3>
                </div>
                <p className="sidebar-motivation-text">
                  {getMotivationalMessage(todayProgress)}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;




