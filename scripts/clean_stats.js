const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xeimqibtnjchbfgsjqsk.supabase.co';
// Note: We need a service_role_key or we can just fetch data and tell the user if RLS blocks delete.
// Let's first fetch all profiles and student_stats.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaW1xaWJ0bmpjaGJmZ3NqcXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNzUyNTksImV4cCI6MjA4Njg1MTI1OX0.63yaHW4qGnDvDrsaAzqxGU875fLYVBTJgZCVJl0D7Pc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanStats() {
    const { data: profiles, error } = await supabase.from('profiles').select('id, full_name');
    if (error) {
        console.error("Erro ao buscar profiles:", error);
        return;
    }

    console.log("Perfis encontrados:", profiles);

    // Exemplo para achar todos menos "Método do Pai" ou o principal "Rômulo"
    // E então tentar APAGAR os registros em student_stats e topic_stats.
    // IMPORTANTE: Devido ao RLS, o anon key pode não conseguir dar DELETE,
    // mas vamos tentar ou gerar o comando SQL correspondente.

    const idsToDelete = profiles.filter(p => !p.full_name?.toLowerCase().includes('romulo') && !p.full_name?.toLowerCase().includes('método do pai')).map(p => p.id);

    console.log("IDs de contas teste a ter as stats apagadas:", idsToDelete);

    for (const uid of idsToDelete) {
        console.log(`Deletando estatísticas do UID: ${uid}`);
        await supabase.from('student_stats').delete().eq('user_id', uid);
        await supabase.from('topic_stats').delete().eq('user_id', uid);
        await supabase.from('pmerj_user_streaks').delete().eq('user_id', uid);
    }
    console.log("Finalizado tentativa de limpeza.");
}

cleanStats();
