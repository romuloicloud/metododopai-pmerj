const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, 'pmerj_2024_parsed.json');
const rawData = fs.readFileSync(jsonPath, 'utf-8');
const questions = JSON.parse(rawData);

let sqlBlocks = [];

for (const q of questions) {
    const answerMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
    const correctIndex = answerMap[q.correct_answer] !== undefined ? answerMap[q.correct_answer] : 0;

    // Arrays in postgres: ARRAY['a', 'b']

    // Escape single quotes by doubling them
    const escapeStr = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return "'" + str.replace(/'/g, "''") + "'";
    };

    const optionsStr = "ARRAY[" + q.options.map(escapeStr).join(", ") + "]";

    const sql = `INSERT INTO questoes (exam_id, question_number, subject, topic, text, options, correct_option_index) VALUES ('pmerj-2024', ${q.question_number}, ${escapeStr(q.subject)}, 'Geral', ${escapeStr(q.text)}, ${optionsStr}, ${correctIndex});`;

    sqlBlocks.push(sql);
}

fs.writeFileSync(path.resolve(__dirname, 'insert_pmerj.sql'), sqlBlocks.join('\n'));
console.log("SQL gerado com sucesso em insert_pmerj.sql");
