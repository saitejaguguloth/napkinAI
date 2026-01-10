"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconSend } from "./StudioIcons";
import { StudioConfig } from "./SuggestionsPanel";
import VoiceInput from "./VoiceInput";

interface ModifyMessage {
    id: string;
    type: "user" | "ai" | "system";
    content: string;
    timestamp: Date;
    isVoice?: boolean;
}

interface ModifyChatProps {
    config: StudioConfig;
    onModify: (command: string) => void;
    isProcessing: boolean;
    modificationHistory: ModifyMessage[];
    onHistoryUpdate: (messages: ModifyMessage[]) => void;
}

// Generate AI response based on command
function generateResponse(command: string): string {
    const lowerCmd = command.toLowerCase();

    if (lowerCmd.includes("sidebar")) {
        return "Switching to sidebar navigation. Regenerating...";
    }
    if (lowerCmd.includes("top nav") || lowerCmd.includes("topnav")) {
        return "Switching to top navbar. Regenerating...";
    }
    if (lowerCmd.includes("black") && lowerCmd.includes("white")) {
        return "Applying pure black & white palette. Regenerating...";
    }
    if (lowerCmd.includes("grayscale")) {
        return "Switching to grayscale palette. Regenerating...";
    }
    if (lowerCmd.includes("brutalist")) {
        return "Applying brutalist style. Regenerating...";
    }
    if (lowerCmd.includes("minimal")) {
        return "Applying minimal style. Regenerating...";
    }
    if (lowerCmd.includes("interactive") || lowerCmd.includes("animation")) {
        return "Adding interactive elements. Regenerating...";
    }
    if (lowerCmd.includes("spacing") || lowerCmd.includes("breathing")) {
        return "Increasing spacing. Regenerating...";
    }
    if (lowerCmd.includes("contrast")) {
        return "Increasing contrast. Regenerating...";
    }
    if (lowerCmd.includes("blue")) {
        return "Making elements blue. Regenerating...";
    }
    if (lowerCmd.includes("header") || lowerCmd.includes("hero")) {
        return "Adding header section. Regenerating...";
    }
    if (lowerCmd.includes("modern")) {
        return "Making design more modern. Regenerating...";
    }

    return "Applying modifications. Regenerating...";
}

export default function ModifyChat({
    config,
    onModify,
    isProcessing,
    modificationHistory,
    onHistoryUpdate,
}: ModifyChatProps) {
    const [input, setInput] = useState("");
    const [inputMode, setInputMode] = useState<"text" | "voice">("text");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevProcessingRef = useRef(isProcessing);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [modificationHistory]);

    // Track when processing completes to add success message
    useEffect(() => {
        if (prevProcessingRef.current && !isProcessing && modificationHistory.length > 0) {
            const lastMsg = modificationHistory[modificationHistory.length - 1];
            if (lastMsg?.type === "ai" && lastMsg.content.includes("Regenerating")) {
                const successMessage: ModifyMessage = {
                    id: Date.now().toString() + "-success",
                    type: "ai",
                    content: "Done! Changes applied to preview.",
                    timestamp: new Date(),
                };
                onHistoryUpdate([...modificationHistory, successMessage]);
            }
        }
        prevProcessingRef.current = isProcessing;
    }, [isProcessing, modificationHistory, onHistoryUpdate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        processCommand(input.trim());
        setInput("");
    };

    const processCommand = (command: string, isVoice = false) => {
        if (!command || isProcessing) return;

        // Add user message
        const userMessage: ModifyMessage = {
            id: Date.now().toString(),
            type: "user",
            content: command,
            timestamp: new Date(),
            isVoice,
        };

        // Generate AI response
        const response = generateResponse(command);

        const aiMessage: ModifyMessage = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: response,
            timestamp: new Date(),
        };

        onHistoryUpdate([...modificationHistory, userMessage, aiMessage]);

        // Trigger modification
        onModify(command);
    };

    const handleVoiceCommand = (command: string) => {
        processCommand(command, true);
    };

    // Quick modification suggestions
    const QUICK_COMMANDS = [
        "Switch to sidebar navigation",
        "Make it more minimalist",
        "Add micro-interactions",
        "Increase spacing",
        "Apply pure black & white",
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Header with mode toggle */}
            <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-medium text-white">Modify with AI</h2>
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                    <button
                        onClick={() => setInputMode("text")}
                        className={`px-2.5 py-1 rounded text-xs transition-all ${inputMode === "text"
                                ? "bg-white/10 text-white"
                                : "text-white/50 hover:text-white/70"
                            }`}
                    >
                        Text
                    </button>
                    <button
                        onClick={() => setInputMode("voice")}
                        className={`px-2.5 py-1 rounded text-xs transition-all flex items-center gap-1 ${inputMode === "voice"
                                ? "bg-white/10 text-white"
                                : "text-white/50 hover:text-white/70"
                            }`}
                    >
                        🎤 Voice
                    </button>
                </div>
            </div>

            {/* Current Config Summary */}
            <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
                    <span>Stack: <strong className="text-white/70">{config.techStack}</strong></span>
                    <span>•</span>
                    <span>Nav: <strong className="text-white/70">{config.navType}</strong></span>
                    <span>•</span>
                    <span>Style: <strong className="text-white/70">{config.designSystem}</strong></span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
                {modificationHistory.length === 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-white/50">
                            Your design has been generated. Use chat commands to modify it.
                        </p>
                        <div className="space-y-2">
                            <span className="text-xs text-white/30 uppercase tracking-wider">Try:</span>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_COMMANDS.map((cmd, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setInput(cmd)}
                                        className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/60 hover:border-white/20 hover:text-white/80 transition-all"
                                    >
                                        {cmd}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    modificationHistory.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={msg.type === "user" ? "text-right" : "text-left"}
                        >
                            <div className={`inline-block max-w-[85%] px-3 py-2 rounded-lg ${msg.type === "user"
                                ? "bg-white/10 text-white/90"
                                : "bg-white/[0.03] text-white/60"
                                }`}>
                                {msg.isVoice && (
                                    <span className="text-xs mr-1">🎤</span>
                                )}
                                <p className="text-sm inline">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Text or Voice */}
            <div className="flex-shrink-0 p-4 border-t border-white/[0.06]">
                <AnimatePresence mode="wait">
                    {inputMode === "text" ? (
                        <motion.form
                            key="text-input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleSubmit}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isProcessing}
                                placeholder="Describe changes..."
                                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isProcessing}
                                className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                {isProcessing ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                ) : (
                                    <IconSend size={16} />
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="voice-input"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <VoiceInput
                                onCommand={handleVoiceCommand}
                                isProcessing={isProcessing}
                                disabled={isProcessing}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
