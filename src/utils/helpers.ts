export function shuffleOptionsWithCorrectIndex(options: string[], correctIndex: number): { shuffledOptions: string[], newCorrectIndex: number } {
    if (!options || options.length === 0) return { shuffledOptions: [], newCorrectIndex: -1 };

    // Create an array of objects to keep track of the original correct option text
    const indexedOptions = options.map((opt, i) => ({ text: opt, isCorrect: i === correctIndex }));

    // Fisher-Yates shuffle
    for (let i = indexedOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
    }

    const shuffledOptions = indexedOptions.map(opt => opt.text);
    const newCorrectIndex = indexedOptions.findIndex(opt => opt.isCorrect);

    return { shuffledOptions, newCorrectIndex };
}
