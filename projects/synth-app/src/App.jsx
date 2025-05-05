import React, { useState, useEffect, useRef } from 'react';

const App = () => {
    const audioContext = useRef(null);
    const mediaRecorder = useRef(null);
    const recordedChunks = useRef([]);
    const audioDestination = useRef(null);
    const oscillators = useRef({});

    const [isLoading, setIsLoading] = useState(true);
    const [octaves, setOctaves] = useState(3);
    const [selectedScale, setSelectedScale] = useState('chromatic');
    const [sustain, setSustain] = useState(0.5);
    const [reverb, setReverb] = useState(0.3);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);

    const scales = {
        chromatic: {
            name: 'Chromatic',
            description: 'All twelve semitones in Western music',
            intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        },
        mbira: {
            name: 'Mbira',
            description: 'A tuning from an African N\'Gundi Mbira instrument (thumb piano)',
            intervals: [0, 2, 4, 7, 9]
        },
        olympos: {
            name: 'Olympos',
            description: 'Scale of an ancient Greek flutist Olympos, 6th century BC',
            intervals: [0, 2, 5, 7, 10]
        }
    };

    useEffect(() => {
        const initAudio = async () => {
            try {
                audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
                audioDestination.current = audioContext.current.createMediaStreamDestination();

                // Initialize MediaRecorder
                mediaRecorder.current = new MediaRecorder(audioDestination.current.stream);

                mediaRecorder.current.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        recordedChunks.current.push(e.data);
                    }
                };

                mediaRecorder.current.onstop = () => {
                    const blob = new Blob(recordedChunks.current, { type: 'audio/webm' });
                    const url = URL.createObjectURL(blob);
                    setRecordedAudioUrl(url);
                    recordedChunks.current = [];
                };

                setIsLoading(false);
            } catch (error) {
                console.error('Error initializing audio:', error);
            }
        };

        initAudio();

        return () => {
            if (audioContext.current) {
                audioContext.current.close();
            }
        };
    }, []);

    const startRecording = () => {
        recordedChunks.current = [];
        mediaRecorder.current.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorder.current.stop();
        setIsRecording(false);
    };

    const createOscillator = (frequency) => {
        if (!audioContext.current) return null;

        const oscillator = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();
        const reverbNode = audioContext.current.createConvolver();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.current.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + sustain + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);
        gainNode.connect(audioDestination.current); // Connect to recording destination

        oscillator.start();
        return { oscillator, gainNode };
    };

    const playNote = (note) => {
        const baseNote = note % 12;
        if (!scales[selectedScale].intervals.includes(baseNote)) {
            return;
        }

        const frequency = 440 * Math.pow(2, note / 12);
        if (!oscillators.current[note]) {
            oscillators.current[note] = createOscillator(frequency);
        }
    };

    const stopNote = (note) => {
        if (oscillators.current[note]) {
            oscillators.current[note].gainNode.gain.exponentialRampToValueAtTime(
                0.001,
                audioContext.current.currentTime + 0.1
            );
            setTimeout(() => {
                if (oscillators.current[note]) {
                    oscillators.current[note].oscillator.stop();
                    delete oscillators.current[note];
                }
            }, 100);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 animate-pulse mx-auto mb-4"></div>
                    <p>Loading Synth...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-400 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="bg-zinc-400 p-6 border border-black">
                            <h2 className="text-2xl text-white mb-4">Harp</h2>
                            <div
                                className="grid grid-cols-12 gap-1"
                                onMouseLeave={() => {
                                    // Stop all playing notes when mouse leaves the keyboard area
                                    Object.keys(oscillators.current).forEach(note => stopNote(parseInt(note)));
                                }}
                            >
                                {Array.from({ length: 12 * octaves }, (_, i) => (
                                    <button
                                        key={i}
                                        className={`${
                                            scales[selectedScale].intervals.includes(i % 12)
                                                ? 'border border-black bg-blue-200 hover:bg-blue-300'
                                                : 'bg-orange-100'
                                        } h-24 rounded transition-colors`}
                                        onMouseDown={() => playNote(i)}
                                        onMouseUp={() => stopNote(i)}
                                        onMouseEnter={(e) => {
                                            // Play note when dragging (mouse down) over keys
                                            if (e.buttons === 1) { // Left mouse button is pressed
                                                playNote(i);
                                            }
                                        }}
                                        onMouseLeave={() => stopNote(i)}
                                        onTouchStart={(e) => {
                                            e.preventDefault(); // Prevent default touch behavior
                                            playNote(i);
                                        }}
                                        onTouchEnd={(e) => {
                                            e.preventDefault();
                                            stopNote(i);
                                        }}
                                        onTouchMove={(e) => {
                                            e.preventDefault();
                                            // Get touch position and find key under touch
                                            const touch = e.touches[0];
                                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                            if (element && element.dataset.noteId) {
                                                const noteId = parseInt(element.dataset.noteId);
                                                if (!oscillators.current[noteId]) {
                                                    playNote(noteId);
                                                }
                                            }
                                        }}
                                        data-note-id={i} // Add data attribute for touch detection
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-300 p-6 border border-black">
                        <h2 className="text-2xl text-gray-500 mb-4">Controls</h2>

                        <div className="mb-4">
                            <label className="block mb-2 text-gray-500">Scale</label>
                            <select
                                className="w-full bg-slate-400 p-2 rounded border border-black"
                                value={selectedScale}
                                onChange={(e) => setSelectedScale(e.target.value)}
                            >
                                {Object.entries(scales).map(([key, scale]) => (
                                    <option key={key} value={key}>{scale.name}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-sm text-neutral-300">
                                {scales[selectedScale].description}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2 text-gray-500">Octaves: {octaves}</label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={octaves}
                                onChange={(e) => setOctaves(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2 text-gray-500">Sustain: {sustain.toFixed(1)}</label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={sustain}
                                onChange={(e) => setSustain(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2 text-gray-500">Reverb: {reverb.toFixed(1)}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={reverb}
                                onChange={(e) => setReverb(parseFloat(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
                <nav className="flex justify-between items-center mt-8">
                    <div className="flex gap-4">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`px-6 py-4 border border-black ${
                                isRecording
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-cyan-600 hover:bg-cyan-700'
                            }`}
                        >
                            {isRecording ? 'Stop Recording' : 'Record'}
                        </button>
                    </div>
                </nav>

                {recordedAudioUrl && (
                    <div className="mt-8 p-4 bg-gray-300">
                        <h2 className="text-xl mb-4">Recorded Audio</h2>
                        <audio controls src={recordedAudioUrl} className="w-full" />
                        <button
                            onClick={() => {
                                const a = document.createElement('a');
                                a.href = recordedAudioUrl;
                                a.download = 'synth-recording.webm';
                                a.click();
                            }}
                            className="mt-4 px-4 py-2 bg-green-200 hover:bg-green-300 rounded"
                        >
                            Download Recording
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;