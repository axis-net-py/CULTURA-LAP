import { normalizePhone } from './phone.js';
import { dimensions, QUESTION_COUNT } from '../content/questions.js';

export class AssessmentValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AssessmentValidationError';
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new AssessmentValidationError(code, message);
};

export const maturityBands = {
  RISK: {
    code: 'RISK',
    min: 1.0,
    max: 2.99,
    color: '#C2410C',
    bgColor: '#FFF7ED',
    labels: {
      'pt-BR': { name: 'Cultura em Risco', summary: 'Desalinhamento grave entre discurso e prática, gerando perda de confiança e ruídos na equipe.' },
      'es-PY': { name: 'Cultura en Riesgo', summary: 'Desalineación grave entre discurso y práctica, generando pérdida de confianza y ruidos en el equipo.' }
    }
  },
  BUILDING: {
    code: 'BUILDING',
    min: 3.0,
    max: 3.99,
    color: '#D97706',
    bgColor: '#FEFCE8',
    labels: {
      'pt-BR': { name: 'Cultura em Construção', summary: 'Boas intenções e valores reconhecidos, mas ainda com vulnerabilidades e oscilações na rotina.' },
      'es-PY': { name: 'Cultura en Construcción', summary: 'Buenas intenciones y valores reconocidos, pero todavía con vulnerabilidades y oscilaciones en la rutina.' }
    }
  },
  SOLID: {
    code: 'SOLID',
    min: 4.0,
    max: 5.0,
    color: '#047857',
    bgColor: '#ECFDF5',
    labels: {
      'pt-BR': { name: 'Cultura Sólida', summary: 'Alta performance sustentável, forte coerência da liderança e senso compartilhado de orgulho e pertencimento.' },
      'es-PY': { name: 'Cultura Sólida', summary: 'Alta performance sostenible, fuerte coherencia del liderazgo y sentido compartido de orgullo y pertenencia.' }
    }
  }
};

export function getMaturityBand(index) {
  if (index < 3.0) return maturityBands.RISK;
  if (index < 4.0) return maturityBands.BUILDING;
  return maturityBands.SOLID;
}

export function validateParticipant(raw) {
  if (!raw || typeof raw !== 'object') fail('INVALID_DATA', 'Dados do participante ausentes.');
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name.length < 2 || name.length > 120) {
    fail('INVALID_NAME', 'Informe seu nome completo (entre 2 e 120 caracteres).');
  }

  const company = typeof raw.company === 'string' ? raw.company.trim() : '';
  const country = raw.country === 'PY' ? 'PY' : 'BR';
  const phone = normalizePhone(raw.phone, country);

  if (!raw.consent) {
    fail('CONSENT_REQUIRED', 'É obrigatório aceitar o termo de autorização.');
  }

  return {
    name,
    company: company || (country === 'BR' ? 'Minha Empresa' : 'Mi Empresa'),
    country,
    phone
  };
}

export function validateAnswers(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTION_COUNT) {
    fail('INVALID_ANSWERS', `O teste deve conter exatamente ${QUESTION_COUNT} respostas.`);
  }

  const validated = answers.map((val, idx) => {
    const num = Number(val);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
      fail('INVALID_RATING', `Resposta inválida na pergunta ${idx + 1}. A nota deve ser de 1 a 5.`);
    }
    return num;
  });

  return validated;
}

export function calculateCulturalScore(answers, locale = 'pt-BR') {
  const validated = validateAnswers(answers);
  const totalScore = validated.reduce((acc, v) => acc + v, 0);
  const culturalIndex = Number((totalScore / QUESTION_COUNT).toFixed(2));
  const band = getMaturityBand(culturalIndex);
  const bandInfo = band.labels[locale] || band.labels['pt-BR'];

  // Calculate dimensions
  const dimsConfig = dimensions[locale] || dimensions['pt-BR'];
  const dimensionScores = dimsConfig.map((dim) => {
    const dimValues = dim.questionIds.map((qId) => validated[qId - 1]);
    const dimTotal = dimValues.reduce((a, b) => a + b, 0);
    const dimAvg = Number((dimTotal / dimValues.length).toFixed(2));
    const dimPercent = Math.round((dimTotal / (dimValues.length * 5)) * 100);
    return {
      id: dim.id,
      title: dim.title,
      description: dim.desc,
      score: dimAvg,
      percentage: dimPercent,
      total: dimTotal
    };
  });

  // Calculate top strengths and priority gaps
  const indexedAnswers = validated.map((score, index) => ({ id: index + 1, score }));
  const sortedDesc = [...indexedAnswers].sort((a, b) => b.score - a.score || a.id - b.id);
  const sortedAsc = [...indexedAnswers].sort((a, b) => a.score - b.score || a.id - b.id);

  const topStrengths = sortedDesc.slice(0, 3);
  const priorityGaps = sortedAsc.slice(0, 3);

  return {
    totalScore,
    culturalIndex,
    maturity: {
      code: band.code,
      name: bandInfo.name,
      summary: bandInfo.summary,
      color: band.color,
      bgColor: band.bgColor,
      min: band.min,
      max: band.max
    },
    dimensions: dimensionScores,
    topStrengths,
    priorityGaps
  };
}

export function buildWhatsAppUrl(participant, scoreResult, locale = 'pt-BR') {
  const isEs = locale === 'es-PY';
  const greeting = isEs ? '¡Hola!' : 'Olá!';
  const intro = isEs
    ? `Completé el *Diagnóstico de Cultura Organizacional* del Método LAP:`
    : `Concluí o *Diagnóstico de Cultura Organizacional* do Método LAP:`;
  const partText = isEs ? 'Participante' : 'Participante';
  const compText = isEs ? 'Empresa' : 'Empresa';
  const idxText = isEs ? 'Índice de Adherencia Cultural' : 'Índice de Aderência Cultural';
  const matText = isEs ? 'Nivel de Madurez' : 'Nível de Maturidade';

  const text = `${greeting} ${intro}\n\n` +
    `👤 *${partText}:* ${participant.name}\n` +
    `🏢 *${compText}:* ${participant.company}\n` +
    `📊 *${idxText}:* ${scoreResult.culturalIndex.toFixed(2)} / 5.00 (${scoreResult.totalScore}/100 pts)\n` +
    `🏆 *${matText}:* ${scoreResult.maturity.name}\n\n` +
    `${scoreResult.maturity.summary}`;

  const cleanPhone = participant.phone?.digits || '';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

