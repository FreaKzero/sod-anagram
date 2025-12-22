(async function () {
  const loadnames = async () => {
    const x = await fetch("./static/names.json");
    const words = await x.json();
    return words;
  }

  window.WORDS = await loadnames();

  const $ = (sel) => {
    const x = document.querySelectorAll(sel);
    return x.length === 0 ? null : x.length === 1 ? x[0] : x;
  };

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

    function findFuzzyAnagrams(input, words, maxDiff = 2) {
      const inputCount = charCount(input);
      return words.filter((word) => {
        const wordCount = charCount(word);
        return diffCount(inputCount, wordCount) <= maxDiff;
      });
    }

    function reconstructOriginal(input, match) {
      const inputCount = charCount(input);
      const matchCount = charCount(match);

      let initial = "";
      for (let i = 0; i < 26; i++) {
        const extra = inputCount[i] - matchCount[i];
        if (extra > 0) initial += String.fromCharCode(65 + i).repeat(extra);
      }

      if (initial) return initial.toUpperCase() + "." + match;
      return match;
    }
  
  const doSolve = () => {
    const input = $("#input").value;
    
    if (input) {
      const m = findFuzzyAnagrams(input, window.WORDS, 1).map((word) =>
        reconstructOriginal(input, word)
      );

      const matches = [...new Set(m.filter(a => a.includes('.')))];

      if (matches) {
        const output = `<ul id="list">${matches.map(item => `<li>${item}</li>`).join('\n')}</ul>`;
        $('#output').innerHTML = output;
      }
    }
  }

  $('#input').addEventListener('keyup', (ev) => {
    if ($('#input').value.length > 0) {
      $('#solve').style.display = 'inline-block';
    } else {
      $('#output').innerHTML = '';
      $('#solve').style.display = 'none';
    }

      if (ev.key === 'Enter') {
        doSolve();
      } 
  });

  $("#solve").addEventListener("click", async () => {
    doSolve();
  });
})();
