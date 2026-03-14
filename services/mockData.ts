
import { User, Question, TopicProgress, Achievement, RankEntry, TheoryLesson } from '../types';

export const mockUser: User = {
  id: 'user-lucas',
  name: 'Lucas Almeida',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdlNr4IM462fL8Wi28MaIHDbQFPAiauIhSNHV8mc1x75nCHGnN3zPecPWywtbFQtv3xbFUg8IRFtyjkc_qO_YA83-F0rS13UZc3P9ME_DRXKMiraooJ4Z-FsvE5mdi8rjlsmP3_Ck2Z4FlxINUg8V99yzdoKJModUseYHmTNuTJiLSaP1lq48BtqIptj-n0ZNArsxqGV8GzFOQS-sr8HBS63DcwwtPskoQyJRJ9A0eL39FZNSmSFG7JnD5JaKG03WTfZu7b_qRmhs',
  level: 12,
  xp: 2450,
  rank: 14,
  targetSchool: 'PMERJ',
};

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    subject: 'Matemática Básica',
    topic: 'Porcentagem',
    text: 'Um batalhão tem 120 policiais. Se 15% estão de licença, quantos policiais estão na ativa?',
    options: ['100', '102', '105', '110'],
    correctOptionIndex: 1,
  },
  {
    id: 'q2',
    subject: 'Direitos Humanos',
    topic: 'Artigo 5º da CF',
    text: 'Segundo o Art. 5º da CF/88, qual princípio garante que "ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória"?',
    options: ['Presunção de inocência', 'Devido processo legal', 'Ampla defesa', 'Contraditório'],
    correctOptionIndex: 0,
  },
  {
    id: 'q3',
    subject: 'Língua Portuguesa',
    topic: 'Interpretação de Texto',
    text: 'Na frase "O policial militar procedeu à abordagem tática", a ocorrência da crase se justifica por:',
    options: ['Regência do verbo proceder exigindo a preposição "a" e o substantivo feminino "abordagem".', 'Opcionalidade da crase antes de verbos no infinitivo.', 'Exigência do substantivo "policial".', 'Presença de um pronome demonstrativo oculto.'],
    correctOptionIndex: 0,
  },
];

export const mockLesson: TheoryLesson = {
  topic: 'Álgebra (Tópico de Reforço)',
  explanation: "O Método do Pai apresenta: um conceito chave de Álgebra, encontrar o valor desconhecido (o famoso 'x'). Pense em uma balança: o que tem de um lado do sinal de igual (=) deve ser o mesmo que tem do outro. Se você tira algo de um lado, tem que tirar o mesmo do outro para a balança ficar equilibrada. É simples assim!",
  exercises: [
    {
      question: "Se x + 5 = 12, qual o valor de x?",
      options: ["5", "17", "7", "12"],
      correctOptionIndex: 2
    },
    {
      question: "Em 3 * y = 15, qual o valor de y?",
      options: ["5", "12", "18", "45"],
      correctOptionIndex: 0,
      explanation: "O mesmo princípio! Se 3 vezes y dá 15, então y é 15 dividido por 3. Tabuada do 3: 3 x 5 = 15. Logo, y = 5."
    },
    {
      question: "Uma caixa com 20 lápis é dividida igualmente entre 4 amigos. A equação que representa isso é 4 * L = 20. Quantos lápis (L) cada um recebe?",
      options: ["4 lápis", "20 lápis", "16 lápis", "5 lápis"],
      correctOptionIndex: 3,
      explanation: "Para achar x, a gente faz a operação inversa. Se 4 vezes L é 20, então L é 20 dividido por 4. E 20 ÷ 4 = 5. Cada amigo recebe 5 lápis."
    }
  ]
};

export const mockLessonPortugues: TheoryLesson = {
  topic: 'Substantivos (Tópico de Reforço)',
  explanation: "O Método do Pai apresenta o essencial de Português: Substantivos! São as palavras que dão nome a TUDO: pessoas, lugares, objetos, sentimentos... Se você pode ver, pegar ou sentir, provavelmente é um substantivo. 'Casa', 'Lucas', 'alegria', 'caneta', tudo isso são nomes, ou seja, substantivos!",
  exercises: [
    {
      question: "Qual das palavras abaixo é um substantivo que nomeia um sentimento?",
      options: ["Correr", "Bonito", "Felicidade", "Sempre"],
      correctOptionIndex: 2
    },
    {
      question: "Na frase 'O CACHORRO de Lucas é brincalhão', a palavra em maiúsculo é um substantivo:",
      options: ["Próprio", "Comum", "Coletivo", "Abstrato"],
      correctOptionIndex: 1,
      explanation: "'CACHORRO' serve para qualquer cachorro do mundo, não é um nome específico (como Rex ou Totó). Por isso é um substantivo COMUM."
    },
    {
      question: "Qual das alternativas contém apenas substantivos?",
      options: ["Mesa, cadeira, amor", "Rápido, forte, devagar", "Eu, tu, ele", "Comer, beber, dormir"],
      correctOptionIndex: 0,
      explanation: "Mesa (objeto), cadeira (objeto), amor (sentimento). Tudo isso são nomes! Nas outras opções temos adjetivos (Rápido), pronomes (Eu) e verbos (Comer)."
    }
  ]
};


export const mockLessonDireito: TheoryLesson = {
  topic: 'Noções Básicas de Direito (Tópico de Reforço)',
  explanation: "O Método do Pai te guia no Direito: seja na Legislação da PMERJ ou nos Direitos Humanos, o foco da FGV é a letra da lei combinada com casos práticos. Lembre-se sempre de ler o 'caput' do artigo e buscar exceções. Em Direitos Humanos, o princípio basilar é a Dignidade da Pessoa Humana. Na legislação da PMERJ, os pilares são a Hierarquia e Disciplina.",
  exercises: [
    {
      question: "Qual é o princípio fundamental que rege os Direitos Humanos e serve de base para toda a legislação relacionada?",
      options: ["Legalidade estrita", "Dignidade da Pessoa Humana", "Retroatividade da lei", "Presunção de culpa"],
      correctOptionIndex: 1
    },
    {
      question: "No contexto da Polícia Militar, quais são os princípios institucionais basilares previstos no Estatuto?",
      options: ["Hierarquia e Disciplina", "Liberdade e Igualdade", "Honra e Coragem", "Subordinação e Ação"],
      correctOptionIndex: 0,
      explanation: "A hierarquia (ordenação da autoridade em níveis diferentes) e a disciplina (rigoroso acatamento e observância das leis/regulamentos) são a base institucional estrutural da Polícia Militar."
    },
    {
      question: "Segundo a CF/88, 'a lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito'. Trata-se do princípio da:",
      options: ["Inafastabilidade da jurisdição", "Ampla defesa prévia", "Contraditório processual", "Juiz natural e imparcial"],
      correctOptionIndex: 0,
      explanation: "O princípio da inafastabilidade da jurisdição (também chamado de direito de ação ou direito de petição) garante a todo e qualquer cidadão o direito de acionar o Judiciário."
    }
  ]
};

export const mockAchievements: Achievement[] = [
  { id: 'ach1', name: '5 Dias de Fogo', icon: 'local_fire_department', achieved: true },
  { id: 'ach2', name: 'Mestre da Matemática', icon: 'functions', achieved: true },
  { id: 'ach3', name: 'Pensador Veloz', icon: 'bolt', achieved: false },
];

export const mockRanking: RankEntry[] = [
  { rank: 1, name: 'João Victor', xp: 2890, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFS5PanJvZIsQ22X8mgO5lXfH_C9vUlczxXKAIFiR6-8yPc11HTItLCs28_u7v-Pm3I913LSbJ4f-txyNS6nKTJKTWa-I0g5mFSBmjaFzyf6gKfYTG-4W0Pp0wu0tVPrDz7zDRysN4A36NR0SsewjzGNOnSMdHbKnnqi7AwmJlxzWp4KaYpeUfrUfDTGWTVGycSf_3RsdjuiXINXvQAxDom3dFi4PRDOWFcWiO6KI9HU1o42YM8DztL6cC6i38rjsjEQO8SHeuqLc' },
  { rank: 2, name: 'Maria S.', xp: 2450, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6iQQK9smUTRKiQlATjlKxNlSPgv7Kwzd12IKwQ-rnuefMS8otIMvbEJdsnIkDIBZ3MeJmlQEFcunhSRnz7Zi7E7Wac6m-Wd6OzcZHzfeC7udAZttavMmzSM-zZfmMxjdpnUKrI4lb0KEDBEoXgC52rf3-ulh117qfL-sYqN-4HlSwH6Zcunr4sNc5z4dBMcJzECIICabZg7aew6X5yT1D-_EwFzDz3pTDZShwinid12qL2cOllikZzV--SGovFkjlnpQDk2cbHfk' },
  { rank: 3, name: 'Ana Luiza', xp: 2120, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWKTzegeIrgF6744Ek_DPuEFXUg7vlFFdlimXOvieqFTzjXNBF-90VHTtMnW8IeeCKV_H8TcxyiThIFiEzdy0tG4tOJ7WUlddVAuw54UHL0p0HjVWWzp90c6a9o0Rw9dBJyEA5m5OZhwE4qosdXAJH9QdozSNs5X4B2REK8JAgdRcrXJjdJaN3XTx5tYEQwiDfYQoM2uGgAMUyyrGFEEEWlTBVvtWwtIUZUnOLlc9N5Zx7nLk8j4cN2AwZzVWo9TJpN10eACdY4V8' },
  { rank: 4, name: 'Beatriz Costa', xp: 1980, trend: 'up', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYf3a1FGLZRRKVWHHkWT2TanCiP8SU8DEhu8ZS4puDeShJPrVk270FUpsZmW5AfwloB8ILmkXTyAwCj3GloSTmn1thaMPl6uzcMPWBW4AU-eKUZwkO1eCDG_kLfqDiuo-apTolGl9shgm8_jLNfK5hLSWekLh7I1nAFJwtLUnz1SDc6vGrhTM2Li80CgL6McsC8QsolfgUe0m4JxM9iZ1XQ9kUMDhLTblpKvwewqS0lEour2T-frsgprzZwFpaFp6V9t7yK9FIBm8' },
  { rank: 5, name: 'Gabriel Lima', xp: 1850, trend: 'same', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbN2c8t0Ami_KbCfTO7EQqnEFWUxrcEoV7THI6gTw2l1oFNKEiikrKVVIipFQdPfOc8p3Pu3ysnRzzh5pn00q9aSJS5ObQ0TKq8d7Y-B9rkd7kMHGuOfFsfhEKA6ppVW6NIYi1tLMexwYawMIPG_pwA-Gr1G76f6OOKpFcgZRryXyAvyYhdhWwXbaIPRX38bhQlI18eOQd_S_WCgl3j3RtSbmDaqrGYLmFDkPVLPmrmaL665bOKFNtzQM9YNCWDnDlhuCISJtkNDY' },
];