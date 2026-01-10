"use client";

import { motion } from "framer-motion";

interface PageFlowInstructionsProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    pageCount: number;
}

export default function PageFlowInstructions({
    value,
    onChange,
    disabled = false,
    pageCount,
}: PageFlowInstructionsProps) {
    // Only show when more than 1 page is uploaded
    if (pageCount <= 1) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/[0.06]"
        >
            <div className="mb-2">
                <h4 className="text-xs font-medium text-white/70 mb-1">
                    Page Flow Instructions
                </h4>
                <p className="text-[10px] text-white/40">
                    Describe how pages should connect
                </p>
            </div>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Describe how pages are connected. Example: Page 2 opens when clicking Get Started on Page 1."
                className="w-full h-24 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20 disabled:opacity-50 transition-colors"
            />

            {/* Quick templates */}
            <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                    { label: "Get Started → Page 2", text: "Page 2 opens when clicking 'Get Started' on Page 1" },
                    { label: "Login → Dashboard", text: "Login button navigates to Dashboard page" },
                    { label: "Navbar links", text: "Navbar links should navigate to corresponding pages" },
                ].map((template) => (
                    <button
                        key={template.label}
                        onClick={() => onChange(value ? `${value}\n${template.text}` : template.text)}
                        disabled={disabled}
                        className="px-2 py-1 rounded text-[10px] bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-all disabled:opacity-30"
                    >
                        {template.label}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
