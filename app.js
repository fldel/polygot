const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "polyglot-minimal-v1";
const state = { sets: [], activeSetId: null, index: 0, answered: false, reveal: false };

function normalize(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/[.!?,;:¿¡]/g, "").replace(/\s+/g, " ").trim();
}
function activeSet() { return state.sets.find(s => s.id === state.activeSetId) || null; }
function currentQuestion() { const set = activeSet(); return set?.questions[state.index] || null; }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sets)); } catch {}
}
function validateSet(raw, filename) {
  if (!raw || !Array.isArray(raw.questions) || !raw.questions.length) throw new Error("The JSON file needs a non-empty questions array.");
  return {
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    title: String(raw.title || filename.replace(/\\.json$/i, "")),
    language: String(raw.language || "Unknown language"),
    questions: raw.questions.map((q, i) => {
      if (!q.prompt || !q.answer) throw new Error(`Question ${i + 1} needs a prompt and answer.`);
      return {prompt:String(q.prompt), answer:String(q.answer), alternatives:Array.isArray(q.alternatives) ? q.alternatives.map(String) : []};
    })
  };
}
function render() {
  const set = activeSet(), q = currentQuestion();
  const input = $("answerInput");
  $("feedback").className = "feedback";
  $("feedback").textContent = "";
  input.classList.remove("is-correct", "is-incorrect", "shake");
  $("answerColorPreview").innerHTML = "";
  $("practiceCard")?.classList.remove("glow-success");
  $("answerReveal").classList.add("hidden");
  $("answerReveal").textContent = "";
  $("showAnswerBtn").textContent = "Show answer";
  state.reveal = false;
  if (!set) {
    $("questionCounter").textContent = "0 / 0";
    $("promptText").textContent = "No questions found.";
    input.value = ""; input.disabled = true; $("checkBtn").disabled = true; $("showAnswerBtn").disabled = true;
    return;
  }
  if (!q) {
    $("questionCounter").textContent = `${set.questions.length} / ${set.questions.length}`;
    $("promptText").textContent = "All done.";
    input.value = ""; input.disabled = true; $("checkBtn").disabled = true; $("showAnswerBtn").disabled = true;
    $("feedback").textContent = "You’ve finished this set.";
    return;
  }
  $("questionCounter").textContent = `${state.index + 1} / ${set.questions.length}`;
  $("promptText").textContent = q.prompt;
  input.disabled = false; input.value = ""; input.placeholder = "Type your answer…";
  $("checkBtn").disabled = false; $("showAnswerBtn").disabled = false;
  input.focus();
}
function start() {
  $("welcome").classList.add("hidden");
  $("app").classList.remove("hidden");
  if (!state.sets.length) {
    fetch("questions/french-day-01.json")
      .then(r => { if (!r.ok) throw new Error("Sample set unavailable"); return r.json(); })
      .then(raw => {
        if (!state.sets.length) {
          const set = validateSet(raw, "french-day-01.json");
          state.sets.push(set); state.activeSetId = set.id; save(); render();
        }
      })
      .catch(() => {
        $("promptText").textContent = "Import a question set to begin.";
        $("questionCounter").textContent = "0 / 0";
        $("answerInput").disabled = true; $("checkBtn").disabled = true; $("showAnswerBtn").disabled = true;
      });
  } else render();
}
function updateLiveFeedback() {
  const input = $("answerInput");
  const preview = $("answerColorPreview");
  const q = currentQuestion();
  if (!q || input.disabled) return;

  const typedText = input.value;
  const typedWords = typedText.match(/\S+/g) || [];
  const answers = [q.answer, ...(q.alternatives || [])].map(answer => normalize(answer).split(" "));
  const bestAnswer = answers.find(words => {
    return typedWords.every((word, i) => {
      const typed = normalize(word);
      const expected = words[i] || "";
      return expected.startsWith(typed);
    });
  }) || answers[0];

  // Color each word independently. Matching words stay green even if a later
  // word is wrong; capitalization and accents are ignored.
  const tokens = typedText.match(/\s+|\S+/g) || [];
  let wordIndex = 0;
  preview.innerHTML = tokens.map(token => {
    if (/^\s+$/.test(token)) return token.replace(/ /g, "&nbsp;").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
    const typed = normalize(token);
    const expected = bestAnswer[wordIndex] || "";
    const correct = expected.startsWith(typed);
    wordIndex++;
    const safe = token.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<span class="word-${correct ? "correct" : "incorrect"}">${safe}</span>`;
  }).join("");

  input.classList.remove("is-correct", "is-incorrect");
  if (typedText.trim()) {
    const allWordsMatch = typedWords.every((word, i) => {
      const typed = normalize(word);
      return (bestAnswer[i] || "").startsWith(typed);
    });
    input.classList.add(allWordsMatch ? "is-correct" : "is-incorrect");
  }
  preview.scrollLeft = input.scrollLeft;
}

function checkAnswer(event) {
  event.preventDefault();

  const set = activeSet();
  const q = currentQuestion();
  const input = $("answerInput");

  if (!set || !q || input.disabled) return;

  const typed = normalize(input.value);

  const accepted = typed.length > 0 &&
    [q.answer, ...(q.alternatives || [])].some(
      answer => normalize(answer) === typed
    );

  input.classList.remove("is-correct", "is-incorrect", "shake");

  // Jangan kosongkan answerColorPreview di sini!

  if (accepted) {
    input.classList.add("is-correct");
    $("practiceCard").classList.add("glow-success");
    $("checkBtn").disabled = true;

    window.setTimeout(() => {
      state.index++;
      render();

      if (state.index >= set.questions.length) {
        $("feedback").textContent = "You’ve finished this set.";
      }
    }, 650);

  } else {
    updateLiveFeedback();

    input.classList.add("is-incorrect", "shake");
    $("answerColorPreview").classList.add("shake");

    window.setTimeout(() => {
      input.classList.remove("shake");
      $("answerColorPreview").classList.remove("shake");
    }, 460);
  }
}

function toggleAnswer() {
  const q = currentQuestion();
  if (!q) return;
  state.reveal = !state.reveal;
  $("answerReveal").textContent = state.reveal ? q.answer : "";
  $("answerReveal").classList.toggle("hidden", !state.reveal);
  $("showAnswerBtn").textContent = state.reveal ? "Hide answer" : "Show answer";
}
async function importFiles(fileList) {
  let imported = [];
  for (const file of [...fileList]) {
    try { imported.push(validateSet(JSON.parse(await file.text()), file.name)); }
    catch (error) { alert(`Could not import ${file.name}: ${error.message}`); }
  }
  if (imported.length) {
    state.sets.push(...imported);
    state.activeSetId = imported[imported.length - 1].id;
    state.index = 0; save(); render();
  }
}
$("startBtn").addEventListener("click", start);
$("answerForm").addEventListener("submit", checkAnswer);
$("answerInput").addEventListener("input", updateLiveFeedback);
$("answerInput").addEventListener("scroll", () => { $("answerColorPreview").scrollLeft = $("answerInput").scrollLeft; });
$("showAnswerBtn").addEventListener("click", toggleAnswer);
$("fileInput").addEventListener("change", async event => {
  if (event.target.files.length) await importFiles(event.target.files);
  event.target.value = "";
});
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (Array.isArray(stored)) state.sets = stored;
} catch {}
if (state.sets.length) state.activeSetId = state.sets[state.sets.length - 1].id;
