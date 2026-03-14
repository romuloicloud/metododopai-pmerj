import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (!window.speechSynthesis) {
            setIsSupported(false);
        }

        // Clean up on unmount
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const play = useCallback((text: string) => {
        if (!isSupported) return;

        // Stop any current speech before starting new one
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.15; // Leitura ágil, não monótona
        utterance.pitch = 0.85; // Mais grave para simular voz masculina ("Pai")

        // Tentar encontrar uma voz masculina agradável
        const voices = window.speechSynthesis.getVoices();
        const ptBrVoices = voices.filter(v => v.lang === 'pt-BR' || v.lang === 'pt_BR');
        if (ptBrVoices.length > 0) {
            const maleVoice = ptBrVoices.find(v =>
                v.name.includes('Antonio') ||
                v.name.includes('Tiago') ||
                v.name.includes('Daniel') ||
                v.name.toLowerCase().includes('masculin') ||
                v.name.toLowerCase().includes('male')
            );
            const googleVoice = ptBrVoices.find(v => v.name.includes('Google'));

            if (maleVoice) {
                utterance.voice = maleVoice;
            } else if (googleVoice) {
                utterance.voice = googleVoice;
            } else {
                // Se não achar, pega a primeira disponível do Brasil
                utterance.voice = ptBrVoices[0];
            }
        }

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = (e) => {
            console.error('TTS Error:', e);
            setIsPlaying(false);
        };

        setCurrentUtterance(utterance);
        window.speechSynthesis.speak(utterance);
    }, [isSupported]);

    const stop = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        setIsPlaying(false);
    }, [isSupported]);

    const pause = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.pause();
        setIsPlaying(false);
    }, [isSupported]);

    const toggle = useCallback((text: string) => {
        if (isPlaying) {
            stop();
        } else {
            play(text);
        }
    }, [isPlaying, play, stop]);

    return { play, stop, pause, toggle, isPlaying, isSupported };
};
