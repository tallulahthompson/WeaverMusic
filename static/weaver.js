/* global nn, Tone */

let WORDS = new Set();
let current_path = null;

async function get_sentiment_label(word) {
    try {
        console.log(`Fetching sentiment for: ${word}`);
        const response = await fetch('/sentiment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: word.toLowerCase() })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Sentiment API error:', data.error);
            return 'Neutral';
        }

        const label = data.label;
        console.log(`Sentiment for ${word}: ${label}`);
        return label;
    } catch (error) {
        console.error('Sentiment API error:', error);
        return 'Neutral';
    }
}

function get_query_params() {
    const params = new URLSearchParams(window.location.search);
    return {
        word1: params.get('word1')?.toUpperCase() || ''
    };
}

const synth_configs = [
    {
        name: 'Marimba',
        type: 'Synth',
        config: {
            oscillator: {
                partials: [1, 0, 2, 0, 3]
            },
            envelope: {
                attack: 0.001,
                decay: 1.2,
                sustain: 0,
                release: 1.2
            }
        }
    },
    {
        name: 'Harmonics',
        type: 'AMSynth',
        config: {
            harmonicity: 3.999,
            oscillator: { type: 'square' },
            envelope: {
                attack: 0.03,
                decay: 0.3,
                sustain: 0.7,
                release: 0.8
            },
            modulation: {
                volume: 12,
                type: 'square6'
            },
            modulationEnvelope: {
                attack: 2,
                decay: 3,
                sustain: 0.8,
                release: 0.1
            }
        }
    },
    {
        name: 'Electric Cello',
        type: 'FMSynth',
        config: {
            harmonicity: 3.01,
            modulationIndex: 14,
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.2,
                decay: 0.3,
                sustain: 0.1,
                release: 1.2
            },
            modulation: { type: 'square' },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.5,
                sustain: 0.2,
                release: 0.1
            }
        }
    }
];

let synth = null;
let tremolo = null;
let vibrato = null;

function init_audio() {
    if (!synth) {
        synth = new Tone.PolySynth(Tone.Synth, synth_configs[0].config).toDestination();

        tremolo = new Tone.Tremolo(9, 0.5).start();
        vibrato = new Tone.Vibrato(5, 0.1);

        synth.disconnect();
        synth.connect(tremolo);
        tremolo.connect(vibrato);
        vibrato.toDestination();
    }
}

function analyse_word(word) {
    const vowels = 'AEIOU';
    const number_of_vowels = word.split('').filter(character => vowels.includes(character)).length;
    const letter_position_sum = word.split('').reduce((total, character) => total + (character.charCodeAt(0) - 64), 0);
    const number_of_unique_letters = new Set(word.split('')).size;

    return {
        number_of_vowels,
        letter_position_sum,
        number_of_unique_letters,
        vowel_ratio: number_of_vowels / word.length
    };
}

function get_synth_index(label) {
    if (label === 'Very Negative' || label === 'Negative') {
        return 0;
    } else if (label === 'Neutral') {
        return 1;
    } else {
        return 2;
    }
}

function configure_signal_chain(word) {
    const word_properties = analyse_word(word);

    const effect_frequency = 4 + (word_properties.number_of_unique_letters);
    const tremolo_depth = 0.2 + (word_properties.number_of_vowels / 10);
    const vibrato_depth = 0.05 + (word_properties.number_of_vowels / 30);

    tremolo.frequency.value = effect_frequency;
    tremolo.depth.value = tremolo_depth;
    vibrato.frequency.value = effect_frequency;
    vibrato.depth.value = vibrato_depth;
}

function letter_to_frequency(letter) {
    const position_in_alphabet = letter.charCodeAt(0) - 65;
    const base_frequency = 130.81;
    const semitone_ratio = Math.pow(2, 1/12);
    return base_frequency * Math.pow(semitone_ratio, position_in_alphabet % 12) * Math.pow(2, Math.floor(position_in_alphabet / 12));
}

function word_to_chord(word) {
    return word.split('').map(letter => letter_to_frequency(letter));
}

function get_background_color(label) {
    const colors = ['#d4e4f7', '#e6d4f7', 'LavenderBlush'];
    return colors[get_synth_index(label)];
}

async function play_word_chord(word, note_duration = '1n') {
    await Tone.start();

    const label = await get_sentiment_label(word);
    const chosen_synth_index = get_synth_index(label);
    const chosen_synth_config = synth_configs[chosen_synth_index];

    const color = get_background_color(label);
    console.log(`Playing ${word}: label=${label}, synth_index=${chosen_synth_index}, synth=${chosen_synth_config.name}, colour=${color}`);
    document.body.style.backgroundColor = color;

    synth.disconnect();
    synth.dispose();

    if (chosen_synth_config.type === 'AMSynth') {
        synth = new Tone.PolySynth(Tone.AMSynth, chosen_synth_config.config);
    } else if (chosen_synth_config.type === 'FMSynth') {
        synth = new Tone.PolySynth(Tone.FMSynth, chosen_synth_config.config);
    } else {
        synth = new Tone.PolySynth(Tone.Synth, chosen_synth_config.config);
    }

    synth.connect(tremolo);

    configure_signal_chain(word);

    const chord_frequencies = word_to_chord(word);

    synth.triggerAttackRelease(chord_frequencies, note_duration);
}

async function play_path_sequence() {
    if (!current_path || current_path.length === 0) return;

    await Tone.start();
    const signal_info_display = document.getElementById('signalInfo');

    for (let word_index = 0; word_index < current_path.length; word_index++) {
        const current_word = current_path[word_index];

        await play_word_chord(current_word, '2n');

        await new Promise(resolve => setTimeout(resolve, 800));
    }

    signal_info_display.textContent = 'Sequence complete!';
}

async function load_words() {
    try {
        const response = await fetch('/static/4-letter-words.txt');
        if (!response.ok) {
            throw new Error('Failed to load word list');
        }
        const text = await response.text();
        const words = text.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 4);
        WORDS = new Set(words);
    } catch (error) {
        const status_element = document.getElementById('status');
        status_element.textContent = 'Error: Could not load 4-letter-words.txt';
        status_element.style.color = '#e74c3c';
    }
}

function process_word(word) {
    return word.toUpperCase().trim();
}

function is_valid_word(word) {
    return WORDS.has(word);
}

function find_frontier(word) {
    const frontier = [];
    for (let i = 0; i < word.length; i++) {
        for (let char_code = 65; char_code <= 90; char_code++) {
            const letter = String.fromCharCode(char_code);
            if (letter !== word[i]) {
                const new_word = word.substring(0, i) + letter + word.substring(i + 1);
                if (is_valid_word(new_word)) {
                    frontier.push(process_word(new_word));
                }
            }
        }
    }
    return frontier;
}

function bfs(word1, word2) {
    const visited = new Set([word1]);
    const queue = [[word1]];

    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === word2) {
            return path;
        }

        for (const neighbor of find_frontier(node)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }
    return null;
}

function display_result(path) {
    const result_div = document.getElementById('result');
    const path_div = document.getElementById('path');
    const title_div = document.getElementById('resultTitle');
    const signal_info = document.getElementById('signalInfo');

    path_div.innerHTML = '';
    signal_info.textContent = '';

    if (path) {
        current_path = path;
        title_div.textContent = `Solution found in ${path.length - 1} steps:`;
        path.forEach((word, index) => {
            const word_item = nn.create('div')
                .set({
                    className: 'word-item',
                    'data-word-index': index
                })
                .content(`${index + 1}. ${word}`)
                .addTo(path_div);
        });
    } else {
        current_path = null;
        title_div.textContent = 'No solution found';
        nn.create('div')
            .set({ className: 'word-item error' })
            .content('No path exists between these words')
            .addTo(path_div);
    }

    result_div.classList.add('show');
}

function share_word() {
    const word1 = process_word(document.getElementById('word1').value);

    if (WORDS.size === 0) {
        alert('Please wait for the word list to load');
        return;
    }

    if (word1.length !== 4) {
        alert('Please enter a valid 4-letter word first');
        return;
    }

    if (!is_valid_word(word1)) {
        alert(`"${word1}" is not in the word list`);
        return;
    }

    const share_url = `${window.location.origin}${window.location.pathname}?word1=${word1}`;

    navigator.clipboard.writeText(share_url).then(() => {
        const share_btn = document.getElementById('shareBtn');
        const original_text = share_btn.textContent;
        share_btn.textContent = '✓ Copied!';
        setTimeout(() => {
            share_btn.textContent = original_text;
        }, 2000);
    }).catch(() => {
        prompt('Copy this URL to share:', share_url);
    });
}

async function solve_click() {
    const word1_input = document.getElementById('word1');
    const word2_input = document.getElementById('word2');
    const result_div = document.getElementById('result');

    const word1 = process_word(word1_input.value);
    const word2 = process_word(word2_input.value);

    if (WORDS.size === 0) {
        alert('Please wait for the word list to load');
        return;
    }

    if (word1.length !== 4 || word2.length !== 4) {
        alert('Both words must be exactly 4 letters long');
        return;
    }

    if (!is_valid_word(word1)) {
        alert(`"${word1}" is not in the word list`);
        return;
    }

    if (!is_valid_word(word2)) {
        alert(`"${word2}" is not in the word list`);
        return;
    }

    init_audio();

    result_div.classList.remove('show');

    setTimeout(async () => {
        const path = bfs(word1, word2);
        display_result(path);
        if (path) {
            await play_path_sequence();
        }
    }, 10);
}

nn.create('h1')
    .content('Word Weaver Music')
    .addTo('body');

nn.create('h2')
    .content('Enter 2 words (must be 4 letters long)')
    .addTo('body');

nn.create('label')
    .set('for', 'word1')
    .content('Start Word')
    .addTo('body');

nn.create('input')
    .set({
        type: 'text',
        id: 'word1',
        maxlength: 4
    })
    .addTo('body');

nn.create('button')
    .set('id', 'shareBtn')
    .content('📤 Share')
    .on('click', share_word)
    .addTo('body');

nn.create('br').addTo('body');

nn.create('label')
    .set('for', 'word2')
    .content('End Word')
    .addTo('body');

nn.create('input')
    .set({
        type: 'text',
        id: 'word2',
        maxlength: 4
    })
    .addTo('body');

nn.create('br').addTo('body');

const solveBtn = nn.create('button')
    .set('id', 'solveBtn')
    .content('Generate Music')
    .on('click', solve_click)
    .addTo('body');

nn.create('br').addTo('body');

nn.create('label')
    .set({
        className: 'status',
        id: 'status'
    })
    .addTo('body');

nn.create('div')
    .set({
        className: 'result',
        id: 'result'
    })
    .addTo('body');

nn.create('h3')
    .set('id', 'resultTitle')
    .content('Solution Path:')
    .addTo('#result');

nn.create('div')
    .set({
        className: 'path',
        id: 'path'
    })
    .addTo('#result');

nn.create('div')
    .set({
        className: 'signal-info',
        id: 'signalInfo'
    })
    .addTo('#result');

document.getElementById('word1').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('word2').focus();
});

document.getElementById('word2').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') solve_click();
});

load_words();

const params = get_query_params();
if (params.word1) {
    const word1_input = document.getElementById('word1');
    const word2_input = document.getElementById('word2');
    const share_btn = document.getElementById('shareBtn');

    word1_input.value = params.word1;
    word1_input.disabled = true;
    share_btn.style.display = 'none';
    word2_input.focus();

    const h2 = document.querySelector('h2');
    h2.textContent = `Complete the word ladder starting from "${params.word1}"!`;
}
