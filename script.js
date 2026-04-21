const sourceText = document.getElementById('sourceText');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const modeButtons = [...document.querySelectorAll('.mode-chip')];

const timingMain = document.getElementById('timingMain');
const timingFast = document.getElementById('timingFast');
const timingSlow = document.getElementById('timingSlow');
const wordsCount = document.getElementById('wordsCount');
const symbolsCount = document.getElementById('symbolsCount');
const cleanSymbolsCount = document.getElementById('cleanSymbolsCount');
const pagesCount = document.getElementById('pagesCount');
const formulaNote = document.getElementById('formulaNote');
const detailsBadge = document.getElementById('detailsBadge');
const detailsList = document.getElementById('detailsList');
const detailsSubnote = document.getElementById('detailsSubnote');

let currentMode = 'kupigolos';

const sampleText = `Сегодня особенно важно, чтобы голос бренда звучал уверенно, чисто и узнаваемо.

Если вам нужен диктор для рекламного ролика, презентации или обучающего курса, важно заранее понимать примерный хронометраж текста.

А 123 версии текста и 2025 правок лучше заранее сократить.`;

const MODE_CONFIG = {
  kupigolos: {
    label: 'Базовый режим',
    note: 'Логика, близкая к исследованному хрономеру: страницы считаются по символам, время — по символам без пробелов.',
    details: [
      'Основной хронометраж ≈ cleanSymbols / 14.1',
      'Быстрый темп ≈ cleanSymbols / 16.4',
      'Медленный темп ≈ cleanSymbols / 11.8',
      'Страницы A4 ≈ symbols / 2000',
      'Цифры для расчёта автоматически учитываются как слова'
    ],
    calc(text) {
      const prepared = prepareTextForTiming(text);
      const symbols = text.length;
      const cleanSymbols = prepared.replace(/\s/g, '').length;
      const words = countWords(text);

      return {
        words,
        symbols,
        cleanSymbols,
        pages: +(symbols / 2000).toFixed(1),
        timing: smartRound(cleanSymbols / 14.1),
        fast: smartRound(cleanSymbols / 16.4),
        slow: smartRound(cleanSymbols / 11.8),
        preparedPreview: buildPreparedPreview(text, prepared)
      };
    }
  },
  voicechief: {
    label: 'VoiceChief Smart',
    note: 'Улучшенный режим: учитывает плотность строк, знаки и общий характер текста, а не только делит символы.',
    details: [
      'База по cleanSymbols, но с поправками на структуру текста',
      'Больше коротких строк и восклицаний → темп быстрее',
      'Больше длинных предложений → темп медленнее',
      'Страницы A4 всё так же считаются по symbols / 2000',
      'Цифры для расчёта автоматически учитываются как слова'
    ],
    calc(text) {
      const prepared = prepareTextForTiming(text);
      const symbols = text.length;
      const cleanSymbols = prepared.replace(/\s/g, '').length;
      const words = countWords(text);

      const score = calculateSmartScore(prepared, words);
      let cpsMain = 14.2;
      let cpsFast = 16.6;
      let cpsSlow = 11.9;

      if (score >= 2) {
        cpsMain = 16.8;
        cpsFast = 19.5;
        cpsSlow = 13.8;
      } else if (score >= 1) {
        cpsMain = 15.5;
        cpsFast = 18.0;
        cpsSlow = 12.8;
      } else if (score < -0.5) {
        cpsMain = 13.1;
        cpsFast = 15.0;
        cpsSlow = 10.8;
      }

      return {
        words,
        symbols,
        cleanSymbols,
        pages: +(symbols / 2000).toFixed(1),
        timing: smartRound(cleanSymbols / cpsMain),
        fast: smartRound(cleanSymbols / cpsFast),
        slow: smartRound(cleanSymbols / cpsSlow),
        preparedPreview: buildPreparedPreview(text, prepared)
      };
    }
  }
};

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function smartRound(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(1, Math.round(value));
}

function formatTime(seconds) {
  if (!seconds || seconds < 60) return `${seconds || 0} сек`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs ? `${mins} мин ${secs} сек` : `${mins} мин`;
}

function calculateSmartScore(text, words) {
  const shortLines = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => countWords(line) <= 4).length;

  const exclamations = (text.match(/[!?]/g) || []).length;
  const abbreviations = (text.match(/[A-ZА-ЯЁ]{2,}/g) || []).length;
  const sentences = text.split(/[.!?]+/).map(x => x.trim()).filter(Boolean);
  const avgSentenceWords = sentences.length
    ? sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length
    : 0;

  let score = 0;

  if (shortLines >= 3) score += 1;
  if (exclamations >= 4) score += 1;
  if (abbreviations >= Math.max(4, Math.floor(words * 0.06))) score -= 1;
  if (avgSentenceWords > 18) score -= 1;

  return score;
}

function buildPreparedPreview(original, prepared) {
  if (original === prepared) return 'Цифры в этом тексте не влияют на расчёт.';
  return `Для расчёта цифры развёрнуты в словесную форму. Пример: ${prepared.slice(0, 120)}${prepared.length > 120 ? '…' : ''}`;
}

function prepareTextForTiming(text) {
  let prepared = text;

  prepared = prepared.replace(/№\s*(\d+)/g, (_, num) => `номер ${numberToRussianWords(num)}`);
  prepared = prepared.replace(/\b\d[\d ]*\b/g, match => {
    const digits = match.replace(/\s+/g, '');
    if (!/^\d+$/.test(digits)) return match;
    return numberToRussianWords(digits);
  });

  return prepared;
}

function numberToRussianWords(input) {
  const raw = String(input).replace(/\s+/g, '');
  if (!/^\d+$/.test(raw)) return input;

  const normalized = raw.replace(/^0+(?=\d)/, '') || '0';
  if (normalized === '0') return 'ноль';

  const groups = [];
  for (let i = normalized.length; i > 0; i -= 3) {
    groups.unshift(normalized.slice(Math.max(0, i - 3), i));
  }

  const scales = [
    { one: '', two: '', five: '', gender: 'm' },
    { one: 'тысяча', two: 'тысячи', five: 'тысяч', gender: 'f' },
    { one: 'миллион', two: 'миллиона', five: 'миллионов', gender: 'm' },
    { one: 'миллиард', two: 'миллиарда', five: 'миллиардов', gender: 'm' },
    { one: 'триллион', two: 'триллиона', five: 'триллионов', gender: 'm' }
  ];

  if (groups.length > scales.length) return raw;

  const words = [];
  groups.forEach((group, index) => {
    const n = parseInt(group, 10);
    if (!n) return;

    const scaleIndex = groups.length - 1 - index;
    const gender = scales[scaleIndex].gender;
    const triadWords = triadToWords(n, gender);
    if (triadWords.length) words.push(...triadWords);

    if (scaleIndex > 0) {
      words.push(getPluralForm(n, scales[scaleIndex].one, scales[scaleIndex].two, scales[scaleIndex].five));
    }
  });

  return words.join(' ').replace(/\s+/g, ' ').trim();
}

function triadToWords(n, gender = 'm') {
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  const tens = ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const unitsMale = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const unitsFemale = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];

  const result = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (h) result.push(hundreds[h]);

  const lastTwo = n % 100;
  if (lastTwo >= 10 && lastTwo <= 19) {
    result.push(teens[lastTwo - 10]);
    return result;
  }

  if (t) result.push(tens[t]);
  if (u) result.push((gender === 'f' ? unitsFemale : unitsMale)[u]);

  return result;
}

function getPluralForm(n, one, two, five) {
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return five;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return two;
  return five;
}

function updateDetails(result) {
  const mode = MODE_CONFIG[currentMode];
  if (formulaNote) formulaNote.textContent = mode.note;
  if (detailsBadge) detailsBadge.textContent = mode.label;
  if (detailsList) {
    detailsList.innerHTML = mode.details.map(item => `<li>${item}</li>`).join('');
  }
  if (detailsSubnote) {
    detailsSubnote.textContent = result?.preparedPreview || 'Цифры считаются как словесная форма только внутри расчёта.';
  }
}

function render() {
  const text = sourceText.value;
  const result = MODE_CONFIG[currentMode].calc(text);

  timingMain.textContent = formatTime(result.timing);
  timingFast.textContent = formatTime(result.fast);
  timingSlow.textContent = formatTime(result.slow);

  wordsCount.textContent = result.words.toLocaleString('ru-RU');
  symbolsCount.textContent = result.symbols.toLocaleString('ru-RU');
  cleanSymbolsCount.textContent = result.cleanSymbols.toLocaleString('ru-RU');
  pagesCount.textContent = result.pages.toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  updateDetails(result);
}

modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    modeButtons.forEach(btn => btn.classList.remove('is-active'));
    button.classList.add('is-active');
    currentMode = button.dataset.mode;
    render();
  });
});

sourceText.addEventListener('input', render);

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    sourceText.focus();
    render();
  });
}

if (sampleBtn) {
  sampleBtn.addEventListener('click', () => {
    sourceText.value = sampleText;
    sourceText.focus();
    render();
  });
}

render();const sourceText = document.getElementById('sourceText');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const modeButtons = [...document.querySelectorAll('.mode-chip')];

const timingMain = document.getElementById('timingMain');
const timingFast = document.getElementById('timingFast');
const timingSlow = document.getElementById('timingSlow');
const wordsCount = document.getElementById('wordsCount');
const symbolsCount = document.getElementById('symbolsCount');
const cleanSymbolsCount = document.getElementById('cleanSymbolsCount');
const pagesCount = document.getElementById('pagesCount');
const formulaNote = document.getElementById('formulaNote');
const detailsBadge = document.getElementById('detailsBadge');
const detailsList = document.getElementById('detailsList');
const detailsSubnote = document.getElementById('detailsSubnote');

let currentMode = 'kupigolos';

const sampleText = `Сегодня особенно важно, чтобы голос бренда звучал уверенно, чисто и узнаваемо.

Если вам нужен диктор для рекламного ролика, презентации или обучающего курса, важно заранее понимать примерный хронометраж текста.

А 123 версии текста и 2025 правок лучше заранее сократить.`;

const MODE_CONFIG = {
  kupigolos: {
    label: 'Базовый режим',
    note: 'Логика, близкая к исследованному хрономеру: страницы считаются по символам, время — по символам без пробелов.',
    details: [
      'Основной хронометраж ≈ cleanSymbols / 14.1',
      'Быстрый темп ≈ cleanSymbols / 16.4',
      'Медленный темп ≈ cleanSymbols / 11.8',
      'Страницы A4 ≈ symbols / 2000',
      'Цифры для расчёта автоматически учитываются как слова'
    ],
    calc(text) {
      const prepared = prepareTextForTiming(text);
      const symbols = text.length;
      const cleanSymbols = prepared.replace(/\s/g, '').length;
      const words = countWords(text);

      return {
        words,
        symbols,
        cleanSymbols,
        pages: +(symbols / 2000).toFixed(1),
        timing: smartRound(cleanSymbols / 14.1),
        fast: smartRound(cleanSymbols / 16.4),
        slow: smartRound(cleanSymbols / 11.8),
        preparedPreview: buildPreparedPreview(text, prepared)
      };
    }
  },
  voicechief: {
    label: 'VoiceChief Smart',
    note: 'Улучшенный режим: учитывает плотность строк, знаки и общий характер текста, а не только делит символы.',
    details: [
      'База по cleanSymbols, но с поправками на структуру текста',
      'Больше коротких строк и восклицаний → темп быстрее',
      'Больше длинных предложений → темп медленнее',
      'Страницы A4 всё так же считаются по symbols / 2000',
      'Цифры для расчёта автоматически учитываются как слова'
    ],
    calc(text) {
      const prepared = prepareTextForTiming(text);
      const symbols = text.length;
      const cleanSymbols = prepared.replace(/\s/g, '').length;
      const words = countWords(text);

      const score = calculateSmartScore(prepared, words);
      let cpsMain = 14.2;
      let cpsFast = 16.6;
      let cpsSlow = 11.9;

      if (score >= 2) {
        cpsMain = 16.8;
        cpsFast = 19.5;
        cpsSlow = 13.8;
      } else if (score >= 1) {
        cpsMain = 15.5;
        cpsFast = 18.0;
        cpsSlow = 12.8;
      } else if (score < -0.5) {
        cpsMain = 13.1;
        cpsFast = 15.0;
        cpsSlow = 10.8;
      }

      return {
        words,
        symbols,
        cleanSymbols,
        pages: +(symbols / 2000).toFixed(1),
        timing: smartRound(cleanSymbols / cpsMain),
        fast: smartRound(cleanSymbols / cpsFast),
        slow: smartRound(cleanSymbols / cpsSlow),
        preparedPreview: buildPreparedPreview(text, prepared)
      };
    }
  }
};

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function smartRound(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(1, Math.round(value));
}

function formatTime(seconds) {
  if (!seconds || seconds < 60) return `${seconds || 0} сек`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs ? `${mins} мин ${secs} сек` : `${mins} мин`;
}

function calculateSmartScore(text, words) {
  const shortLines = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => countWords(line) <= 4).length;

  const exclamations = (text.match(/[!?]/g) || []).length;
  const abbreviations = (text.match(/[A-ZА-ЯЁ]{2,}/g) || []).length;
  const sentences = text.split(/[.!?]+/).map(x => x.trim()).filter(Boolean);
  const avgSentenceWords = sentences.length
    ? sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length
    : 0;

  let score = 0;

  if (shortLines >= 3) score += 1;
  if (exclamations >= 4) score += 1;
  if (abbreviations >= Math.max(4, Math.floor(words * 0.06))) score -= 1;
  if (avgSentenceWords > 18) score -= 1;

  return score;
}

function buildPreparedPreview(original, prepared) {
  if (original === prepared) return 'Цифры в этом тексте не влияют на расчёт.';
  return `Для расчёта цифры развёрнуты в словесную форму. Пример: ${prepared.slice(0, 120)}${prepared.length > 120 ? '…' : ''}`;
}

function prepareTextForTiming(text) {
  let prepared = text;

  prepared = prepared.replace(/№\s*(\d+)/g, (_, num) => `номер ${numberToRussianWords(num)}`);
  prepared = prepared.replace(/\b\d[\d ]*\b/g, match => {
    const digits = match.replace(/\s+/g, '');
    if (!/^\d+$/.test(digits)) return match;
    return numberToRussianWords(digits);
  });

  return prepared;
}

function numberToRussianWords(input) {
  const raw = String(input).replace(/\s+/g, '');
  if (!/^\d+$/.test(raw)) return input;

  const normalized = raw.replace(/^0+(?=\d)/, '') || '0';
  if (normalized === '0') return 'ноль';

  const groups = [];
  for (let i = normalized.length; i > 0; i -= 3) {
    groups.unshift(normalized.slice(Math.max(0, i - 3), i));
  }

  const scales = [
    { one: '', two: '', five: '', gender: 'm' },
    { one: 'тысяча', two: 'тысячи', five: 'тысяч', gender: 'f' },
    { one: 'миллион', two: 'миллиона', five: 'миллионов', gender: 'm' },
    { one: 'миллиард', two: 'миллиарда', five: 'миллиардов', gender: 'm' },
    { one: 'триллион', two: 'триллиона', five: 'триллионов', gender: 'm' }
  ];

  if (groups.length > scales.length) return raw;

  const words = [];
  groups.forEach((group, index) => {
    const n = parseInt(group, 10);
    if (!n) return;

    const scaleIndex = groups.length - 1 - index;
    const gender = scales[scaleIndex].gender;
    const triadWords = triadToWords(n, gender);
    if (triadWords.length) words.push(...triadWords);

    if (scaleIndex > 0) {
      words.push(getPluralForm(n, scales[scaleIndex].one, scales[scaleIndex].two, scales[scaleIndex].five));
    }
  });

  return words.join(' ').replace(/\s+/g, ' ').trim();
}

function triadToWords(n, gender = 'm') {
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  const tens = ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const unitsMale = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const unitsFemale = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];

  const result = [];
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (h) result.push(hundreds[h]);

  const lastTwo = n % 100;
  if (lastTwo >= 10 && lastTwo <= 19) {
    result.push(teens[lastTwo - 10]);
    return result;
  }

  if (t) result.push(tens[t]);
  if (u) result.push((gender === 'f' ? unitsFemale : unitsMale)[u]);

  return result;
}

function getPluralForm(n, one, two, five) {
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return five;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return two;
  return five;
}

function updateDetails(result) {
  const mode = MODE_CONFIG[currentMode];
  if (formulaNote) formulaNote.textContent = mode.note;
  if (detailsBadge) detailsBadge.textContent = mode.label;
  if (detailsList) {
    detailsList.innerHTML = mode.details.map(item => `<li>${item}</li>`).join('');
  }
  if (detailsSubnote) {
    detailsSubnote.textContent = result?.preparedPreview || 'Цифры считаются как словесная форма только внутри расчёта.';
  }
}

function render() {
  const text = sourceText.value;
  const result = MODE_CONFIG[currentMode].calc(text);

  timingMain.textContent = formatTime(result.timing);
  timingFast.textContent = formatTime(result.fast);
  timingSlow.textContent = formatTime(result.slow);

  wordsCount.textContent = result.words.toLocaleString('ru-RU');
  symbolsCount.textContent = result.symbols.toLocaleString('ru-RU');
  cleanSymbolsCount.textContent = result.cleanSymbols.toLocaleString('ru-RU');
  pagesCount.textContent = result.pages.toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  updateDetails(result);
}

modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    modeButtons.forEach(btn => btn.classList.remove('is-active'));
    button.classList.add('is-active');
    currentMode = button.dataset.mode;
    render();
  });
});

sourceText.addEventListener('input', render);

if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    sourceText.value = '';
    sourceText.focus();
    render();
  });
}

if (sampleBtn) {
  sampleBtn.addEventListener('click', () => {
    sourceText.value = sampleText;
    sourceText.focus();
    render();
  });
}

render();
