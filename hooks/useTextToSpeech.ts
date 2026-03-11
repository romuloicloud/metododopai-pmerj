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
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

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
