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
  const div = document.createElement("div");
  div.className = "question-card" + (q.solved ? " solved" : "");
  div.dataset.id = q.id;

  const tagBadges = (q.tags || [])
    .map(t => `<span class="tag-badge" data-tag="${t}">${t}</span>`)
    .join("");
  const tagsHtml = tagBadges ? `<div class="card-tags">${tagBadges}</div>` : "";
  const notesHtml = q.notes ? `<div class="card-notes">📝 ${q.notes}</div>` : "";
  const checked = selectedIds.has(q.id) ? "checked" : "";

  div.innerHTML = `
    <div class="card-header">
      <input type="checkbox" class="card-checkbox" data-id="${q.id}" ${checked} />
      <span class="card-title">${q.title}</span>
    </div>
    <div class="card-meta">
      ${q.topic}&nbsp;&middot;&nbsp;<span class="diff-label ${q.difficulty}">${q.difficulty}</span>
    </div>
    ${notesHtml}
    ${tagsHtml}
    <div class="card-status">${q.solved ? "✅ Solved" : "❌ Unsolved"}</div>
    <div class="card-actions">
      <button data-action="toggle" data-id="${q.id}">${q.solved ? "Mark Unsolved" : "Mark Solved"}</button>
      <button class="btn-edit" data-action="edit" data-id="${q.id}">Edit</button>
      <button class="btn-delete" data-action="delete" data-id="${q.id}">Delete</button>
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

  document.getElementById("totalCount").textContent    = total;
  document.getElementById("solvedCount").textContent   = solved;
  document.getElementById("progressPercent").textContent = percent + "%";
  progressBar.style.width = percent + "%";

  ["Easy", "Medium", "Hard"].forEach(d => {
    const all = questions.filter(q => q.difficulty === d);
    const s   = all.filter(q => q.solved).length;
    document.getElementById(d.toLowerCase() + "Stats").textContent = `${d}: ${s}/${all.length}`;
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
