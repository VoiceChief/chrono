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

let currentMode = 'kupigolos';

const sampleText = `Сегодня особенно важно, чтобы голос бренда звучал уверенно, чисто и узнаваемо. Хорошая озвучка помогает удерживать внимание, повышать доверие и усиливать впечатление от ролика.

Если вам нужен диктор для рекламного ролика, презентации, видео на сайт или обучающего курса, важно заранее понимать примерный хронометраж текста. Это помогает корректно выстроить монтаж, подобрать темп подачи и избежать перегрузки сценария лишними словами.

Профессиональная озвучка — это не только красивый тембр, но и точное попадание в задачу проекта.`;

const MODE_CONFIG = {
  kupigolos: {
    label: 'Базовый режим',
    note: 'Логика, близкая к исследованному хрономеру: pages считаются по символам, время — по символам без пробелов.',
    details: [
      'Основной хронометраж ≈ cleanSymbols / 14.1',
      'Быстрый темп ≈ cleanSymbols / 16.4',
      'Медленный темп ≈ cleanSymbols / 11.8',
      'Страницы A4 ≈ symbols / 2000'
    ],
    calc(text) {
      const symbols = text.length;
      const cleanSymbols = text.replace(/\s/g, '').length;
      const words = countWords(text);

      return {
        words,
        symbols,
        cleanSymbols,
        pages: +(symbols / 2000).toFixed(1),
        timing: smartRound(cleanSymbols / 14.1),
        fast: smartRound(cleanSymbols / 16.4),
        slow: smartRound(cleanSymbols / 11.8)
      };
    }
  },
  voicechief: {
    label: 'VoiceChief Smart',
    note: 'Улучшенный режим: учитывает плотность строк, знаки и общий характер текста, а не только делит символы.',
    details: [
      'База по cleanSymbols, но с поправками на структуру текста',
      'Больше коротких строк и восклицаний → темп быстрее',
      'Больше цифр, аббревиатур и длинных предложений → темп медленнее',
      'Страницы A4 всё так же считаются по symbols / 2000'
    ],
    calc(text) {
      const symbols = text.length;
      const cleanSymbols = text.replace(/\s/g, '').length;
      const words = countWords(text);

      const score = calculateSmartScore(text, words);
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
        slow: smartRound(cleanSymbols / cpsSlow)
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

function calculateSmartScore(text, words) {
  const shortLines = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => countWords(line) <= 4).length;

  const exclamations = (text.match(/[!?]/g) || []).length;
  const digits = (text.match(/[0-9]/g) || []).length;
  const abbreviations = (text.match(/[A-ZА-ЯЁ]{2,}/g) || []).length;
  const sentences = text.split(/[.!?]+/).map(x => x.trim()).filter(Boolean);
  const avgSentenceWords = sentences.length
    ? sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length
    : 0;

  let score = 0;

  if (shortLines >= 3) score += 1;
  if (exclamations >= 4) score += 1;
  if ((digits + abbreviations) >= Math.max(4, Math.floor(words * 0.06))) score -= 1;
  if (avgSentenceWords > 18) score -= 1;

  return score;
}

function formatTime(seconds) {
  if (!seconds || seconds < 60) return `${seconds || 0} сек`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs ? `${mins} мин ${secs} сек` : `${mins} мин`;
}

function updateDetails() {
  const mode = MODE_CONFIG[currentMode];
  formulaNote.textContent = mode.note;
  detailsBadge.textContent = mode.label;
  detailsList.innerHTML = mode.details.map(item => `<li>${item}</li>`).join('');
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
  pagesCount.textContent = result.pages.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

modeButtons.forEach(button => {
  button.addEventListener('click', () => {
    modeButtons.forEach(btn => btn.classList.remove('is-active'));
    button.classList.add('is-active');
    currentMode = button.dataset.mode;
    updateDetails();
    render();
  });
});

sourceText.addEventListener('input', render);

clearBtn.addEventListener('click', () => {
  sourceText.value = '';
  sourceText.focus();
  render();
});

sampleBtn.addEventListener('click', () => {
  sourceText.value = sampleText;
  sourceText.focus();
  render();
});

updateDetails();
render();
