// ── DOM References ────────────────────────────────────────────────────────────
const titleInput      = document.getElementById("title");
const topicInput      = document.getElementById("topic");
const difficultyInput = document.getElementById("difficulty");
const tagsInput       = document.getElementById("tags");
const notesInput      = document.getElementById("notes");
const addBtn          = document.getElementById("addBtn");
const questionList    = document.getElementById("questionList");
const titleError      = document.getElementById("titleError");
const topicError      = document.getElementById("topicError");
const themeToggle     = document.getElementById("themeToggle");
const searchInput     = document.getElementById("searchInput");
const sortSelect      = document.getElementById("sortSelect");
const groupToggle     = document.getElementById("groupToggle");
const bulkToggle      = document.getElementById("bulkToggle");
const bulkBar         = document.getElementById("bulkBar");
const selectedCountEl = document.getElementById("selectedCount");
const exportBtn       = document.getElementById("exportBtn");
const importBtn       = document.getElementById("importBtn");
const importFile      = document.getElementById("importFile");
const progressBar     = document.getElementById("progressBar");
const quickAddToggle  = document.getElementById("quickAddToggle");
const quickAddRow     = document.getElementById("quickAddRow");

// Edit Modal
const editModal     = document.getElementById("editModal");
const modalClose    = document.getElementById("modalClose");
const modalSave     = document.getElementById("modalSave");
const editTitleEl   = document.getElementById("editTitle");
const editTopicEl   = document.getElementById("editTopic");
const editDiffEl    = document.getElementById("editDifficulty");
const editTagsEl    = document.getElementById("editTags");
const editNotesEl   = document.getElementById("editNotes");

// Confirm Modal
const confirmModal   = document.getElementById("confirmModal");
const confirmTitleEl = document.getElementById("confirmTitle");
const confirmMsg     = document.getElementById("confirmMessage");
const confirmYes     = document.getElementById("confirmYes");
const confirmNo      = document.getElementById("confirmNo");

// ── State ─────────────────────────────────────────────────────────────────────
let questions         = [];
let currentFilter     = "all";
let currentSearch     = "";
let currentDifficulty = "all";
let currentSort       = "default";
let groupByTopic      = false;
let selectMode        = false;
let selectedIds       = new Set();
let editingId         = null;

// ── Data Helpers ──────────────────────────────────────────────────────────────
function normalizeQuestion(q) {
  return {
    tags: [],
    solvedDate: null,
    createdAt: q.id,
    ...q,
  };
}

function saveToLocalStorage() {
  localStorage.setItem("dsaQuestions", JSON.stringify(questions));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("dsaQuestions");
  if (data) {
    questions = JSON.parse(data).map(normalizeQuestion);
  }

  const theme = localStorage.getItem("dsaTheme");
  if (theme === "dark") {
    document.body.dataset.theme = "dark";
    themeToggle.textContent = "🌙";
  }

  applySearchAndFilter();
  updateStats();
}

// ── Add Question ──────────────────────────────────────────────────────────────
addBtn.addEventListener("click", addQuestion);

function addQuestion() {
  const title      = titleInput.value.trim();
  const topic      = topicInput.value.trim();
  const difficulty = difficultyInput.value;
  const notes      = notesInput.value.trim();
  const tags       = parseTags(tagsInput.value);

  let valid = true;
  if (!title) { showError(titleError, titleInput, "Title is required"); valid = false; }
  else clearError(titleError, titleInput);

  if (!topic) { showError(topicError, topicInput, "Topic is required"); valid = false; }
  else clearError(topicError, topicInput);

  if (!valid) return;

  if (isDuplicate(title, null)) {
    showError(titleError, titleInput, "A question with this title already exists");
    return;
  }

  const now = Date.now();
  questions.push({ id: now, title, topic, difficulty, notes, tags, solved: false, solvedDate: null, createdAt: now });

  applySearchAndFilter();
  updateStats();
  saveToLocalStorage();
  clearInputs();
}

// ── Quick Add ─────────────────────────────────────────────────────────────────
quickAddToggle.addEventListener("click", () => {
  const visible = quickAddRow.classList.contains("visible");
  quickAddRow.classList.toggle("visible", !visible);
  quickAddToggle.textContent = visible ? "Quick Add" : "Hide Quick Add";
});

document.getElementById("qaAdd").addEventListener("click", () => {
  const title      = document.getElementById("qaTitle").value.trim();
  const topic      = document.getElementById("qaTopic").value.trim();
  const difficulty = document.getElementById("qaDifficulty").value;
  if (!title || !topic) return;
  if (isDuplicate(title, null)) { alert("A question with this title already exists"); return; }

  const now = Date.now();
  questions.push({ id: now, title, topic, difficulty, notes: "", tags: [], solved: false, solvedDate: null, createdAt: now });
  document.getElementById("qaTitle").value = "";
  document.getElementById("qaTopic").value = "";
  applySearchAndFilter();
  updateStats();
  saveToLocalStorage();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTags(str) {
  return str.split(",").map(t => t.trim()).filter(Boolean);
}

function isDuplicate(title, excludeId) {
  return questions.some(q => q.title.toLowerCase() === title.toLowerCase() && q.id !== excludeId);
}

function showError(el, input, msg) {
  el.textContent = msg;
  if (input) input.classList.add("invalid");
  setTimeout(() => clearError(el, input), 3000);
}

function clearError(el, input) {
  if (el) el.textContent = "";
  if (input) input.classList.remove("invalid");
}

function clearInputs() {
  titleInput.value      = "";
  topicInput.value      = "";
  tagsInput.value       = "";
  notesInput.value      = "";
  difficultyInput.value = "Easy";
}

// Clear inline validation on input
titleInput.addEventListener("input", () => clearError(titleError, titleInput));
topicInput.addEventListener("input", () => clearError(topicError, topicInput));

// ── Edit Modal ────────────────────────────────────────────────────────────────
function openEditModal(id) {
  const q = questions.find(q => q.id === id);
  if (!q) return;
  editingId         = id;
  editTitleEl.value = q.title;
  editTopicEl.value = q.topic;
  editDiffEl.value  = q.difficulty;
  editTagsEl.value  = (q.tags || []).join(", ");
  editNotesEl.value = q.notes || "";
  editModal.classList.add("active");
  editTitleEl.focus();
}

function closeEditModal() {
  editModal.classList.remove("active");
  editingId = null;
}

modalClose.addEventListener("click", closeEditModal);
editModal.addEventListener("click", e => { if (e.target === editModal) closeEditModal(); });

modalSave.addEventListener("click", () => {
  const title = editTitleEl.value.trim();
  const topic = editTopicEl.value.trim();

  if (!title || !topic) {
    if (!title) showError(document.getElementById("editTitleError"), editTitleEl, "Title is required");
    if (!topic) showError(document.getElementById("editTopicError"), editTopicEl, "Topic is required");
    return;
  }

  if (isDuplicate(title, editingId)) {
    showError(document.getElementById("editTitleError"), editTitleEl, "A question with this title already exists");
    return;
  }

  questions = questions.map(q =>
    q.id === editingId
      ? { ...q, title, topic, difficulty: editDiffEl.value, tags: parseTags(editTagsEl.value), notes: editNotesEl.value.trim() }
      : q
  );

  closeEditModal();
  applySearchAndFilter();
  updateStats();
  saveToLocalStorage();
});

// ── Toggle Solved ─────────────────────────────────────────────────────────────
function toggleSolved(id) {
  questions = questions.map(q => {
    if (q.id !== id) return q;
    const solved = !q.solved;
    return { ...q, solved, solvedDate: solved ? new Date().toISOString() : null };
  });
  applySearchAndFilter();
  updateStats();
  saveToLocalStorage();
}

// ── Delete ────────────────────────────────────────────────────────────────────
function deleteQuestion(id) {
  questions = questions.filter(q => q.id !== id);
  selectedIds.delete(id);
  applySearchAndFilter();
  updateStats();
  saveToLocalStorage();
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderQuestions(list) {
  questionList.innerHTML = "";

  if (list.length === 0) {
    questionList.innerHTML = '<p class="empty-state">No questions found. Add one above!</p>';
    return;
  }

  if (groupByTopic) {
    const groups = {};
    list.forEach(q => {
      if (!groups[q.topic]) groups[q.topic] = [];
      groups[q.topic].push(q);
    });
    Object.keys(groups).sort().forEach(topic => {
      const header = document.createElement("h3");
      header.className = "topic-header";
      header.textContent = `${topic} (${groups[topic].length})`;
      questionList.appendChild(header);
      groups[topic].forEach(q => questionList.appendChild(createCard(q)));
    });
  } else {
    list.forEach(q => questionList.appendChild(createCard(q)));
  }
}

function createCard(q) {
  const div = document.createElement("article");
  let tailwindClasses = "question-card bg-white dark:bg-dsa-card p-4 rounded-2xl flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-dsa-accent transition-all border border-slate-200 dark:border-white/5 relative";
  if (q.solved) tailwindClasses += " solved";
  div.className = tailwindClasses;
  div.dataset.id = q.id;

  const tagBadges = (q.tags || [])
    .map(t => `<span class="tag-badge bg-dsa-blue/10 text-dsa-blue border border-dsa-blue/20 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-pointer hover:bg-dsa-blue/20 transition-colors inline-block" data-tag="${t}">${t}</span>`)
    .join("");
  const tagsHtml = tagBadges ? `<div class="card-tags flex flex-wrap gap-1 mt-1">${tagBadges}</div>` : "";
  const notesHtml = q.notes ? `<div class="card-notes text-xs text-slate-500 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-[#0f172a] p-2 rounded-lg border border-slate-200 dark:border-white/5"><i class="fa-solid fa-pen-to-square mr-1 opacity-50"></i>${q.notes}</div>` : "";
  const checked = selectedIds.has(q.id) ? "checked" : "";
  
  const diffColors = {
    Easy: "bg-dsa-easy/10 text-dsa-easy border-dsa-easy/20",
    Medium: "bg-dsa-medium/10 text-dsa-medium border-dsa-medium/20",
    Hard: "bg-dsa-hard/10 text-dsa-hard border-dsa-hard/20"
  };
  const diffClass = diffColors[q.difficulty] || diffColors.Easy;

  const statusHtml = q.solved 
    ? `<div class="flex items-center gap-1.5 text-dsa-easy text-xs font-bold"><i class="fa-solid fa-check-circle"></i><span class="card-status">Solved</span></div>`
    : `<div class="flex items-center gap-1.5 text-slate-500 text-xs font-bold"><i class="fa-regular fa-clock"></i><span class="card-status">Unsolved</span></div>`;
    
  const dateHtml = q.solvedDate 
    ? `<span class="text-xs text-slate-500 dark:text-slate-600 font-medium">${new Date(q.solvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`
    : "";

  div.innerHTML = `
    <div class="card-header flex justify-between items-start gap-2">
      <div class="flex items-start gap-2">
        <input type="checkbox" class="card-checkbox w-4 h-4 mt-1 accent-dsa-blue" data-id="${q.id}" ${checked} />
        <h3 class="card-title font-bold text-lg leading-tight text-slate-800 dark:text-slate-100">${q.title}</h3>
      </div>
      <span class="diff-label px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${diffClass}">${q.difficulty}</span>
    </div>
    <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">${q.topic}</p>
    ${tagsHtml}
    ${notesHtml}
    <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-white/5">
      ${statusHtml}
      ${dateHtml}
    </div>
    <div class="card-actions flex gap-2 mt-3 w-full">
      <button class="flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 hover:bg-slate-200 dark:hover:bg-black/40 transition-colors text-slate-600 dark:text-slate-300" data-action="toggle" data-id="${q.id}">${q.solved ? "Unsolve" : "Solve"}</button>
      <button class="btn-edit flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border border-dsa-medium/30 bg-dsa-medium/10 text-dsa-medium hover:bg-dsa-medium/20 transition-colors" data-action="edit" data-id="${q.id}">Edit</button>
      <button class="btn-delete flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border border-dsa-hard/30 bg-dsa-hard/10 text-dsa-hard hover:bg-dsa-hard/20 transition-colors" data-action="delete" data-id="${q.id}">Delete</button>
    </div>
  `;

  return div;
}

// ── Event Delegation (card actions, tags, checkboxes) ─────────────────────────
questionList.addEventListener("click", e => {
  const actionBtn = e.target.closest("[data-action]");
  if (actionBtn) {
    const id = Number(actionBtn.dataset.id);
    const action = actionBtn.dataset.action;
    if (action === "toggle") toggleSolved(id);
    else if (action === "edit") openEditModal(id);
    else if (action === "delete") deleteQuestion(id);
    return;
  }

  const tagBadge = e.target.closest(".tag-badge");
  if (tagBadge) {
    const tag = tagBadge.dataset.tag;
    searchInput.value = tag;
    currentSearch = tag.toLowerCase();
    applySearchAndFilter();
    return;
  }

  const checkbox = e.target.closest(".card-checkbox");
  if (checkbox) {
    const id = Number(checkbox.dataset.id);
    if (checkbox.checked) selectedIds.add(id);
    else selectedIds.delete(id);
    updateBulkBar();
  }
});

// ── Status Filter (delegated) ─────────────────────────────────────────────────
document.getElementById("statusFilter").addEventListener("click", e => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  document.querySelectorAll("#statusFilter [data-filter]").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  applySearchAndFilter();
});

// ── Difficulty Filter (delegated) ─────────────────────────────────────────────
document.getElementById("diffFilter").addEventListener("click", e => {
  const btn = e.target.closest("[data-difficulty]");
  if (!btn) return;
  currentDifficulty = btn.dataset.difficulty;
  document.querySelectorAll("#diffFilter [data-difficulty]").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  applySearchAndFilter();
});

// ── Sort ──────────────────────────────────────────────────────────────────────
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  applySearchAndFilter();
});

function sortQuestions(list) {
  const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
  const copy = [...list];
  if (currentSort === "title-asc")  return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (currentSort === "title-desc") return copy.sort((a, b) => b.title.localeCompare(a.title));
  if (currentSort === "diff-asc")   return copy.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
  if (currentSort === "diff-desc")  return copy.sort((a, b) => diffOrder[b.difficulty] - diffOrder[a.difficulty]);
  return copy;
}

// ── Group by Topic ────────────────────────────────────────────────────────────
groupToggle.addEventListener("click", () => {
  groupByTopic = !groupByTopic;
  groupToggle.textContent = groupByTopic ? "Ungroup" : "Group by Topic";
  applySearchAndFilter();
});

// ── Central Render Gate ───────────────────────────────────────────────────────
function applySearchAndFilter() {
  let filtered = questions;

  if (currentSearch) {
    filtered = filtered.filter(q =>
      q.title.toLowerCase().includes(currentSearch) ||
      q.topic.toLowerCase().includes(currentSearch) ||
      (q.tags || []).some(t => t.toLowerCase().includes(currentSearch))
    );
  }

  if (currentFilter === "solved")   filtered = filtered.filter(q => q.solved);
  if (currentFilter === "unsolved") filtered = filtered.filter(q => !q.solved);

  if (currentDifficulty !== "all") {
    filtered = filtered.filter(q => q.difficulty === currentDifficulty);
  }

  renderQuestions(sortQuestions(filtered));
}

// ── Search ────────────────────────────────────────────────────────────────────
searchInput.addEventListener("input", function () {
  currentSearch = this.value.toLowerCase();
  if (!currentSearch) {
    currentFilter = "all";
    document.querySelectorAll("#statusFilter [data-filter]").forEach(b => b.classList.remove("active"));
    document.querySelector("#statusFilter [data-filter='all']").classList.add("active");
  }
  applySearchAndFilter();
});

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const total   = questions.length;
  const solved  = questions.filter(q => q.solved).length;
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);

  document.getElementById("totalCount").textContent      = total;
  document.getElementById("solvedCount").textContent     = solved;
  document.getElementById("progressPercent").textContent = percent + "%";
  progressBar.style.width = percent + "%";

  // Drive the conic-gradient ring via CSS custom property
  const circEl = document.getElementById("circularProgress");
  if (circEl) circEl.style.setProperty("--cp-pct", percent + "%");

  // Update per-difficulty stats text AND progress bar widths
  ["Easy", "Medium", "Hard"].forEach(d => {
    const all = questions.filter(q => q.difficulty === d);
    const s   = all.filter(q => q.solved).length;
    const pct = all.length === 0 ? 0 : Math.round((s / all.length) * 100);
    document.getElementById(d.toLowerCase() + "Stats").textContent = `${d}: ${s}/${all.length}`;
    const barEl = document.getElementById(d.toLowerCase() + "Bar");
    if (barEl) barEl.style.width = pct + "%";
  });

  // Topic leaderboard (top 5 by solved count)
  const topicMap = {};
  questions.forEach(q => {
    if (!topicMap[q.topic]) topicMap[q.topic] = { solved: 0, total: 0 };
    topicMap[q.topic].total++;
    if (q.solved) topicMap[q.topic].solved++;
  });
  const topTopics = Object.entries(topicMap)
    .sort((a, b) => b[1].solved - a[1].solved)
    .slice(0, 5);

  const topicStatsEl = document.getElementById("topicStats");
  topicStatsEl.innerHTML = topTopics.length
    ? topTopics.map(([topic, { solved: s, total: t }]) =>
        `<div class="topic-stat-row"><span>${topic}</span><span>${s}/${t}</span></div>`
      ).join("")
    : "";

  document.getElementById("streakCount").textContent = computeStreak() + " 🔥";

  renderActivityHeatmap();
}

function renderActivityHeatmap() {
  const grid = document.getElementById("activityHeatmapGrid");
  if (!grid) return;

  const CELL = 8, GAP = 4, ROWS = 7, WEEKS = 52;
  const TOTAL_DAYS = WEEKS * ROWS; // 364

  // Explicitly define the grid layout so w-full doesn't squeeze auto-columns to 0
  grid.style.gridTemplateColumns = `repeat(${WEEKS}, ${CELL}px)`;
  grid.style.gridTemplateRows    = `repeat(${ROWS}, ${CELL}px)`;
  grid.style.gridAutoFlow        = "column";
  grid.style.height              = `${ROWS * CELL + (ROWS - 1) * GAP}px`; // 80px

  // Build date → solved-count lookup
  const dateCounts = {};
  questions.filter(q => q.solved && q.solvedDate).forEach(q => {
    const day = q.solvedDate.slice(0, 10);
    dateCounts[day] = (dateCounts[day] || 0) + 1;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDark = document.body.dataset.theme === "dark";
  const emptyColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(148,163,184,0.4)";

  const fragment = document.createDocumentFragment();
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const count = dateCounts[dateStr] || 0;

    let bg;
    if      (count === 0) bg = emptyColor;
    else if (count === 1) bg = "rgba(34,197,94,0.4)";
    else if (count === 2) bg = "rgba(34,197,94,0.7)";
    else                  bg = "#22c55e";

    const cell = document.createElement("div");
    cell.style.cssText = `width:${CELL}px;height:${CELL}px;border-radius:2px;background-color:${bg};`;
    cell.title = `${dateStr}: ${count} solved`;
    fragment.appendChild(cell);
  }

  grid.innerHTML = "";
  grid.appendChild(fragment);
}

// ── Streak ────────────────────────────────────────────────────────────────────
function computeStreak() {
  const dates = new Set(
    questions.filter(q => q.solvedDate).map(q => q.solvedDate.slice(0, 10))
  );
  if (dates.size === 0) return 0;

  let streak = 0;
  const day  = new Date();
  day.setHours(0, 0, 0, 0);

  while (dates.has(day.toISOString().slice(0, 10))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

// ── Dark Mode ─────────────────────────────────────────────────────────────────
themeToggle.addEventListener("click", () => {
  const isDark = document.body.dataset.theme === "dark";
  document.body.dataset.theme = isDark ? "" : "dark";
  themeToggle.textContent = isDark ? "☀" : "🌙";
  localStorage.setItem("dsaTheme", isDark ? "" : "dark");
});

// ── Export / Import ───────────────────────────────────────────────────────────
exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "dsa-progress.json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    let data;
    try { data = JSON.parse(e.target.result); } catch { alert("Invalid JSON file"); return; }
    if (!Array.isArray(data) || !data.every(q => q.title && q.topic)) {
      alert("Invalid data format — each entry must have title and topic");
      return;
    }

    showConfirm(
      "Import Data",
      `Found ${data.length} questions. Replace all existing data, or merge (skip duplicates)?`,
      () => {
        questions = data.map(normalizeQuestion);
        saveToLocalStorage(); applySearchAndFilter(); updateStats();
      },
      () => {
        const existingIds = new Set(questions.map(q => q.id));
        data.forEach(q => { if (!existingIds.has(q.id)) questions.push(normalizeQuestion(q)); });
        saveToLocalStorage(); applySearchAndFilter(); updateStats();
      },
      "Replace All",
      "Merge"
    );
  };
  reader.readAsText(file);
  importFile.value = "";
});

function showConfirm(title, message, onYes, onNo, yesLabel = "Yes", noLabel = "No") {
  confirmTitleEl.textContent = title;
  confirmMsg.textContent     = message;
  confirmYes.textContent     = yesLabel;
  confirmNo.textContent      = noLabel;
  confirmModal.classList.add("active");

  const cleanup = () => confirmModal.classList.remove("active");
  confirmYes.onclick    = () => { cleanup(); onYes(); };
  confirmNo.onclick     = () => { cleanup(); if (onNo) onNo(); };
  confirmModal.onclick  = e => { if (e.target === confirmModal) cleanup(); };
}

// ── Bulk Actions ──────────────────────────────────────────────────────────────
bulkToggle.addEventListener("click", () => {
  selectMode = !selectMode;
  selectedIds.clear();
  bulkToggle.textContent = selectMode ? "Cancel Select" : "Select";
  bulkBar.classList.toggle("visible", selectMode);
  questionList.classList.toggle("select-mode", selectMode);
  updateBulkBar();
  applySearchAndFilter();
});

document.getElementById("bulkSolve").addEventListener("click", () => {
  const ts = new Date().toISOString();
  questions = questions.map(q =>
    selectedIds.has(q.id) ? { ...q, solved: true, solvedDate: ts } : q
  );
  selectedIds.clear();
  saveToLocalStorage(); applySearchAndFilter(); updateStats(); updateBulkBar();
});

document.getElementById("bulkUnsolve").addEventListener("click", () => {
  questions = questions.map(q =>
    selectedIds.has(q.id) ? { ...q, solved: false, solvedDate: null } : q
  );
  selectedIds.clear();
  saveToLocalStorage(); applySearchAndFilter(); updateStats(); updateBulkBar();
});

document.getElementById("bulkDelete").addEventListener("click", () => {
  if (!selectedIds.size) return;
  questions = questions.filter(q => !selectedIds.has(q.id));
  selectedIds.clear();
  saveToLocalStorage(); applySearchAndFilter(); updateStats(); updateBulkBar();
});

document.getElementById("bulkCancel").addEventListener("click", () => {
  selectMode = false;
  selectedIds.clear();
  bulkToggle.textContent = "Select";
  bulkBar.classList.remove("visible");
  questionList.classList.remove("select-mode");
  updateBulkBar();
  applySearchAndFilter();
});

function updateBulkBar() {
  selectedCountEl.textContent = `${selectedIds.size} selected`;
}

// ── Keyboard Shortcuts ────────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

  if (e.key === "Escape") {
    if (editModal.classList.contains("active")) { closeEditModal(); return; }
    if (confirmModal.classList.contains("active")) { confirmModal.classList.remove("active"); return; }
    if (searchInput.value) { searchInput.value = ""; currentSearch = ""; applySearchAndFilter(); return; }
  }

  if (e.key === "/" && !inInput) {
    e.preventDefault();
    searchInput.focus();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && inInput) {
    e.preventDefault();
    addBtn.click();
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadFromLocalStorage();
