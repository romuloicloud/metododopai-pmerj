const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const { data: users, error } = await supabase.from('perfis').select('id, name, email');
    if (error) {
        console.error("Erro ao buscar usuários:", error);
        return;
    }
    console.log("Usuários no DB:");
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [ID: ${u.id}]`));

    const { data: stats, error: statsErr } = await supabase.from('estatisticas').select('user_id, total_questions, score');
    console.log("\nEstatísticas registradas:");
    stats?.forEach(s => console.log(`- User ID: ${s.user_id} - Questions: ${s.total_questions} - XP: ${s.score}`));

    const { data: topicStats } = await supabase.from('topic_stats').select('user_id, topic, score');
    console.log("\nTopic Stats registradas:");
    topicStats?.forEach(s => console.log(`- User ID: ${s.user_id} - Topic: ${s.topic} - Score: ${s.score}`));
}

checkUsers();
