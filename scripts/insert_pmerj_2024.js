const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
// Utilizando a mesma URL e KEY do projeto atual
const SUPABASE_URL = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function insertExam() {
    try {
        const jsonPath = path.resolve(__dirname, 'pmerj_2024_parsed.json');
        if (!fs.existsSync(jsonPath)) {
            console.error("❌ Erro: Arquivo JSON não encontrado!");
            return;
        }

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const questions = JSON.parse(rawData);

        console.log(`🚀 Iniciando inserção da prova PMERJ 2024 (${questions.length} questões)...`);

        const questionsToInsert = questions.map(q => {
            // Mapeia de 'A' para 0
            const answerMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
            const correctIndex = answerMap[q.correct_answer] !== undefined ? answerMap[q.correct_answer] : 0;

            return {
                exam_id: 'pmerj-2024',
                question_number: q.question_number,
                subject: q.subject,
                topic: 'Geral', // Tópico genérico por enquanto
                base_text: null,
                text: q.text,
                options: q.options,
                correct_option_index: correctIndex,
                image_url: null
            };
        });

        // Subir em lotes, caso dê erro de timeout
        const { data, error } = await supabase
            .from('questoes')
            .insert(questionsToInsert)
            .select();

        if (error) {
            console.error("❌ Erro na inserção:", JSON.stringify(error, null, 2));
        } else {
            console.log(`✅ Sucesso! ${data.length} questões inseridas na tabela 'questoes' com a tag 'pmerj-2024'.`);
        }

    } catch (err) {
        console.error('❌ Script falhou:', err);
    }
}

insertExam();
