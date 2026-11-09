import { cultureBlocks, ratingScale, BLOCK_COUNT, QUESTIONS_PER_BLOCK, QUESTION_COUNT } from '/src/content/questions.js';
import { normalizePhone } from '/src/domain/phone.js';

const copy = {
  'pt-BR': {
    eyebrow: 'MÉTODO LAP · GESTÃO E CULTURA',
    introLine: 'Diagnóstico da sua',
    introEm: 'cultura organizacional.',
    introLead: 'Auditoria de 20 indicadores estratégicos para mensurar a coerência, liderança e maturidade cultural da empresa no dia a dia.',
    statements: 'indicadores',
    minutes: 'minutos',
    languages: 'PT · ES',
    nameLabel: 'Nome completo',
    namePlaceholder: 'Como devemos chamar você?',
    companyLabel: 'Empresa',
    companyPlaceholder: 'Nome da sua empresa',
    countryLabel: 'País',
    phoneLabel: 'WhatsApp',
    phonePlaceholder: '(00) 00000-0000',
    consent: 'Autorizo o tratamento destes dados para gerar e armazenar meu diagnóstico cultural. Entendo que esta avaliação mensura práticas organizacionais e maturidade de gestão.',
    start: 'Começar avaliação',
    privacy: 'Seus dados são protegidos e utilizados exclusivamente para este diagnóstico corporativo.',
    answerPrompt: 'AVALIE DE 1 A 5',
    scaleHelp: '1 = Discordo Total · 2 = Discordo · 3 = Parcial · 4 = Concordo · 5 = Concordo Total',
    blockLabel: 'Bloco',
    of: 'de',
    back: 'Anterior',
    next: 'Seguinte',
    finish: 'Ver Diagnóstico',
    blockError: 'Responda a todos os 5 indicadores deste bloco para continuar.',
    resultTitle: 'Índice de Aderência Cultural',
    resultSubtitle: 'Auditoria de coerência e maturidade cultural',
    totalPoints: 'Pontos Totais',
    indexScore: 'Índice Final',
    dimensionsTitle: 'Desempenho por Dimensão Estratégica',
    strengthsTitle: 'Pontos Fortes da Cultura',
    gapsTitle: 'Áreas Críticas de Atenção',
    sendWhatsapp: 'Salvar / Compartilhar no WhatsApp',
    restart: 'Realizar Novo Diagnóstico',
    footer: 'Método LAP · Engenharia Comportamental e Gestão de Alta Performance',
    required: 'Preencha seu nome, WhatsApp e aceite o termo de autorização.'
  },
  'es-PY': {
    eyebrow: 'MÉTODO LAP · GESTIÓN Y CULTURA',
    introLine: 'Diagnóstico de tu',
    introEm: 'cultura organizacional.',
    introLead: 'Auditoría de 20 indicadores estratégicos para medir la coherencia, el liderazgo y la madurez cultural de la empresa en la rutina diaria.',
    statements: 'indicadores',
    minutes: 'minutos',
    languages: 'PT · ES',
    nameLabel: 'Nombre completo',
    namePlaceholder: '¿Cómo debemos llamarte?',
    companyLabel: 'Empresa',
    companyPlaceholder: 'Nombre de tu empresa',
    countryLabel: 'País',
    phoneLabel: 'WhatsApp',
    phonePlaceholder: '0981 000 000',
    consent: 'Autorizo el tratamiento de estos datos para generar y almacenar mi informe de cultura. Entiendo que esta evaluación describe prácticas de gestión y madurez cultural.',
    start: 'Comenzar evaluación',
    privacy: 'Tus datos están protegidos y se utilizan exclusivamente para este diagnóstico corporativo.',
    answerPrompt: 'EVALÚA DE 1 A 5',
    scaleHelp: '1 = Desacuerdo Total · 2 = En Desacuerdo · 3 = Parcialmente · 4 = De Acuerdo · 5 = Acuerdo Total',
    blockLabel: 'Bloque',
    of: 'de',
    back: 'Anterior',
    next: 'Siguiente',
    finish: 'Ver Diagnóstico',
    blockError: 'Responde a los 5 indicadores de este bloque para continuar.',
    resultTitle: 'Índice de Adherencia Cultural',
    resultSubtitle: 'Auditoría de coherencia y madurez cultural',
    totalPoints: 'Puntos Totales',
    indexScore: 'Índice Final',
    dimensionsTitle: 'Rendimiento por Dimensión Estratégica',
    strengthsTitle: 'Fortalezas de la Cultura',
    gapsTitle: 'Áreas Críticas de Atención',
    sendWhatsapp: 'Guardar / Compartir en WhatsApp',
    restart: 'Realizar Nuevo Diagnóstico',
    footer: 'Método LAP · Ingeniería Conductual y Gestión de Alta Performance',
    required: 'Completa tu nombre, WhatsApp y acepta la autorización.'
  }
};

const flags = {
  BR: '<svg viewBox="0 0 32 24" class="flag-svg"><rect width="32" height="24" rx="2" fill="#009739"/><polygon points="16,3.5 29,12 16,20.5 3,12" fill="#fed100"/><circle cx="16" cy="12" r="5" fill="#002776"/><path d="M11.5 13.2 C13.5 11.2 18.5 11.2 20.5 13.2" stroke="#ffffff" stroke-width="1.1" fill="none"/></svg>',
  PY: '<svg viewBox="0 0 32 24" class="flag-svg"><rect width="32" height="24" rx="2" fill="#ffffff"/><rect width="32" height="8" rx="2" fill="#d52b1e"/><rect y="16" width="32" height="8" rx="2" fill="#0038a8"/><circle cx="16" cy="12" r="2.8" fill="#ffffff" stroke="#d52b1e" stroke-width="0.8"/><circle cx="16" cy="12" r="1.2" fill="#fed100"/></svg>'
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

  if ($('#quiz') && $('#quiz').classList.contains('active')) {
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

  blockData.questions.forEach((q, idxInBlock) => {
    const absoluteIndex = state.currentBlock * QUESTIONS_PER_BLOCK + idxInBlock;
    const currentRating = state.answers[absoluteIndex];

    const row = document.createElement('div');
    row.className = 'culture-question-row';
    row.dataset.questionIndex = absoluteIndex;

    row.innerHTML = `
      <div class="culture-question-text">
        <span class="culture-question-num">${q.id}.</span>
        <span>${q.text}</span>
      </div>
      <div class="rating-scale-options" role="radiogroup" aria-label="${q.text}">
        ${scale.map((s) => `
          <label class="rating-pill ${currentRating === s.value ? 'selected' : ''}">
            <input type="radio" name="q-${q.id}" value="${s.value}" ${currentRating === s.value ? 'checked' : ''}>
            <span class="rating-num">${s.value}</span>
            <span class="rating-tag">${s.label}</span>
          </label>
        `).join('')}
      </div>
    `;

    row.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const val = Number(e.target.value);
        state.answers[absoluteIndex] = val;

        row.querySelectorAll('.rating-pill').forEach((pill) => {
          pill.classList.toggle('selected', Number(pill.querySelector('input').value) === val);
        });

        $('#quiz-error').hidden = true;
        updateNavState();
      });
    });

    listContainer.appendChild(row);
  });

  $('#quiz-error').hidden = true;
  updateNavState();
}

function updateNavState() {
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
  $('#score-points').textContent = `${s.totalScore} / 100 pts`;

  const badge = $('#maturity-badge');
  badge.textContent = m.name;
  badge.style.backgroundColor = m.color;
  badge.style.color = '#ffffff';

  $('#maturity-desc').textContent = m.description;

  // Dimensions
  const dimsGrid = $('#dimensions-grid');
  dimsGrid.innerHTML = '';
  s.dimensions.forEach((dim) => {
    const card = document.createElement('div');
    card.className = 'dimension-card';
    card.innerHTML = `
      <div class="dim-header">
        <span class="dim-title">${dim.title}</span>
        <span class="dim-score">${dim.score.toFixed(1)} / 5.0</span>
      </div>
      <p class="dim-desc">${dim.description}</p>
      <div class="dim-bar">
        <span class="dim-bar-fill" style="width: ${dim.percentage}%;"></span>
      </div>
      <div class="dim-footer">
        <span>${dim.percentage}% aderência</span>
        <span>${dim.total} / 25 pts</span>
      </div>
    `;
    dimsGrid.appendChild(card);
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

// BIND ALL LISTENERS IMMEDIATELY
// Country select
const countrySelect = $('#country');
if (countrySelect) {
  countrySelect.addEventListener('change', (e) => {
    state.countryManuallySelected = true;
    updateCountryUI(e.target.value);
  });
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
    const name = ($('#name').value || '').trim();
    const company = ($('#company').value || '').trim();
    const country = $('#country').value || state.country;
    const phoneRaw = ($('#phone').value || '').trim();
    const consent = $('#consent').checked;
    const errorEl = $('#form-error');

    if (name.length < 2 || !phoneRaw || !consent) {
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
    state.participant = { name, company: company || '—', country, phone: phoneRaw, consent: true };
    state.answers = Array(QUESTION_COUNT).fill(null);
    state.currentBlock = 0;
    show('quiz');
    renderQuizBlock();
  });
}

// Quiz navigation
const backBtn = $('#back');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    if (state.currentBlock > 0) {
      state.currentBlock--;
      renderQuizBlock();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

const nextBtn = $('#next');
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
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
}

// Restart button
const restartBtn = $('#restart');
if (restartBtn) {
  restartBtn.addEventListener('click', () => {
    state.answers = Array(QUESTION_COUNT).fill(null);
    state.currentBlock = 0;
    state.participant = null;
    const f = $('#participant-form');
    if (f) f.reset();
    setLanguage(state.locale);
    show('intro');
  });
}

// Initialize default state
setLanguage('pt-BR');
