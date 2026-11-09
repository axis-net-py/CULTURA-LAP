import { cultureBlocks, ratingScale, BLOCK_COUNT, QUESTIONS_PER_BLOCK, QUESTION_COUNT } from '/src/content/questions.js';
import { normalizePhone } from '/src/domain/phone.js';
import { pt } from '/src/content/pt.js';
import { es } from '/src/content/es.js';

const copy = { 'pt-BR': pt, 'es-PY': es };

const flags = {
  BR: '<svg viewBox="0 0 32 24" class="flag-svg"><rect width="32" height="24" rx="2" fill="#009739"/><polygon points="16,3.5 29,12 16,20.5 3,12" fill="#fed100"/><circle cx="16" cy="12" r="5" fill="#002776"/><path d="M11.5 13.2 C13.5 11.2 18.5 11.2 20.5 13.2" stroke="#ffffff" stroke-width="1.1" fill="none"/></svg>',
  PY: '<svg viewBox="0 0 32 24" class="flag-svg"><rect width="32" height="8" rx="2" fill="#d52b1e"/><rect y="8" width="32" height="8" fill="#ffffff"/><rect y="16" width="32" height="8" rx="2" fill="#0038a8"/><circle cx="16" cy="12" r="3" fill="#ffffff" stroke="#0038a8" stroke-width="0.8"/><circle cx="16" cy="12" r="1.5" fill="#d52b1e"/></svg>'
};

const state = {
  locale: 'pt-BR',
  country: 'BR',
  countryManuallySelected: false,
  currentBlock: 0,
  participant: null,
  answers: Array(QUESTION_COUNT).fill(null),
  isSubmitting: false
};

const $ = (selector) => document.querySelector(selector);

function show(screenId) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const target = $(`#${screenId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateCountryUI(country) {
  state.country = country;
  const flagEl = $('#country-flag-icon');
  if (flagEl && flags[country]) {
    flagEl.innerHTML = flags[country];
  }
  const phoneInput = $('#phone');
  if (phoneInput) {
    phoneInput.placeholder = country === 'BR' ? '(00) 00000-0000' : '0981 000 000';
  }
}

function setLanguage(locale) {
  state.locale = locale;
  if (!state.countryManuallySelected) {
    state.country = locale === 'pt-BR' ? 'BR' : 'PY';
  }
  document.documentElement.lang = locale;

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === locale);
  });

  document.querySelectorAll('[data-copy]').forEach((el) => {
    const key = el.dataset.copy;
    if (copy[locale] && copy[locale][key] !== undefined) {
      el.textContent = copy[locale][key];
    }
  });

  const countrySelect = $('#country');
  if (countrySelect) {
    countrySelect.value = state.country;
    updateCountryUI(state.country);
  }

  if ($('#quiz').classList.contains('active')) {
    renderQuizBlock();
  }
}

function isCurrentBlockComplete() {
  const start = state.currentBlock * QUESTIONS_PER_BLOCK;
  const end = start + QUESTIONS_PER_BLOCK;
  for (let i = start; i < end; i++) {
    if (state.answers[i] === null) return false;
  }
  return true;
}

function renderQuizBlock() {
  const c = copy[state.locale];
  const blockIndex = state.currentBlock;
  const blocks = cultureBlocks[state.locale];
  const blockData = blocks[blockIndex];
  const scale = ratingScale[state.locale];

  const blockNumber = blockIndex + 1;
  const percent = Math.round((blockNumber / BLOCK_COUNT) * 100);

  $('#progress-label').textContent = `${c.blockLabel} ${blockNumber} ${c.of} ${BLOCK_COUNT}`;
  $('#progress-percent').textContent = `${percent}%`;
  $('#progress-bar').style.width = `${percent}%`;

  $('#question-title').textContent = `${c.blockLabel} ${blockNumber}: ${blockData.title}`;

  const listContainer = $('#culture-list');
  listContainer.innerHTML = '';

  blockData.questions.forEach((q) => {
    const qIndex = q.id - 1;
    const currentAnswer = state.answers[qIndex];

    const row = document.createElement('div');
    row.className = `culture-question-row ${currentAnswer !== null ? 'answered' : ''}`;
    row.dataset.questionId = q.id;

    const numBadge = String(q.id).padStart(2, '0');

    let optionsHtml = '';
    scale.forEach((s) => {
      const isChecked = currentAnswer === s.value ? 'checked' : '';
      optionsHtml += `
        <label class="rating-pill">
          <input type="radio" name="q_${q.id}" value="${s.value}" ${isChecked}>
          <span class="rating-num">${s.value}</span>
          <span class="rating-tag">${s.label}</span>
        </label>
      `;
    });

    row.innerHTML = `
      <div class="culture-q-header">
        <span class="culture-q-badge">${numBadge}</span>
        <p class="culture-q-text">${q.text}</p>
      </div>
      <div class="rating-scale-options" role="radiogroup" aria-label="${q.text}">
        ${optionsHtml}
      </div>
    `;

    row.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        state.answers[qIndex] = Number(input.value);
        row.classList.add('answered');
        $('#quiz-error').hidden = true;
        updateQuizButtons();
      });
    });

    listContainer.appendChild(row);
  });

  updateQuizButtons();
}

function updateQuizButtons() {
  const c = copy[state.locale];
  $('#back').disabled = state.currentBlock === 0;

  const isLast = state.currentBlock === BLOCK_COUNT - 1;
  const nextBtn = $('#next');
  nextBtn.querySelector('span').textContent = isLast ? c.finish : c.next;

  const complete = isCurrentBlockComplete();
  nextBtn.disabled = !complete;
}

function renderResult(result) {
  const p = result.participant;
  const m = result.maturity;
  const s = result.scores;

  $('#result-person').textContent = `${p.name} · ${p.company} (${p.phone})`;

  const scoreCircle = $('#score-circle');
  scoreCircle.style.borderColor = m.color;
  scoreCircle.style.backgroundColor = m.bgColor;
  $('#score-num').textContent = s.culturalIndex.toFixed(2);
  $('#score-num').style.color = m.color;

  const badge = $('#maturity-badge');
  badge.textContent = m.name;
  badge.style.backgroundColor = m.color;
  badge.style.color = '#ffffff';

  $('#maturity-desc').textContent = m.summary;

  // Render Dimensions
  const dimsContainer = $('#dimensions-container');
  dimsContainer.innerHTML = '';
  s.dimensions.forEach((dim) => {
    const row = document.createElement('div');
    row.className = 'dimension-row';
    row.innerHTML = `
      <div class="dim-header">
        <span>${dim.title} <small class="dim-desc">— ${dim.description}</small></span>
        <span>${dim.score.toFixed(2)}/5.00 (<b>${dim.percentage}%</b>)</span>
      </div>
      <div class="dim-bar">
        <div class="dim-fill" style="width: ${dim.percentage}%"></div>
      </div>
    `;
    dimsContainer.appendChild(row);
  });

  // Strengths and Gaps
  const blocks = cultureBlocks[state.locale];
  const allQuestions = blocks.flatMap((b) => b.questions);

  const getQText = (id) => {
    const found = allQuestions.find((q) => q.id === id);
    return found ? found.text : `Indicador ${id}`;
  };

  const strengthsList = $('#strengths-list');
  strengthsList.innerHTML = '';
  if (result.topStrengths) {
    result.topStrengths.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.score}/5</strong> — ${getQText(item.id)}`;
      strengthsList.appendChild(li);
    });
  }

  const gapsList = $('#gaps-list');
  gapsList.innerHTML = '';
  if (result.priorityGaps) {
    result.priorityGaps.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.score}/5</strong> — ${getQText(item.id)}`;
      gapsList.appendChild(li);
    });
  }

  const waLink = $('#whatsapp-link');
  if (waLink) {
    waLink.href = result.whatsappUrl;
  }

  show('result');
}

async function submitCurrentAssessment() {
  if (state.isSubmitting) return;
  state.isSubmitting = true;
  const nextBtn = $('#next');
  nextBtn.disabled = true;

  try {
    const payload = {
      participant: state.participant,
      locale: state.locale,
      answers: state.answers
    };

    const response = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao processar diagnóstico.');
    }

    renderResult(data);
  } catch (err) {
    const errBox = $('#quiz-error');
    errBox.textContent = err.message || 'Erro ao enviar respostas.';
    errBox.hidden = false;
    nextBtn.disabled = false;
  } finally {
    state.isSubmitting = false;
  }
}

// SETUP EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  // Country select
  const countrySelect = $('#country');
  if (countrySelect) {
    countrySelect.addEventListener('change', (e) => {
      state.countryManuallySelected = true;
      updateCountryUI(e.target.value);
    });
    updateCountryUI(countrySelect.value || 'BR');
  }

  // Language buttons
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Participant form
  const form = $('#participant-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#name').value.trim();
      const company = $('#company').value.trim();
      const country = $('#country').value;
      const phoneRaw = $('#phone').value.trim();
      const consent = $('#consent').checked;
      const errorEl = $('#form-error');

      if (!name || !phoneRaw || !consent) {
        errorEl.textContent = copy[state.locale].required;
        errorEl.hidden = false;
        return;
      }

      try {
        normalizePhone(phoneRaw, country);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      state.participant = { name, company, country, phone: phoneRaw, consent };
      state.currentBlock = 0;
      show('quiz');
      renderQuizBlock();
    });
  }

  // Quiz navigation
  $('#back').addEventListener('click', () => {
    if (state.currentBlock > 0) {
      state.currentBlock--;
      renderQuizBlock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $('#next').addEventListener('click', () => {
    if (!isCurrentBlockComplete()) {
      $('#quiz-error').textContent = copy[state.locale].blockError;
      $('#quiz-error').hidden = false;
      return;
    }

    if (state.currentBlock < BLOCK_COUNT - 1) {
      state.currentBlock++;
      renderQuizBlock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      submitCurrentAssessment();
    }
  });

  // Restart
  $('#restart').addEventListener('click', () => {
    state.answers = Array(QUESTION_COUNT).fill(null);
    state.currentBlock = 0;
    state.participant = null;
    $('#participant-form').reset();
    updateCountryUI(state.country);
    show('intro');
  });
});
