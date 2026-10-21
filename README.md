# Polyglot — Personal Language Practice Game

A browser-based language practice prototype made with HTML, CSS, and vanilla JavaScript. It runs locally and does not require a paid server, database, or API.

## Features
- Welcome screen with Start button (no login).
- Import question sets from JSON.
- Works with French, Mandarin, or another language by changing the JSON metadata.
- Live per-word highlighting while typing.
- Accent-insensitive comparison (`français` and `francais` compare as equal).
- Wrong-answer shake animation on Enter; correct answers advance to the next question.
- Vocabulary tracker counts unique normalized word forms across all imported answer sets.
- New words today means words first encountered in sets imported on the current local date.
- Local browser storage for imported sets and progress.
- Sample French set with 50 questions.

## How to run
1. Extract the ZIP folder.
2. Open the folder in Visual Studio Code.
3. Recommended: install the **Live Server** extension.
4. Right-click `index.html` → **Open with Live Server**.
5. Click **Start your journey**, then import `questions/french-day-01.json` using **Import questions**.

If you do not want to install Live Server, you can try opening `index.html` directly in your browser. The file import works in modern browsers, but Live Server is recommended for a consistent local development setup.

## Create another question set
Copy the JSON structure from `questions/french-day-01.json`, change `title`, `language`, `languageCode`, `translationDirection`, and add questions. Example:

```json
{
  "title": "Mandarin — Day 01",
  "language": "Mandarin",
  "languageCode": "zh",
  "translationDirection": "English to Mandarin",
  "questions": [
    {
      "prompt": "I am learning Chinese.",
      "answer": "我在学习中文。",
      "alternatives": ["我正在学习中文。"]
    }
  ]
}
```

`alternatives` is optional and lets the game accept other translations you have checked.

## Ask AI to generate question sets
Use a prompt like:

"Create 50 accurate translation practice questions from English to French for my current level. Return ONLY valid JSON with this schema: {title, language, languageCode, translationDirection, questions:[{prompt, answer, alternatives:[]}]}. Use natural, grammatically correct French. Avoid duplicate questions. Keep each answer concise. Include alternatives only when they are genuinely valid. Do not put Markdown fences or commentary around the JSON. The game ignores accent differences when checking answers."

Review the answers before importing, especially because a sentence can have multiple valid translations.

## Vocabulary counting — important limitation
The tracker counts unique word forms appearing in all imported target-language answers, not dictionary headwords and not verified mastery. For example, verb forms such as `vais`, `allons`, and `aller` are counted as separate forms. It also includes articles and short function words. Accent marks are ignored for deduplication. This gives a consistent estimate of unique words encountered, but it may differ from a true vocabulary-learning count.
The current prototype adds newly seen words when a question set is imported. Import each daily set once to avoid duplicate question sets in your library. Word totals themselves are deduplicated.
Progress is saved in your browser's localStorage. Clearing browser data may erase it; use the same browser on the same computer to keep progress.

## Current prototype limitations
- The game accepts exact sentence answers (after ignoring accents, capitalization, and basic punctuation) or listed alternatives.
- Live word colors compare typed words by position. This is visual feedback, not a full grammar evaluator.
- Multiple languages are supported, but input method and writing system depend on your keyboard. Accent-insensitive handling is designed primarily for Latin-script languages. Chinese answers should normally be typed with a Chinese IME/pinyin input method.
- No cloud sync, account system, or AI generation is built into the game. Generate question files separately and import them.
