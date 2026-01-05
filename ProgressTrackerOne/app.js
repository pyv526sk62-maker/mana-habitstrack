// ---- Config ----
const TASKS = [
  { key: 'morningPrayer', label: 'Morning Prayer' },
  { key: 'eveningPrayer', label: 'Evening Prayer' },
  { key: 'cleanRoom', label: 'Cleaning room' },
  { key: 'learnFinance', label: 'Learning: Financial skill' },
  { key: 'learnIT', label: 'Learning: IT / Coding' },
  { key: 'wakeUpOnTime', label: 'Waking up on time' },
  { key: 'sobrietyCheck', label: 'Sobriety commitment' }   // ✅ New task
];

const MOTIVATION_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop', quote: 'Small, consistent actions compound into meaningful change.' },
  { url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop', quote: 'Growth lives just beyond your comfort.' },
  { url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1600&auto=format&fit=crop', quote: 'Choose discipline over mood. Your future self will thank you.' },
  { url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1600&auto=format&fit=crop', quote: 'Peace is a practice. Return to it, daily.' },
];

const AFFIRMATIONS = [
  'Today I show up for myself with calm, clarity, and purpose.',
  'I am building a life that reflects my values, one day at a time.',
  'Consistency is my advantage. I do the small things well.',
  'I honour my body, mind, and spirit with steady routines.',
];

// ---- Storage ----
function getStore() {
  const raw = localStorage.getItem('habitStore');
  return raw ? JSON.parse(raw) : { days: {}, times: {}, installedPWA: false, wakeTime: null };
}

function setStore(data) {
  localStorage.setItem('habitStore', JSON.stringify(data));
}

// ---- Date helpers ----
function fmtDateKey(date = new Date()) {
  return date.toISOString().slice(0,10);
}

// ---- UI Init ----
document.addEventListener('DOMContentLoaded', () => {
  // Rotate affirmation
  document.getElementById('affirmationText').textContent =
    AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];

  // Motivation image rotator
  let motIndex = Math.floor(Math.random() * MOTIVATION_IMAGES.length);
  function updateMotivation() {
    const m = MOTIVATION_IMAGES[motIndex];
    document.getElementById('motivationImage').src = m.url;
    document.getElementById('motivationQuote').textContent = m.quote;
    motIndex = (motIndex + 1) % MOTIVATION_IMAGES.length;
  }
  updateMotivation();
  setInterval(updateMotivation, 1000 * 60 * 30);

  // Load stored times and today’s checks
  const store = getStore();
  TASKS.forEach(t => {
    const checkbox = document.querySelector(`input[type="checkbox"][data-task="${t.key}"]`);
    const timeInput = document.querySelector(`input.task-time[data-task-time="${t.key}"]`);

    if (store.times[t.key]) timeInput.value = store.times[t.key];
    const todayKey = fmtDateKey();
    const day = store.days[todayKey] || {};
    checkbox.checked = !!day[t.key];

    timeInput.addEventListener('change', () => {
      const st = getStore();
      st.times[t.key] = timeInput.value;
      setStore(st);
    });
  });

  document.getElementById('saveTodayBtn').addEventListener('click', saveToday);

  renderCalendar();
  renderStats();
  renderWeeklyReview();
});

// ---- Save today ----
function saveToday() {
  const store = getStore();
  const todayKey = fmtDateKey();
  store.days[todayKey] = store.days[todayKey] || {};
  TASKS.forEach(t => {
    const checkbox = document.querySelector(`input[type="checkbox"][data-task="${t.key}"]`);
    store.days[todayKey][t.key] = checkbox.checked;
  });
  setStore(store);
  renderCalendar();
  renderStats();
  renderWeeklyReview();
}

// ---- Calendar rendering ----
function renderCalendar() {
  const store = getStore();
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth()+1, 0);

  for (let day = 1; day <= end.getDate(); day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const key = date.toISOString().slice(0,10);
    const record = store.days[key] || {};

    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.innerHTML = `<div class="date">${day}</div><div class="dots"></div>`;

    const dotsEl = cell.querySelector('.dots');
    TASKS.forEach(t => {
      const dot = document.createElement('span');
      dot.className = `dot ${record[t.key] ? 'green' : 'red'}`;
      dot.title = t.label;
      dotsEl.appendChild(dot);
    });

    grid.appendChild(cell);
  }
}

// ---- Stats & streaks ----
function renderStats() {
  const store = getStore();
  const daysKeys = Object.keys(store.days).sort();
  let streak = 0;
  let totalCompletion = 0;
  let countDays = 0;
  let wakeCompleted = 0;
  let sobrietyStreak = 0;
  let longestSobrietyStreak = 0;

  daysKeys.forEach(key => {
    const d = store.days[key];
    const completedCount = TASKS.reduce((sum, t) => sum + (d[t.key] ? 1 : 0), 0);
    totalCompletion += completedCount / TASKS.length;
    countDays++;

    if (d.wakeUpOnTime) wakeCompleted++;

    // sobriety streak tracking
    if (d.sobrietyCheck) {
      sobrietyStreak++;
      longestSobrietyStreak = Math.max(longestSobrietyStreak, sobrietyStreak);
    } else {
      sobrietyStreak = 0;
    }
  });

  document.getElementById('streakCount').textContent = `${streak} days`;
  const avg = countDays ? Math.round((totalCompletion / countDays) * 100) : 0;
  document.getElementById('avgCompletion').textContent = `${avg}%`;
  const wakePct = countDays ? Math.round((wakeCompleted / countDays) * 100) : 0;
  document.getElementById('wakeConsistency').textContent = `${wakePct}%`;
  document.getElementById('sobrietyStreak').textContent = `${longestSobrietyStreak} days`; // ✅ new
}

// ---- Weekly review ----
function renderWeeklyReview() {
  const store = getStore();
  const today = new Date();
  const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);

  let completedDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate() + i);
    const key = d.toISOString().slice(0,10);
    const rec = store.days[key] || {};
    const doneCount = TASKS.reduce((sum, t) => sum + (rec[t.key] ? 1 : 0), 0);
    if (doneCount === TASKS.length) completedDays++;
  }

  const encouragement = completedDays >= 4
    ? 'Solid consistency. Keep that rhythm.'
    : 'Progress is building. Aim for one more complete day next week.';
  document.getElementById('weeklySummary').textContent =
    `Complete days in the last 7: ${completedDays}/7. ${encouragement}`;
}