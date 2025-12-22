const http = require('http');
const url = require('url');
const words = require('./names.json');

function charCount(str) {
  const counts = Array(26).fill(0);
  for (const c of str.toUpperCase()) {
    const code = c.charCodeAt(0);
    if (code >= 65 && code <= 90) counts[code - 65]++;
  }
  return counts;
}

function diffCount(count1, count2) {
  let diff = 0;
  for (let i = 0; i < 26; i++) diff += Math.abs(count1[i] - count2[i]);
  return diff;
}

function findFuzzyAnagrams(input, words, maxDiff = 1) {
  const inputCount = charCount(input);
  return words.filter(word => {
    const wordCount = charCount(word);
    return diffCount(inputCount, wordCount) <= maxDiff;
  });
}

function reconstructOriginal(input, match) {
  const inputCount = charCount(input);
  const matchCount = charCount(match);

  let initial = '';
  for (let i = 0; i < 26; i++) {
    const extra = inputCount[i] - matchCount[i];
    if (extra > 0) initial += String.fromCharCode(65 + i).repeat(extra);
  }

  if (initial) return initial.toUpperCase() + '.' + match;
  return match;
}

const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const query = parsedUrl.query;
  const input = query.input;
  const maxDiff = parseInt(query.maxDiff) || 1;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

  let html = `
    <html>
      <head>
        <title>Fuzzy Anagram Solver</title>
      </head>
      <body style="background-color:powderblue;">
        <h1>Fuzzy Anagram Solver</h1>
        <form method="GET">
          <label for="input">Input:</label>
          <input type="text" id="input" name="input" required value="${input || ''}" /><br />
          <label for="maxDiff">Max Diff:</label>
          <input type="number" id="maxDiff" name="maxDiff" value="${maxDiff}" min="0" />
          <button type="submit">Solve</button>
        </form>
  `;

  if (input) {
    const matches = findFuzzyAnagrams(input, words, maxDiff).map(word =>
      reconstructOriginal(input, word)
    );

    html += `<h2>Ergebnisse für "${input}" (maxDiff=${maxDiff}):</h2>`;
    if (matches.length > 0) {
      html += '<ul>';
      for (const m of matches) {
        html += `<li>${m}</li>`;
      }
      html += '</ul>';
    } else {
      html += '<p>Nothing Found</p>';
    }
  }

  html += '</body></html>';
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
