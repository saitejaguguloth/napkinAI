"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceRecognition, isSpeechRecognitionSupported } from "@/lib/voice/speechRecognition";

interface VoiceInputProps {
    onCommand: (command: string) => void;
    isProcessing?: boolean;
    disabled?: boolean;
}

/**
 * VoiceInput - Voice-based UI editing component
 * Features: Mic button, live transcript, visual feedback
 */
export default function VoiceInput({ onCommand, isProcessing, disabled }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isSupported, setIsSupported] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<VoiceRecognition | null>(null);

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsSupported(isSpeechRecognitionSupported());
    }, []);

    // Create recognition instance
    const startListening = useCallback(() => {
        if (disabled || isProcessing) return;

        setError(null);
        setTranscript("");
        setInterimTranscript("");

        recognitionRef.current = new VoiceRecognition({
            language: 'en-US',
            continuous: false,
            interimResults: true,
            onResult: (text, isFinal) => {
                if (isFinal) {
                    setTranscript(text);
                    setInterimTranscript("");
                } else {
                    setInterimTranscript(text);
                }
            },
            onStart: () => {
                setIsListening(true);
            },
            onEnd: () => {
                setIsListening(false);
                // If we have a final transcript, send it
                if (recognitionRef.current) {
                    const finalText = transcript || interimTranscript;
                    if (finalText.trim()) {
                        onCommand(finalText.trim());
                    }
                }
            },
            onError: (err) => {
                setIsListening(false);
                if (err === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone access.');
                } else if (err === 'no-speech') {
                    setError('No speech detected. Try again.');
                } else {
                    setError(`Error: ${err}`);
                }
            }
        });

        recognitionRef.current.start();
    }, [disabled, isProcessing, onCommand, transcript, interimTranscript]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    // Keyboard shortcut: Hold Space to talk
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && e.target === document.body && !isListening && !disabled) {
                e.preventDefault();
                startListening();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space' && isListening) {
                e.preventDefault();
                stopListening();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isListening, disabled, startListening, stopListening]);

    // Not supported
    if (!isSupported) {
        return (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                    <span>⚠️</span>
                    <span>Voice input not supported in this browser</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main mic button */}
            <div className="flex flex-col items-center">
                <motion.button
                    onClick={isListening ? stopListening : startListening}
                    disabled={disabled || isProcessing}
                    className={`
                        relative w-16 h-16 rounded-full flex items-center justify-center
                        transition-all duration-300 
                        ${isListening
                            ? 'bg-red-500 shadow-lg shadow-red-500/30'
                            : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30'
                        }
                        ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    whileHover={!disabled && !isProcessing ? { scale: 1.05 } : {}}
                    whileTap={!disabled && !isProcessing ? { scale: 0.95 } : {}}
                >
                    {/* Pulsing animation when listening */}
                    {isListening && (
                        <>
                            <motion.div
                                className="absolute inset-0 rounded-full bg-red-500"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full bg-red-500"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                            />
                        </>
                    )}

                    {/* Mic icon */}
                    <svg
                        className="w-7 h-7 text-white relative z-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {isListening ? (
                            // Stop icon
                            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                        ) : (
                            // Mic icon
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                        )}
                    </svg>
                </motion.button>

                {/* Status text */}
                <p className="mt-3 text-xs text-white/50">
                    {isListening ? 'Listening... Click to stop' : 'Click or hold Space to speak'}
                </p>
            </div>

            {/* Live transcript */}
            <AnimatePresence>
                {(isListening || interimTranscript || transcript) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-white/5 rounded-xl border border-white/10"
                    >
                        <div className="flex items-start gap-2">
                            {isListening && (
                                <motion.div
                                    className="w-2 h-2 mt-1.5 rounded-full bg-red-500"
                                    animate={{ opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                />
                            )}
                            <div className="flex-1">
                                <p className="text-sm text-white/80">
                                    {transcript || interimTranscript || (
                                        <span className="text-white/40 italic">Listening...</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Processing indicator */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20"
                    >
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                            />
                            <span className="text-sm text-blue-400">Processing your command...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error display */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-red-500/10 rounded-xl border border-red-500/20"
                    >
                        <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Example commands */}
            <div className="pt-2">
                <p className="text-xs text-white/30 mb-2">Try saying:</p>
                <div className="flex flex-wrap gap-1.5">
                    {[
                        "Make the buttons blue",
                        "Add a header section",
                        "Make it more modern",
                        "Add animations"
                    ].map((example) => (
                        <button
                            key={example}
                            onClick={() => onCommand(example)}
                            disabled={disabled || isProcessing}
                            className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 rounded-full transition-colors border border-white/5"
                        >
                            "{example}"
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
