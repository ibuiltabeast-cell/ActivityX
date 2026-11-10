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

// App State
let activities = loadActivities();
let currentFilter = 'all';
let searchQuery = '';

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

// Stats Elements
const statTotal = document.getElementById('statTotal');
const statCompleted = document.getElementById('statCompleted');
const statTime = document.getElementById('statTime');
const statRate = document.getElementById('statRate');

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
  activities = activities.filter((item) => item.id !== id);
  saveActivities();
  render();
}

// --- Stats Calculation ---
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
}

// --- Rendering ---
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

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.title = 'Delete activity';
      deleteBtn.addEventListener('click', () => deleteActivity(act.id));

      li.appendChild(leftDiv);
      li.appendChild(deleteBtn);
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

