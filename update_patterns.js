const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'grammar-patterns.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Map simple categories to structured hubs (based loosely on Tofugu concepts)
const hubMapping = {
    'Basic Sentence': 'Building Sentences and Clauses',
    'Particle': 'Particles',
    'Existence': 'Verbs',
    'Desire': 'Verb Conjugation',
    'Listing': 'Building Sentences and Clauses',
    'Permission': 'Verb Conjugation',
    'Prohibition': 'Verb Conjugation',
    'Suggestion/Hope': 'Building Sentences and Clauses',
    'Change': 'Verbs',
    'Reason': 'Conjunctive Particles',
    'Conjecture': 'Building Sentences and Clauses',
    'State': 'Verb Conjugation',
    'Comparison': 'Building Sentences and Clauses',
    'Emotion': 'Verbs',
    'Conjunction': 'Conjunctive Particles',
    'Obligation': 'Verb Conjugation'
};

const updatedData = data.map(pattern => {
    // Add hub
    pattern.hub = hubMapping[pattern.category] || 'Other';

    // Add detailedExplanation to a couple of examples for proof of concept
    if (pattern.id === 'g-a1-01') {
        pattern.detailedExplanation = `This is the most basic sentence structure in Japanese. **は (wa)** marks the topic of the sentence, and **です (desu)** is the polite copula (meaning "is/am/are").\n\n> [!NOTE]\n> Even though it is written with the hiragana character **は (ha)**, when used as a topic marker, it is pronounced as **わ (wa)**.\n\nStructure: \`[Topic] は [Noun/Adjective] です。\``;
    }

    if (pattern.id === 'g-a2-01') { // ~たい
        pattern.detailedExplanation = `Adding **〜たい (tai)** to the stem of a verb expresses the speaker's desire to do that action ("I want to...").\n\n> [!IMPORTANT]\n> You can only use **〜たい** to express *your own* desires (or asking someone directly if they want to do something). You cannot use it to say "He wants to..." without modifications like **〜たがる**.\n\nTo conjugate, remove the **ます (masu)** from the polite form and add **たい (tai)**. For example, **食べます** (tabemasu) -> **食べたい** (tabetai).`;
    }

    return pattern;
});

fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
console.log('Updated grammar-patterns.json');
