"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceRecognition, isSpeechRecognitionSupported } from "@/lib/voice/speechRecognition";

interface FloatingVoicePanelProps {
    onCommand: (command: string) => void;
    isProcessing?: boolean;
    isVisible?: boolean;
    canModify?: boolean; // Whether modifications are allowed (only when code is generated)
}

/**
 * FloatingVoicePanel - Always-visible voice editing panel for the Studio
 * Stays visible while editing with real-time transcription
 */
export default function FloatingVoicePanel({
    onCommand,
    isProcessing,
    isVisible = true,
    canModify = false
}: FloatingVoicePanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [commandInput, setCommandInput] = useState("");
    const [isSupported, setIsSupported] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const recognitionRef = useRef<VoiceRecognition | null>(null);

    // Check browser support
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsSupported(isSpeechRecognitionSupported());
        }
    }, []);

    // Start listening with streaming transcription
    const startListening = useCallback(() => {
        if (isProcessing) return;

        setTranscript("");
        setInterimTranscript("");

        recognitionRef.current = new VoiceRecognition({
            language: 'en-US',
            continuous: true,
            interimResults: true,
            onResult: (text, isFinal) => {
                if (isFinal) {
                    setTranscript(prev => prev + text + ' ');
                    setInterimTranscript("");
                    setCommandInput(prev => prev + text + ' ');
                } else {
                    setInterimTranscript(text);
                }
            },
            onStart: () => {
                setIsListening(true);
                setIsExpanded(true);
            },
            onEnd: () => {
                setIsListening(false);
            },
            onError: (err) => {
                setIsListening(false);
                console.error('Voice error:', err);
            }
        });

        recognitionRef.current.start();
    }, [isProcessing]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    // Apply command
    const handleApply = useCallback(() => {
        const finalCommand = commandInput.trim() || transcript.trim();
        if (finalCommand && !isProcessing && canModify) {
            onCommand(finalCommand);
            setCommandInput("");
            setTranscript("");
            setInterimTranscript("");
        }
    }, [commandInput, transcript, isProcessing, canModify, onCommand]);

    // Keyboard shortcut: Enter to apply
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleApply();
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-20 right-0 w-80 bg-[#18181B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                {isListening && (
                                    <motion.div
                                        className="w-2 h-2 rounded-full bg-red-500"
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                    />
                                )}
                                <span className="text-sm font-medium text-white">
                                    {isListening ? 'Listening...' : 'Voice Editor'}
                                </span>
                                {!canModify && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                        Generate first
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-white/40 hover:text-white/70 text-lg"
                            >
                                ×
                            </button>
                        </div>

                        {/* Transcription Area - Real-time Streaming */}
                        <div className="p-4 max-h-32 overflow-y-auto">
                            {!isSupported ? (
                                <p className="text-sm text-yellow-400">
                                    ⚠️ Voice not supported in this browser
                                </p>
                            ) : (
                                <div className="text-sm min-h-[40px]">
                                    {transcript || interimTranscript ? (
                                        <>
                                            <span className="text-white/80">{transcript}</span>
                                            <span className="text-blue-400/60 italic">{interimTranscript}</span>
                                        </>
                                    ) : (
                                        <span className="text-white/30">
                                            {isListening ? 'Speak now...' : 'Click mic or type a command'}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Command Preview */}
                        {(transcript || interimTranscript || commandInput) && (
                            <div className="px-4 pb-3 border-t border-white/5 pt-3">
                                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Command Preview</p>
                                <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-blue-400">
                                        {commandInput || transcript || interimTranscript}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Command Input */}
                        <div className="px-4 pb-4">
                            <input
                                type="text"
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder='e.g., "Make buttons blue"'
                                disabled={isProcessing}
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 px-4 pb-4">
                            <button
                                onClick={isListening ? stopListening : startListening}
                                disabled={isProcessing || !isSupported}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${isListening
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                                {isListening ? '⏹ Stop' : '🎤 Record'}
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={isProcessing || !canModify || (!commandInput.trim() && !transcript.trim())}
                                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20"
                                title={!canModify ? 'Generate code first to enable editing' : ''}
                            >
                                {isProcessing ? (
                                    <motion.span
                                        animate={{ opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        Applying...
                                    </motion.span>
                                ) : (
                                    'Apply ✓'
                                )}
                            </button>
                        </div>

                        {/* Quick Commands */}
                        <div className="px-4 pb-4 border-t border-white/5 pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] text-white/30 uppercase tracking-wider">Quick Commands</p>
                                <button
                                    onClick={() => setShowHelp(!showHelp)}
                                    className="text-[10px] text-blue-400 hover:text-blue-300"
                                >
                                    {showHelp ? 'Hide' : 'Help'}
                                </button>
                            </div>
                            
                            {showHelp ? (
                                <div className="space-y-2 text-[11px] text-white/50">
                                    <p className="text-white/70 font-medium">Try saying:</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>"Change hero title to Welcome"</li>
                                        <li>"Make all buttons blue"</li>
                                        <li>"Add smooth animations"</li>
                                        <li>"Increase padding everywhere"</li>
                                        <li>"Make the layout more modern"</li>
                                        <li>"Add a gradient background"</li>
                                        <li>"Move navbar to sidebar"</li>
                                    </ul>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        'Make buttons blue',
                                        'Add animations',
                                        'More spacing',
                                        'Make it modern',
                                        'Dark mode',
                                        'Add gradient'
                                    ].map((cmd) => (
                                        <button
                                            key={cmd}
                                            onClick={() => setCommandInput(cmd)}
                                            disabled={isProcessing}
                                            className="px-2 py-1 text-[11px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 rounded-md transition-colors disabled:opacity-40"
                                        >
                                            {cmd}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Mic Button */}
            <motion.button
                onClick={() => {
                    if (isExpanded && isListening) {
                        stopListening();
                    } else if (!isExpanded) {
                        setIsExpanded(true);
                    } else {
                        startListening();
                    }
                }}
                disabled={isProcessing}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all ${isListening
                        ? 'bg-red-500 shadow-red-500/30'
                        : 'bg-white shadow-white/20 hover:shadow-white/40'
                    } disabled:opacity-50`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Pulse animation when listening */}
                {isListening && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-red-500"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}
                
                {/* Status indicator when not expanded */}
                {!isExpanded && !canModify && (
                    <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-black"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
                
                <span className={`relative z-10 ${isListening ? 'text-white' : 'text-black'}`}>
                    {isListening ? '⏹' : '🎤'}
                </span>
            </motion.button>
        </div>
    );
}
