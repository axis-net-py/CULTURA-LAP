import { createHash } from 'node:crypto';
import { readConfig } from '../config.js';
import { createAssessmentRepository, getPool } from '../db.js';
import {
  calculateCulturalScore,
  validateAnswers,
  validateParticipant,
  buildWhatsAppUrl,
  AssessmentValidationError
} from '../domain/assessment.js';
import { PhoneValidationError } from '../domain/phone.js';
import { SubmissionError } from '../http.js';

function computeIdempotencyKey(participant, answers) {
  const payload = JSON.stringify({
    phone: participant.phone.digits,
    answers
  });
  return createHash('sha256').update(payload).digest('hex');
}

export function createAssessmentService({ repository } = {}) {
  return {
    async submit(rawPayload) {
      if (!rawPayload || typeof rawPayload !== 'object') {
        throw new SubmissionError(400, 'INVALID_PAYLOAD', 'Dados inválidos.');
      }

      let participant;
      try {
        participant = validateParticipant(rawPayload.participant);
      } catch (err) {
        if (err instanceof AssessmentValidationError || err instanceof PhoneValidationError) {
          throw new SubmissionError(400, err.code, err.message);
        }
        throw err;
      }

      let validatedAnswers;
      try {
        validatedAnswers = validateAnswers(rawPayload.answers);
      } catch (err) {
        if (err instanceof AssessmentValidationError) {
          throw new SubmissionError(400, err.code, err.message);
        }
        throw err;
      }

      const locale = rawPayload.locale === 'es-PY' ? 'es-PY' : 'pt-BR';
      const scoreResult = calculateCulturalScore(validatedAnswers, locale);
      const whatsappUrl = buildWhatsAppUrl(participant, scoreResult, locale);
      const idempotencyKey = computeIdempotencyKey(participant, validatedAnswers);

      const record = {
        idempotencyKey,
        participant: {
          name: participant.name,
          company: participant.company,
          phone: participant.phone.e164,
          country: participant.country
        },
        locale,
        consentAt: new Date().toISOString(),
        answers: validatedAnswers,
        totalScore: scoreResult.totalScore,
        culturalIndex: scoreResult.culturalIndex,
        maturity: scoreResult.maturity,
        dimensions: scoreResult.dimensions,
        whatsappUrl
      };

      const repo = repository || createAssessmentRepository(getPool(readConfig(process.env).databaseUrl));
      const existing = await repo.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        return {
          id: existing.id,
          participant: existing.participant,
          scores: {
            totalScore: existing.totalScore,
            culturalIndex: existing.culturalIndex,
            dimensions: existing.dimensions
          },
          maturity: existing.maturity,
          whatsappUrl: existing.whatsappUrl
        };
      }

      const saved = await repo.insert(record);
      return {
        id: saved.id,
        participant: saved.participant,
        scores: {
          totalScore: saved.totalScore,
          culturalIndex: saved.culturalIndex,
          dimensions: saved.dimensions
        },
        maturity: saved.maturity,
        whatsappUrl: saved.whatsappUrl
      };
    }
  };
}

