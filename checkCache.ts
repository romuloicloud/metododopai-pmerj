import { supabase } from './services/supabaseClient';

async function checkCache() {
    const { data, error } = await supabase
        .from('lessons_cache')
        .select('topic, lesson_data')
        .eq('topic', 'Declaração Universal dos Direitos Humanos');

    console.log('Error:', error);
    console.log('Data:', JSON.stringify(data, null, 2));

    if (data && data.length > 0 && data[0].lesson_data.topic === 'Álgebra (Tópico de Reforço)') {
        console.log("Found corrupted cache! Deleting it...");
        const { error: deleteError } = await supabase
            .from('lessons_cache')
            .delete()
            .eq('topic', 'Declaração Universal dos Direitos Humanos');
        console.log("Delete error:", deleteError);
    }
}
checkCache();
