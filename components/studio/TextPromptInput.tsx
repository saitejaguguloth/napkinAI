"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

interface TextPromptInputProps {
    value: string;
    onChange: (text: string) => void;
    disabled?: boolean;
    maxLength?: number;
}

export default function TextPromptInput({
    value,
    onChange,
    disabled = false,
    maxLength = 2000,
}: TextPromptInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            if (newValue.length <= maxLength) {
                onChange(newValue);
            }
        },
        [onChange, maxLength]
    );

    const examplePrompts = [
        "A modern SaaS dashboard with sidebar navigation, analytics cards, and a data table",
        "An e-commerce product page with image gallery, pricing, and add-to-cart button",
        "A clean login page with social auth buttons and email/password form",
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-sm font-medium text-white/80 mb-1">Describe Your UI</h3>
                <p className="text-xs text-white/40">
                    Describe the interface you want to create in natural language.
                </p>
            </div>

            {/* Text Area */}
            <div className="flex-1 relative">
                <motion.div
                    animate={{
                        borderColor: isFocused ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                    }}
                    className="h-full rounded-lg border bg-white/[0.02] overflow-hidden"
                >
                    <textarea
                        value={value}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={disabled}
                        placeholder="Describe the UI you want to create...

Example: A modern dashboard with a sidebar containing navigation links, a main content area with analytics cards showing key metrics, and a data table with pagination."
                        className="w-full h-full p-4 bg-transparent text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none disabled:opacity-50"
                    />
                </motion.div>

                {/* Character Counter */}
                <div className="absolute bottom-3 right-3 text-xs text-white/30">
                    {value.length} / {maxLength}
                </div>
            </div>

            {/* Example Prompts */}
            <div className="mt-4">
                <p className="text-xs text-white/40 mb-2">Try an example:</p>
                <div className="space-y-2">
                    {examplePrompts.map((prompt, index) => (
                        <button
                            key={index}
                            onClick={() => onChange(prompt)}
                            disabled={disabled}
                            className="w-full text-left p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-all line-clamp-2 disabled:opacity-50"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
