export const QUESTION_COUNT = 20;
export const BLOCK_COUNT = 4;
export const QUESTIONS_PER_BLOCK = 5;

export const ratingScale = {
  'pt-BR': [
    { value: 1, label: 'Discordo Total', desc: 'Nunca ou quase nunca acontece' },
    { value: 2, label: 'Discordo', desc: 'Acontece raramente' },
    { value: 3, label: 'Parcial', desc: 'Neutro ou acontece às vezes' },
    { value: 4, label: 'Concordo', desc: 'Praticado com frequência' },
    { value: 5, label: 'Concordo Total', desc: 'Prática constante e consolidada' }
  ],
  'es-PY': [
    { value: 1, label: 'Desacuerdo Total', desc: 'Nunca o casi nunca ocurre' },
    { value: 2, label: 'En Desacuerdo', desc: 'Ocurre raramente' },
    { value: 3, label: 'Parcialmente', desc: 'Neutro o a veces ocurre' },
    { value: 4, label: 'De Acuerdo', desc: 'Practicado con frecuencia' },
    { value: 5, label: 'Acuerdo Total', desc: 'Práctica constante y consolidada' }
  ]
};

export const dimensions = {
  'pt-BR': [
    { id: 'lideranca', title: 'Identidade & Liderança', questionIds: [1, 2, 3, 4, 5], desc: 'Clareza de valores e coerência exemplar dos líderes.' },
    { id: 'pratica', title: 'Coerência & Feedback', questionIds: [6, 7, 8, 9, 10], desc: 'Alinhamento na rotina diária e desenvolvimento contínuo.' },
    { id: 'seguranca', title: 'Alinhamento & Segurança', questionIds: [11, 12, 13, 14, 15], desc: 'Transparência, colaboração entre setores e maturidade em conflitos.' },
    { id: 'resultados', title: 'Integridade & Resultados', questionIds: [16, 17, 18, 19, 20], desc: 'Respeito aos inegociáveis, ética e orgulho de pertencer.' }
  ],
  'es-PY': [
    { id: 'lideranca', title: 'Identidad y Liderazgo', questionIds: [1, 2, 3, 4, 5], desc: 'Claridad de valores y coherencia ejemplar de los líderes.' },
    { id: 'pratica', title: 'Coherencia y Feedback', questionIds: [6, 7, 8, 9, 10], desc: 'Alineación en la rutina diaria y desarrollo continuo.' },
    { id: 'seguranca', title: 'Alineación y Seguridad', questionIds: [11, 12, 13, 14, 15], desc: 'Transparencia, colaboración entre sectores y madurez en conflictos.' },
    { id: 'resultados', title: 'Integridad y Resultados', questionIds: [16, 17, 18, 19, 20], desc: 'Respeto a los innegociables, ética y orgullo de pertenecer.' }
  ]
};

export const cultureBlocks = {
  'pt-BR': [
    {
      block: 1,
      title: 'Identidade & Liderança',
      questions: [
        { id: 1, text: 'Conheço claramente a missão, visão e os valores da nossa empresa.' },
        { id: 2, text: 'Os valores declarados orientam as decisões reais da liderança.' },
        { id: 3, text: 'A liderança age com coerência e dá o exemplo dos princípios.' },
        { id: 4, text: 'Desvios culturais e atitudes inadequadas são corrigidos a tempo.' },
        { id: 5, text: 'Colaboradores que personificam a cultura são valorizados.' }
      ]
    },
    {
      block: 2,
      title: 'Coerência & Feedback',
      questions: [
        { id: 6, text: 'Existe coerência real entre o que se fala e o que se pratica.' },
        { id: 7, text: 'Posso manifestar opiniões e discordar com segurança e respeito.' },
        { id: 8, text: 'As expectativas de conduta e entrega da equipe são claras.' },
        { id: 9, text: 'O processo de contratação e onboarding apresenta a cultura.' },
        { id: 10, text: 'Feedbacks periódicos consideram atitudes, valores e metas.' }
      ]
    },
    {
      block: 3,
      title: 'Alinhamento & Segurança',
      questions: [
        { id: 11, text: 'Reuniões de alinhamento reforçam princípios e prioridades.' },
        { id: 12, text: 'Os critérios para decisões e mudanças são transparentes.' },
        { id: 13, text: 'Existe colaboração genuína e sinergia entre os diferentes setores.' },
        { id: 14, text: 'Conflitos interpessoais são tratados com maturidade rápida.' },
        { id: 15, text: 'Os líderes assumem total responsabilidade pelos seus erros.' }
      ]
    },
    {
      block: 4,
      title: 'Integridade & Resultados',
      questions: [
        { id: 16, text: 'Metas e resultados financeiros não justificam violar valores.' },
        { id: 17, text: 'Promoções e aumentos levam em conta a postura ética e cultural.' },
        { id: 18, text: 'A comunicação interna é transparente, frequente e sem ruídos.' },
        { id: 19, text: 'Sei com clareza quais comportamentos são inegociáveis na nossa empresa.' },
        { id: 20, text: 'A cultura contribui para resultados sólidos e orgulho de pertencer.' }
      ]
    }
  ],
  'es-PY': [
    {
      block: 1,
      title: 'Identidad y Liderazgo',
      questions: [
        { id: 1, text: 'Conozco claramente la misión, visión y los valores de nuestra empresa.' },
        { id: 2, text: 'Los valores declarados guían las decisiones reales del liderazgo.' },
        { id: 3, text: 'El liderazgo actúa con coherencia y da el ejemplo de los principios.' },
        { id: 4, text: 'Las desviaciones culturales y actitudes inadecuadas se corrigen a tiempo.' },
        { id: 5, text: 'Los colaboradores que personifican la cultura son valorados.' }
      ]
    },
    {
      block: 2,
      title: 'Coherencia y Feedback',
      questions: [
        { id: 6, text: 'Existe coherencia real entre lo que se dice y lo que se practica.' },
        { id: 7, text: 'Puedo manifestar opiniones y disentir con seguridad y respeto.' },
        { id: 8, text: 'Las expectativas de conducta y entrega del equipo son claras.' },
        { id: 9, text: 'El proceso de contratación y onboarding presenta la cultura.' },
        { id: 10, text: 'Los feedbacks periódicos consideran actitudes, valores y metas.' }
      ]
    },
    {
      block: 3,
      title: 'Alineación y Seguridad',
      questions: [
        { id: 11, text: 'Las reuniones de alineación refuerzan principios y prioridades.' },
        { id: 12, text: 'Los criterios para decisiones y cambios son transparentes.' },
        { id: 13, text: 'Existe colaboración genuina y sinergia entre los diferentes sectores.' },
        { id: 14, text: 'Los conflictos interpersonales se resuelven con madurez y rapidez.' },
        { id: 15, text: 'Los líderes asumen total responsabilidad por sus propios errores.' }
      ]
    },
    {
      block: 4,
      title: 'Integridad y Resultados',
      questions: [
        { id: 16, text: 'Las metas y resultados financieros no justifican violar los valores.' },
        { id: 17, text: 'Las promociones y aumentos consideran la postura ética y cultural.' },
        { id: 18, text: 'La comunicación interna es transparente, frecuente y sin ruidos.' },
        { id: 19, text: 'Sé con claridad qué comportamientos son innegociables en nuestra empresa.' },
        { id: 20, text: 'La cultura contribuye a resultados sólidos y al orgullo de pertenecer.' }
      ]
    }
  ]
};
