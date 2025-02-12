// Initialize Audio Context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let reverb;
let sequence;

// Create and initialize reverb
async function initReverb() {
    const convolver = audioContext.createConvolver();

    // Create impulse response
    const sampleRate = audioContext.sampleRate;
    const length = 2 * sampleRate; // 2 seconds
    const impulseBuffer = audioContext.createBuffer(2, length, sampleRate);

    // Fill both channels
    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulseBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (sampleRate * 0.5));
            channelData[i] = (Math.random() * 2 - 1) * decay;
        }
    }

    convolver.buffer = impulseBuffer;

    // Create mix controls
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const output = audioContext.createGain();

    // Set initial mix
    dryGain.gain.value = 0.5;
    wetGain.gain.value = 0.5;

    // Connect the nodes
    dryGain.connect(output);
    dryGain.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(output);
    output.connect(audioContext.destination);

    return {
        input: dryGain,
        output: output,
        setMix(dryLevel) {
            const wetLevel = 1 - dryLevel;
            dryGain.gain.value = dryLevel;
            wetGain.gain.value = wetLevel;
        }
    };
}

// Function to update reverb mix from slider
function updateReverbMix(value) {
    const dryLevel = 1 - (value / 100);
    reverb.setMix(dryLevel);
    document.getElementById('mixValue').textContent = value + '%';
}

// Modified playNote function to use reverb
function playNote(frequency, duration = 0.5) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(reverb.input);

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Define musical notes
const notes = {
    'C4': 261.63,
    'D4': 293.66,
    'E4': 329.63,
    'F4': 349.23,
    'G4': 392.00,
    'A4': 440.00,
    'B4': 493.88,
    'C5': 523.25
};

// Initialize everything
async function init() {
    reverb = await initReverb();

    // Create keyboard
    const keyboard = document.getElementById('keyboard');
    Object.entries(notes).forEach(([note, freq]) => {
        const button = document.createElement('button');
        button.className = 'key';
        button.textContent = note;
        button.onclick = () => {
            // Start audio context on first click (required by browsers)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            playNote(freq);
        };
        keyboard.appendChild(button);
    });
}

// Simple melody sequence
function playSequence() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const melody = [
        { note: notes.C4, duration: 0.5 },
        { note: notes.E4, duration: 0.5 },
        { note: notes.G4, duration: 0.5 },
        { note: notes.C5, duration: 1 }
    ];

    let time = 0;
    melody.forEach(({ note, duration }) => {
        setTimeout(() => playNote(note, duration), time * 1000);
        time += duration;
    });
}

function stopSequence() {
    audioContext.suspend();
    setTimeout(() => audioContext.resume(), 100);
}

