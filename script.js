// Get elements
const titleInput = document.getElementById("title");
const topicInput = document.getElementById("topic");
const difficultyInput = document.getElementById("difficulty");
const notesInput = document.getElementById("notes");
const addBtn = document.getElementById("addBtn");
const questionList = document.getElementById("questionList");

// Question array (temporary, no storage yet)
let questions = [];
let currentFilter = "all";


// Add Question
addBtn.addEventListener("click", function () {
  const title = titleInput.value.trim();
  const topic = topicInput.value.trim();
  const difficulty = difficultyInput.value;
  const notes = notesInput.value.trim();

  if (title === "" || topic === "") {
    alert("Please fill Title and Topic");
    return;
  }

  const question = {
    id: Date.now(),
    title,
    topic,
    difficulty,
    notes,
    solved: false,
  };

  questions.push(question);
  renderQuestions();
updateProgress();
saveToLocalStorage();
clearInputs();

});

// Render Questions
function renderQuestions() {
  questionList.innerHTML = "";

  questions
  .filter((q) => {
    if (currentFilter === "solved") return q.solved;
    if (currentFilter === "unsolved") return !q.solved;
    return true;
  })
  .forEach((q) => {

    const div = document.createElement("div");
    div.style.border = "1px solid #ddd";
div.style.padding = "10px";
div.style.marginBottom = "8px";
div.style.borderRadius = "6px";
div.style.background = q.solved ? "#e6ffe6" : "#fff";
div.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";


    div.innerHTML = `
      <strong>${q.title}</strong> (${q.topic}) - ${q.difficulty}
      <br/>
      Notes: ${q.notes || "None"}
      <br/>
      Status: ${q.solved ? "Solved ✅" : "Unsolved ❌"}
      <br/>
      <div style="margin-top:6px;">
  <button onclick="toggleSolved(${q.id})">
    ${q.solved ? "Mark Unsolved" : "Mark Solved"}
  </button>

  <button onclick="editQuestion(${q.id})" style="background:orange;">
    Edit
  </button>

  <button onclick="deleteQuestion(${q.id})" style="background:red;">
    Delete
  </button>
</div>

    `;

    questionList.appendChild(div);
  });
}


// Clear Inputs
function clearInputs() {
  titleInput.value = "";
  topicInput.value = "";
  notesInput.value = "";
}

// Toggle Solved
function toggleSolved(id) {
  questions = questions.map((q) =>
    q.id === id ? { ...q, solved: !q.solved } : q
  );
renderQuestions();
updateProgress();
saveToLocalStorage();


}

// Delete Question
function deleteQuestion(id) {
  questions = questions.filter((q) => q.id !== id);
  renderQuestions();
updateProgress();
saveToLocalStorage();

}

function updateProgress() {
  const total = questions.length;
  const solved = questions.filter((q) => q.solved).length;
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);

  document.getElementById("totalCount").textContent = total;
  document.getElementById("solvedCount").textContent = solved;
  document.getElementById("progressPercent").textContent = percent + "%";
}

function saveToLocalStorage() {
  localStorage.setItem("dsaQuestions", JSON.stringify(questions));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("dsaQuestions");
  if (data) {
    questions = JSON.parse(data);
    renderQuestions();
    updateProgress();
  }
}

// Run when page loads
loadFromLocalStorage();

function filterQuestions(type) {
  currentFilter = type;
  renderQuestions();
}

function editQuestion(id) {
  const q = questions.find((item) => item.id === id);
  if (!q) return;

  const newTitle = prompt("Edit Title:", q.title);
  if (newTitle === null) return;

  const newTopic = prompt("Edit Topic:", q.topic);
  if (newTopic === null) return;

  const newDifficulty = prompt(
    "Edit Difficulty (Easy/Medium/Hard):",
    q.difficulty
  );
  if (newDifficulty === null) return;

  const newNotes = prompt("Edit Notes:", q.notes);

  q.title = newTitle.trim() || q.title;
  q.topic = newTopic.trim() || q.topic;
  q.difficulty = newDifficulty || q.difficulty;
  q.notes = newNotes || q.notes;

  renderQuestions();
  updateProgress();
  saveToLocalStorage();
}



