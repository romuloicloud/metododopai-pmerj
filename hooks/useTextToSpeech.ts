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
        utterance.rate = 1.15; // Mais ágil
        utterance.pitch = 0.9; // Mais imponente

        // Tentar encontrar uma voz masculina agradável (ex: Google)
        const voices = window.speechSynthesis.getVoices();
        const ptBrVoices = voices.filter(v => v.lang === 'pt-BR' || v.lang === 'pt_BR');
        if (ptBrVoices.length > 0) {
            // Prioriza voz do Google se existir
            const googleVoice = ptBrVoices.find(v => v.name.includes('Google'));
            if (googleVoice) {
                utterance.voice = googleVoice;
            } else {
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
