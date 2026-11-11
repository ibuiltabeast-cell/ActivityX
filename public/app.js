// State and initial seed data
const STORAGE_KEY = 'activity_tracker_items';
const THEME_KEY = 'activity_tracker_theme';

const defaultActivities = [
  {
    id: 'act-1',
    title: 'Code review for team pull requests',
    category: 'Work',
    duration: 45,
    completed: true,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'act-2',
    title: '30-minute cardio & stretch workout',
    category: 'Fitness',
    duration: 30,
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'act-3',
    title: 'Explore modern web app architecture',
    category: 'Study',
    duration: 60,
    completed: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

const CATEGORY_COLORS = {
  Work: 'var(--cat-work)',
  Fitness: 'var(--cat-fitness)',
  Study: 'var(--cat-study)',
  Creative: 'var(--cat-creative)',
  Personal: 'var(--cat-personal)'
};

// App State
let activities = loadActivities();
let currentFilter = 'all';
let searchQuery = '';

// Active Timer State
let activeTimer = {
  activityId: null,
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  intervalId: null,
  isRunning: false
};

// DOM Elements
const activityForm = document.getElementById('activityForm');
const activityTitleInput = document.getElementById('activityTitle');
const activityCategoryInput = document.getElementById('activityCategory');
const activityDurationInput = document.getElementById('activityDuration');
const activityList = document.getElementById('activityList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterChips = document.querySelectorAll('.filter-chip');
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const presetChips = document.querySelectorAll('.preset-chip');

// Stats Elements
const statTotal = document.getElementById('statTotal');
const statCompleted = document.getElementById('statCompleted');
const statTime = document.getElementById('statTime');
const statRate = document.getElementById('statRate');
const totalHoursLabel = document.getElementById('totalHoursLabel');
const distributionBar = document.getElementById('distributionBar');
const categoryLegend = document.getElementById('categoryLegend');

// Timer Elements
const timerSection = document.getElementById('timerSection');
const timerActivityTitle = document.getElementById('timerActivityTitle');
const timerDisplay = document.getElementById('timerDisplay');
const timerProgressFill = document.getElementById('timerProgressFill');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const timerCompleteBtn = document.getElementById('timerCompleteBtn');
const timerCloseBtn = document.getElementById('timerCloseBtn');

// Actions
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFileInput');

// --- Initialization ---
function init() {
  initTheme();
  setupEventListeners();
  render();
}

// --- Persistence Helpers ---
function loadActivities() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultActivities;
  } catch (e) {
    console.error('Error loading data from localStorage', e);
    return defaultActivities;
  }
}

function saveActivities() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (e) {
    console.error('Error saving data to localStorage', e);
  }
}

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const activeTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  setTheme(activeTheme);
}

function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
  }
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// --- Web Audio Notification Beep ---
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.log('Audio notification prevented', err);
  }
}

// --- Event Listeners ---
function setupEventListeners() {
  themeToggleBtn.addEventListener('click', toggleTheme);

  activityForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAddActivity();
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderActivities();
  });

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      renderActivities();
    });
  });

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activityDurationInput.value = chip.getAttribute('data-time');
    });
  });

  // Timer controls
  timerStartBtn.addEventListener('click', toggleTimer);
  timerResetBtn.addEventListener('click', resetTimer);
  timerCompleteBtn.addEventListener('click', completeTimerActivity);
  timerCloseBtn.addEventListener('click', closeTimer);

  // List actions
  clearCompletedBtn.addEventListener('click', handleClearCompleted);
  exportBtn.addEventListener('click', exportActivitiesJSON);
  importFileInput.addEventListener('change', importActivitiesJSON);
}

// --- Activity Actions ---
function handleAddActivity() {
  const title = activityTitleInput.value.trim();
  const category = activityCategoryInput.value;
  const duration = parseInt(activityDurationInput.value, 10);

  if (!title) return;

  const newActivity = {
    id: 'act-' + Date.now(),
    title,
    category,
    duration: isNaN(duration) || duration < 1 ? 30 : duration,
    completed: false,
    createdAt: new Date().toISOString()
  };

  activities.unshift(newActivity);
  saveActivities();

  // Reset form
  activityTitleInput.value = '';
  activityTitleInput.focus();

  render();
}

function toggleActivity(id) {
  activities = activities.map((item) => {
    if (item.id === id) {
      return { ...item, completed: !item.completed };
    }
    return item;
  });

  saveActivities();
  render();
}

function deleteActivity(id) {
  if (activeTimer.activityId === id) {
    closeTimer();
  }
  activities = activities.filter((item) => item.id !== id);
  saveActivities();
  render();
}

function handleClearCompleted() {
  const completedCount = activities.filter((a) => a.completed).length;
  if (completedCount === 0) return;
  
  if (confirm(`Remove ${completedCount} completed activit${completedCount > 1 ? 'ies' : 'y'}?`)) {
    activities = activities.filter((a) => !a.completed);
    saveActivities();
    render();
  }
}

// --- Export & Import ---
function exportActivitiesJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activities, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `activities-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importActivitiesJSON(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        activities = imported;
        saveActivities();
        render();
        alert('Activities successfully imported!');
      } else {
        alert('Invalid file format. Expected a JSON list of activities.');
      }
    } catch (err) {
      alert('Could not parse JSON file: ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// --- Focus Timer Logic ---
function openFocusTimer(activityId) {
  const act = activities.find((a) => a.id === activityId);
  if (!act) return;

  pauseTimer();
  activeTimer.activityId = act.id;
  activeTimer.totalSeconds = (act.duration || 25) * 60;
  activeTimer.remainingSeconds = activeTimer.totalSeconds;
  activeTimer.isRunning = false;

  timerActivityTitle.textContent = act.title;
  timerSection.classList.remove('hidden');
  timerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  updateTimerDisplay();
}

function toggleTimer() {
  if (activeTimer.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (activeTimer.isRunning) return;
  activeTimer.isRunning = true;
  timerStartBtn.textContent = '⏸ Pause';
  timerStartBtn.classList.add('active-pause');

  activeTimer.intervalId = setInterval(() => {
    if (activeTimer.remainingSeconds > 0) {
      activeTimer.remainingSeconds--;
      updateTimerDisplay();
    } else {
      pauseTimer();
      playNotificationChime();
      alert(`Time is up for "${timerActivityTitle.textContent}"! Great job.`);
    }
  }, 1000);
}

function pauseTimer() {
  activeTimer.isRunning = false;
  timerStartBtn.textContent = '▶ Start';
  timerStartBtn.classList.remove('active-pause');
  if (activeTimer.intervalId) {
    clearInterval(activeTimer.intervalId);
    activeTimer.intervalId = null;
  }
  document.title = 'Activity Tracker';
}

function resetTimer() {
  pauseTimer();
  activeTimer.remainingSeconds = activeTimer.totalSeconds;
  updateTimerDisplay();
}

function completeTimerActivity() {
  if (activeTimer.activityId) {
    toggleActivity(activeTimer.activityId);
  }
  closeTimer();
}

function closeTimer() {
  pauseTimer();
  activeTimer.activityId = null;
  timerSection.classList.add('hidden');
  document.title = 'Activity Tracker';
}

function updateTimerDisplay() {
  const mins = Math.floor(activeTimer.remainingSeconds / 60);
  const secs = activeTimer.remainingSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  timerDisplay.textContent = formatted;

  if (activeTimer.isRunning) {
    document.title = `(${formatted}) ${timerActivityTitle.textContent} - Activity Tracker`;
  }

  const progressPercent = activeTimer.totalSeconds > 0 
    ? (activeTimer.remainingSeconds / activeTimer.totalSeconds) * 100 
    : 0;
  timerProgressFill.style.width = `${progressPercent}%`;
}

// --- Stats & Breakdown Calculation ---
function updateStats() {
  const total = activities.length;
  const completed = activities.filter((a) => a.completed).length;
  const totalMinutes = activities.reduce((sum, a) => sum + (Number(a.duration) || 0), 0);
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statTime.textContent = totalMinutes >= 60 
    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
    : `${totalMinutes}m`;
  statRate.textContent = `${completionRate}%`;

  const hours = Math.floor(totalMinutes / 60);
  const remMins = totalMinutes % 60;
  totalHoursLabel.textContent = `${hours}h ${remMins}m total planned`;

  // Update Category Distribution Bar
  renderDistribution(totalMinutes);
}

function renderDistribution(totalMinutes) {
  distributionBar.innerHTML = '';
  categoryLegend.innerHTML = '';

  if (totalMinutes === 0) {
    distributionBar.innerHTML = '<div style="width: 100%; background: var(--surface-border);"></div>';
    categoryLegend.innerHTML = '<span>No activity time logged yet</span>';
    return;
  }

  // Group durations by category
  const categoryTotals = {};
  activities.forEach((act) => {
    const cat = act.category || 'Personal';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(act.duration) || 0);
  });

  Object.keys(categoryTotals).forEach((cat) => {
    const catMinutes = categoryTotals[cat];
    const percentage = ((catMinutes / totalMinutes) * 100).toFixed(1);
    const color = CATEGORY_COLORS[cat] || 'var(--primary)';

    // Bar segment
    const segment = document.createElement('div');
    segment.className = 'progress-segment';
    segment.style.width = `${percentage}%`;
    segment.style.backgroundColor = color;
    segment.title = `${cat}: ${catMinutes}m (${percentage}%)`;
    distributionBar.appendChild(segment);

    // Legend item
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';

    const dot = document.createElement('span');
    dot.className = 'legend-dot';
    dot.style.backgroundColor = color;

    const text = document.createElement('span');
    text.textContent = `${cat}: ${catMinutes}m (${percentage}%)`;

    legendItem.appendChild(dot);
    legendItem.appendChild(text);
    categoryLegend.appendChild(legendItem);
  });
}

// --- Rendering Activities ---
function renderActivities() {
  activityList.innerHTML = '';

  const filtered = activities.filter((act) => {
    // Filter condition
    if (currentFilter === 'active' && act.completed) return false;
    if (currentFilter === 'completed' && !act.completed) return false;

    // Search condition
    if (searchQuery && !act.title.toLowerCase().includes(searchQuery)) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');

    filtered.forEach((act) => {
      const li = document.createElement('li');
      li.className = `activity-item ${act.completed ? 'completed' : ''}`;

      // Left container
      const leftDiv = document.createElement('div');
      leftDiv.className = 'activity-left';

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'checkbox-custom';
      checkbox.checked = act.completed;
      checkbox.title = act.completed ? 'Mark pending' : 'Mark complete';
      checkbox.addEventListener('change', () => toggleActivity(act.id));

      // Info
      const infoDiv = document.createElement('div');
      infoDiv.className = 'activity-info';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'activity-title';
      titleSpan.textContent = act.title;

      const metaDiv = document.createElement('div');
      metaDiv.className = 'activity-meta';

      const badge = document.createElement('span');
      badge.className = `badge badge-${act.category}`;
      badge.textContent = act.category;

      const durationSpan = document.createElement('span');
      durationSpan.textContent = `⏱️ ${act.duration} min`;

      metaDiv.appendChild(badge);
      metaDiv.appendChild(durationSpan);

      infoDiv.appendChild(titleSpan);
      infoDiv.appendChild(metaDiv);

      leftDiv.appendChild(checkbox);
      leftDiv.appendChild(infoDiv);

      // Right actions (Focus Timer + Delete)
      const rightDiv = document.createElement('div');
      rightDiv.className = 'activity-right';

      if (!act.completed) {
        const focusBtn = document.createElement('button');
        focusBtn.className = 'focus-btn';
        focusBtn.innerHTML = '⏱️ <span>Focus</span>';
        focusBtn.title = 'Start focus session';
        focusBtn.addEventListener('click', () => openFocusTimer(act.id));
        rightDiv.appendChild(focusBtn);
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Delete activity';
      deleteBtn.addEventListener('click', () => deleteActivity(act.id));
      rightDiv.appendChild(deleteBtn);

      li.appendChild(leftDiv);
      li.appendChild(rightDiv);
      activityList.appendChild(li);
    });
  }
}

function render() {
  updateStats();
  renderActivities();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
