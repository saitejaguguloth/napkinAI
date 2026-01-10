"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconCheck, IconChevronDown, IconLayout } from "./StudioIcons";
import GenerationProgress, { GenerationStep } from "./GenerationProgress";

// ===== FULL STUDIO CONFIG =====
export interface StudioConfig {
    // Tech Stack (mandatory)
    techStack: "nextjs" | "react" | "html" | "vue" | "svelte";

    // Styling
    styling: "tailwind" | "cssmodules" | "vanilla";

    // Design System
    designSystem: "minimal" | "brutalist" | "editorial" | "midnight" | "highcontrast";

    // Typography
    typography: "inter" | "system" | "geist" | "editorial";

    // Color Palette (mandatory)
    colorPalette: ColorPaletteOption;

    // Interaction Level
    interactionLevel: "static" | "micro" | "full";

    // Features
    features: string[];

    // Layout (auto-detected)
    pageType: string;
    navType: "topnav" | "sidebar" | "bottomnav" | "none";
    detectedSections: string[];
}

export interface ColorPaletteOption {
    id: string;
    name: string;
    colors: string[];
}

interface LayoutAnalysis {
    pageType: string;
    sections: string[];
    structure: string;
    navigation: string;
    components: string[];
}



// ... existing interfaces

export interface SuggestionsPanelProps {
    layoutAnalysis: LayoutAnalysis | null;
    isAnalyzing: boolean;
    isGenerating: boolean;
    onConfirm: (config: StudioConfig) => void;
    onAnalyze: () => void;
    hasImages: boolean;
    savedConfig: StudioConfig | null;
    generationStep?: GenerationStep;
    inputType?: "sketch" | "text" | "existing";
    textPrompt?: string;
}

// ... existing code



// Config state (restore from savedConfig if available)
const TECH_STACKS = [
    { id: "nextjs", label: "Next.js", desc: "App Router" },
    { id: "react", label: "React", desc: "Vite" },
    { id: "html", label: "HTML + Tailwind", desc: "Single file" },
    { id: "vue", label: "Vue", desc: "Composition API" },
    { id: "svelte", label: "Svelte", desc: "SvelteKit" },
] as const;

const STYLING_OPTIONS = [
    { id: "tailwind", label: "Tailwind CSS" },
    { id: "cssmodules", label: "CSS Modules" },
    { id: "vanilla", label: "Vanilla CSS" },
] as const;

const DESIGN_SYSTEMS = [
    { id: "minimal", label: "Minimal SaaS", colors: ["#F5F5F5", "#E0E0E0", "#333333", "#000000", "#FFFFFF"] },
    { id: "brutalist", label: "Brutalist", colors: ["#000000", "#333333", "#FF0000", "#FFFF00", "#FFFFFF"] },
    { id: "editorial", label: "Editorial", colors: ["#1A1A2E", "#16213E", "#0F3460", "#E94560", "#FFFFFF"] },
    { id: "midnight", label: "Midnight", colors: ["#0D1117", "#161B22", "#21262D", "#58A6FF", "#C9D1D9"] },
    { id: "highcontrast", label: "High-contrast", colors: ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF"] },
] as const;

const COLOR_PALETTES: ColorPaletteOption[] = [
    { id: "bw", name: "Black & White", colors: ["#000000", "#FFFFFF", "#333333", "#666666", "#999999"] },
    { id: "grayscale", name: "Grayscale", colors: ["#111111", "#333333", "#666666", "#999999", "#CCCCCC"] },
    { id: "neutral", name: "Neutral + Accent", colors: ["#1A1A1A", "#2D2D2D", "#404040", "#00D9FF", "#FFFFFF"] },
    { id: "warm", name: "Warm Tones", colors: ["#1A1A1A", "#2D2D2D", "#FF6B35", "#F7931E", "#FFFFFF"] },
    { id: "cool", name: "Cool Tones", colors: ["#0A0A1A", "#1A1A2E", "#4361EE", "#7209B7", "#F8F8FF"] },
];

const TYPOGRAPHY_OPTIONS = [
    { id: "inter", label: "Inter (Modern)", value: "'Inter', sans-serif", preview: "The quick brown fox" },
    { id: "system", label: "System UI", value: "system-ui, -apple-system, sans-serif", preview: "The quick brown fox" },
    { id: "geist", label: "Geist (Minimal)", value: "'Geist Sans', sans-serif", preview: "The quick brown fox" },
    { id: "editorial", label: "Editorial", value: "'Playfair Display', serif", preview: "The quick brown fox" },
] as const;

const INTERACTION_LEVELS = [
    { id: "static", label: "Static UI", desc: "No effects" },
    { id: "micro", label: "Micro-interactions", desc: "Hover & transitions" },
    { id: "full", label: "Full Interactive", desc: "State & animations" },
] as const;

const FEATURES = [
    { id: "formValidation", label: "Form validation" },
    { id: "toasts", label: "Toast notifications" },
    { id: "loading", label: "Loading states" },
    { id: "modals", label: "Modals" },
    { id: "scrollAnimations", label: "Scroll animations" },
    { id: "darkMode", label: "Dark mode toggle" },
];

// ===== COLLAPSIBLE CARD COMPONENT =====
function CollapsibleCard({
    title,
    required,
    defaultOpen = true,
    children,
}: {
    title: string;
    required?: boolean;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{title}</span>
                    {required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">Required</span>
                    )}
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <IconChevronDown size={14} className="text-white/40" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-white/10">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ===== COLOR CIRCLES COMPONENT =====
function ColorCircles({ colors, size = 16 }: { colors: readonly string[]; size?: number }) {
    return (
        <div className="flex items-center gap-1">
            {colors.slice(0, 5).map((color, i) => (
                <div
                    key={i}
                    className="rounded-full border border-white/20"
                    style={{ width: size, height: size, backgroundColor: color }}
                />
            ))}
        </div>
    );
}

// ===== MAIN COMPONENT =====
export default function SuggestionsPanel({
    layoutAnalysis,
    isAnalyzing,
    isGenerating,
    onConfirm,
    onAnalyze,
    hasImages,
    savedConfig,
    generationStep = "analyzing",
    inputType = "sketch",
    textPrompt = "",
}: SuggestionsPanelProps) {
    const inputMode = inputType || "sketch";
    const hasTextContent = (textPrompt || "").trim().length > 10;
    const hasValidInput = inputMode === "sketch" ? hasImages : inputMode === "text" ? hasTextContent : false;
    // Show progress when generating
    if (isGenerating) {
        return <GenerationProgress currentStep={generationStep} />;
    }
    // Config state (restore from savedConfig if available)
    const [techStack, setTechStack] = useState<StudioConfig["techStack"]>(savedConfig?.techStack || "html");
    const [styling, setStyling] = useState<StudioConfig["styling"]>(savedConfig?.styling || "tailwind");
    const [designSystem, setDesignSystem] = useState<StudioConfig["designSystem"]>(savedConfig?.designSystem || "minimal");
    const [typography, setTypography] = useState<StudioConfig["typography"]>(savedConfig?.typography || "inter");
    const [colorPalette, setColorPalette] = useState<ColorPaletteOption | null>(savedConfig?.colorPalette || null);
    const [interactionLevel, setInteractionLevel] = useState<StudioConfig["interactionLevel"]>(savedConfig?.interactionLevel || "micro");
    const [features, setFeatures] = useState<string[]>(savedConfig?.features || []);

    // Validation - now supports text mode
    const canConfirm = hasValidInput && colorPalette !== null;

    const toggleFeature = (featureId: string) => {
        setFeatures(prev =>
            prev.includes(featureId)
                ? prev.filter(f => f !== featureId)
                : [...prev, featureId]
        );
    };

    const handleConfirm = () => {
        if (!canConfirm) return;

        const config: StudioConfig = {
            techStack,
            styling,
            designSystem,
            typography,
            colorPalette: colorPalette!,
            interactionLevel,
            features,
            pageType: layoutAnalysis?.pageType || "landing",
            navType: layoutAnalysis?.navigation?.includes("sidebar") ? "sidebar" : "topnav",
            detectedSections: layoutAnalysis?.sections || [],
        };

        onConfirm(config);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-12 flex-shrink-0 flex items-center px-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-medium text-white">Configuration</h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Analyze Button (if not analyzed yet) */}
                {hasValidInput && !layoutAnalysis && !isAnalyzing && (
                    <button
                        onClick={onAnalyze}
                        className="w-full py-3 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-all"
                    >
                        {inputMode === "text" ? "Generate from Description" : "Analyze Uploaded Images"}
                    </button>
                )}

                {isAnalyzing && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        <span className="text-sm text-white/60">Analyzing...</span>
                    </div>
                )}

                {/* Detected Layout (if analyzed) */}
                {layoutAnalysis && (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                        <div className="flex items-center gap-2">
                            <IconLayout size={14} className="text-white/40" />
                            <span className="text-xs text-white/40 uppercase">Detected</span>
                        </div>
                        <p className="text-sm text-white capitalize">{layoutAnalysis.pageType} page</p>
                        <div className="flex flex-wrap gap-1">
                            {layoutAnalysis.sections.slice(0, 4).map((s, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-xs text-white/60">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== TECH STACK (MANDATORY) ===== */}
                <CollapsibleCard title="Tech Stack" required>
                    <div className="space-y-2">
                        {TECH_STACKS.map((stack) => (
                            <button
                                key={stack.id}
                                onClick={() => setTechStack(stack.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${techStack === stack.id
                                    ? "bg-white/10 border border-white/30"
                                    : "bg-white/[0.02] border border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${techStack === stack.id ? "border-white" : "border-white/30"
                                        }`}>
                                        {techStack === stack.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span className="text-sm text-white">{stack.label}</span>
                                </div>
                                <span className="text-xs text-white/40">{stack.desc}</span>
                            </button>
                        ))}
                    </div>
                </CollapsibleCard>

                {/* ===== STYLING ===== */}
                <CollapsibleCard title="Styling" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {STYLING_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setStyling(opt.id)}
                                className={`px-3 py-2 rounded-lg text-sm transition-all ${styling === opt.id
                                    ? "bg-white text-black"
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </CollapsibleCard>

                {/* ===== DESIGN SYSTEM ===== */}
                <CollapsibleCard title="Design System" defaultOpen={false}>
                    <div className="space-y-2">
                        {DESIGN_SYSTEMS.map((ds) => (
                            <button
                                key={ds.id}
                                onClick={() => setDesignSystem(ds.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${designSystem === ds.id
                                    ? "bg-white/10 border border-white/30"
                                    : "bg-white/[0.02] border border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <ColorCircles colors={ds.colors} size={14} />
                                    <span className="text-sm text-white">{ds.label}</span>
                                </div>
                                {designSystem === ds.id && <IconCheck size={14} className="text-white" />}
                            </button>
                        ))}
                    </div>
                </CollapsibleCard>

                {/* ===== COLOR PALETTE (MANDATORY) ===== */}
                <CollapsibleCard title="Color Palette" required>
                    <div className="space-y-2">
                        {COLOR_PALETTES.map((palette) => (
                            <button
                                key={palette.id}
                                onClick={() => setColorPalette(palette)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${colorPalette?.id === palette.id
                                    ? "bg-white/10 border border-white/30"
                                    : "bg-white/[0.02] border border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <ColorCircles colors={palette.colors} size={18} />
                                    <span className="text-sm text-white">{palette.name}</span>
                                </div>
                                {colorPalette?.id === palette.id && <IconCheck size={14} className="text-white" />}
                            </button>
                        ))}
                    </div>
                    {!colorPalette && (
                        <p className="mt-2 text-xs text-white/40">Select a palette to continue</p>
                    )}
                </CollapsibleCard>

                {/* ===== TYPOGRAPHY ===== */}
                <CollapsibleCard title="Typography" defaultOpen={false}>
                    <div className="space-y-2">
                        {TYPOGRAPHY_OPTIONS.map((font) => (
                            <button
                                key={font.id}
                                onClick={() => setTypography(font.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${typography === font.id
                                    ? "bg-white/10 border border-white/30"
                                    : "bg-white/[0.02] border border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-sm text-white">{font.label}</span>
                                    <span className="text-xs text-white/40" style={{ fontFamily: font.value }}>{font.preview}</span>
                                </div>
                                {typography === font.id && <IconCheck size={14} className="text-white" />}
                            </button>
                        ))}
                    </div>
                </CollapsibleCard>

                {/* ===== INTERACTION LEVEL ===== */}
                <CollapsibleCard title="Interaction Level" defaultOpen={false}>
                    <div className="space-y-2">
                        {INTERACTION_LEVELS.map((level) => (
                            <button
                                key={level.id}
                                onClick={() => setInteractionLevel(level.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${interactionLevel === level.id
                                    ? "bg-white/10 border border-white/30"
                                    : "bg-white/[0.02] border border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${interactionLevel === level.id ? "border-white" : "border-white/30"
                                        }`}>
                                        {interactionLevel === level.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span className="text-sm text-white">{level.label}</span>
                                </div>
                                <span className="text-xs text-white/40">{level.desc}</span>
                            </button>
                        ))}
                    </div>
                </CollapsibleCard>

                {/* ===== FEATURES ===== */}
                <CollapsibleCard title="Features" defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-2">
                        {FEATURES.map((feature) => (
                            <button
                                key={feature.id}
                                onClick={() => toggleFeature(feature.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${features.includes(feature.id)
                                    ? "bg-white/10 border border-white/30"
                                    : "bg-white/[0.02] border border-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${features.includes(feature.id) ? "bg-white border-white" : "border-white/30"
                                    }`}>
                                    {features.includes(feature.id) && (
                                        <IconCheck size={10} className="text-black" />
                                    )}
                                </div>
                                <span className="text-white/80 text-xs">{feature.label}</span>
                            </button>
                        ))}
                    </div>
                </CollapsibleCard>
            </div>

            {/* Confirm Button */}
            <div className="flex-shrink-0 p-4 border-t border-white/[0.06]">
                <button
                    onClick={handleConfirm}
                    disabled={!canConfirm || isGenerating}
                    className="w-full py-3 rounded-xl bg-white text-black font-medium text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-all"
                >
                    {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                            />
                            Generating...
                        </span>
                    ) : !hasImages ? (
                        "Upload images first"
                    ) : !colorPalette ? (
                        "Select a color palette"
                    ) : (
                        "Confirm & Generate"
                    )}
                </button>
            </div>
        </div>
    );
}
