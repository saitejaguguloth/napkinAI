"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { ImageUploader, PageImage } from "@/components/studio/ImageUploader";
import SandboxedPreview from "@/components/studio/SandboxedPreview";
import SuggestionsPanel, { StudioConfig } from "@/components/studio/SuggestionsPanel";
import { GenerationStep } from "@/components/studio/GenerationProgress";
import ModifyChat from "@/components/studio/ModifyChat";
import ImageLightbox from "@/components/studio/ImageLightbox";
import CodeViewer from "@/components/studio/CodeViewer";
import { IconSave, IconPreview, IconCode, IconSketch, IconText, IconExisting } from "@/components/studio/StudioIcons";
import TextPromptInput from "@/components/studio/TextPromptInput";
import ExistingProjectInput from "@/components/studio/ExistingProjectInput";
import PageFlowInstructions from "@/components/studio/PageFlowInstructions";
import FloatingVoicePanel from "@/components/studio/FloatingVoicePanel";
import type { ProjectStatus } from "@/types/project";

// Flow states
type FlowState = "idle" | "uploaded" | "analyzing" | "analyzed" | "generating" | "generated" | "error";
type InputType = "sketch" | "text" | "existing";

interface LayoutAnalysis {
    pageType: string;
    sections: string[];
    structure: string;
    navigation: string;
    components: string[];
}

interface ModifyMessage {
    id: string;
    type: "user" | "ai" | "system";
    content: string;
    timestamp: Date;
}

// Storage key for persistence
const STORAGE_KEY = "napkin-studio-state";

// Analyze images API call
async function analyzeImages(pages: PageImage[]): Promise<LayoutAnalysis> {
    const response = await fetch("/api/analyze-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            imageBase64: pages[0]?.dataUrl || "",
            mimeType: pages[0]?.mimeType || "image/png",
            pageCount: pages.length,
        }),
    });
    const result = await response.json();
    return result.analysis || {
        pageType: "landing",
        sections: ["Header", "Main Content", "Footer"],
        structure: "Standard layout detected",
        navigation: "topnav",
        components: ["Navigation", "Content sections"],
    };
}

// File structure type
interface GeneratedFile {
    path: string;
    content: string;
    language: string;
}

// Generate with config
async function generateWithConfig(
    pages: PageImage[],
    config: StudioConfig
): Promise<{ code: string; files?: GeneratedFile[]; previewHtml?: string; framework?: string; error?: string }> {
    const response = await fetch("/api/generate-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            imageBase64: pages[0]?.dataUrl || "",
            mimeType: pages[0]?.mimeType || "image/png",
            generationConfig: config,
            pages: pages.map(p => ({ name: p.name, role: p.role })),
        }),
    });
    return response.json();
}

export default function StudioPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

    // Core state
    const [projectId, setProjectId] = useState<string | null>(searchParams.get("project"));
    const [projectName, setProjectName] = useState("Untitled Project");
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Input type state
    const [inputType, setInputType] = useState<InputType>("sketch");
    const [textPrompt, setTextPrompt] = useState("");
    const [pageFlowInstructions, setPageFlowInstructions] = useState("");

    // Flow state
    const [flowState, setFlowState] = useState<FlowState>("idle");

    // Mode state
    const [centerMode, setCenterMode] = useState<"preview" | "code">("preview");
    const [uploadedPages, setUploadedPages] = useState<PageImage[]>([]);

    // Analysis & config state
    const [layoutAnalysis, setLayoutAnalysis] = useState<LayoutAnalysis | null>(null);
    const [studioConfig, setStudioConfig] = useState<StudioConfig | null>(null);
    const [generationStep, setGenerationStep] = useState<GenerationStep>("analyzing");

    // Output state
    const [generatedCode, setGeneratedCode] = useState("");
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const [isModifying, setIsModifying] = useState(false);
    const [modificationHistory, setModificationHistory] = useState<ModifyMessage[]>([]);

    // Lightbox state
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Load project if projectId exists
    useEffect(() => {
        if (projectId && user) {
            loadProject(projectId);
        }
    }, [projectId, user]);

    const loadProject = async (id: string) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/projects/${id}`, {
                headers: {
                    "x-user-id": user.uid,
                },
            });
            const data = await response.json();

            if (data.project) {
                const project = data.project;
                setProjectName(project.name);
                setUploadedPages(project.images);
                setStudioConfig(project.studioConfig);
                setGeneratedCode(project.generatedCode);
                setModificationHistory(project.chatHistory);
                setFlowState(project.status === "draft" ? "analyzed" : "generated");
                setLastSaved(new Date(project.updatedAt));
                if (project.pageFlowInstructions) {
                    setPageFlowInstructions(project.pageFlowInstructions);
                }
            }
        } catch (error) {
            console.error("Failed to load project:", error);
        }
    };

    // Auth check
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/studio");
        }
    }, [user, loading, router]);

    // Load saved state on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.projectName) setProjectName(data.projectName);
                if (data.uploadedPages?.length) {
                    setUploadedPages(data.uploadedPages);
                    setFlowState("uploaded");
                }
                if (data.studioConfig) setStudioConfig(data.studioConfig);
                if (data.generatedCode) {
                    setGeneratedCode(data.generatedCode);
                    setFlowState("generated");
                }
                if (data.modificationHistory) setModificationHistory(data.modificationHistory);
                if (data.lastSaved) setLastSaved(new Date(data.lastSaved));
            } catch (e) {
                console.error("Failed to load saved state:", e);
            }
        }
    }, []);

    // Handle image upload change
    const handlePagesChange = (pages: PageImage[]) => {
        setUploadedPages(pages);
        if (pages.length > 0 && flowState === "idle") {
            setFlowState("uploaded");
        } else if (pages.length === 0) {
            setFlowState("idle");
            setLayoutAnalysis(null);
        }
    };

    // Start analysis
    const handleStartAnalysis = async () => {
        if (uploadedPages.length === 0) return;

        setFlowState("analyzing");
        setErrorMessage("");

        try {
            const analysis = await analyzeImages(uploadedPages);
            setLayoutAnalysis(analysis);
            setFlowState("analyzed");
        } catch {
            setLayoutAnalysis({
                pageType: "landing",
                sections: ["Header", "Main Content", "Footer"],
                structure: "Layout detected",
                navigation: "topnav",
                components: ["Navigation", "Content"],
            });
            setFlowState("analyzed");
        }
    };

    // Handle plan confirmation and generation - PROGRESSIVE STREAMING VERSION
    const handleConfirmPlan = async (config: StudioConfig) => {
        setStudioConfig(config);
        setFlowState("generating");
        setGenerationStep("analyzing");

        try {
            // Use progressive streaming API
            const response = await fetch("/api/generate-progressive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: uploadedPages[0]?.dataUrl || "",
                    mimeType: uploadedPages[0]?.mimeType || "image/png",
                    config: {
                        techStack: config.techStack,
                        colorPalette: config.colorPalette,
                        designSystem: config.designSystem,
                        interactionLevel: config.interactionLevel,
                        features: config.features,
                        pageType: config.pageType,
                        navType: config.navType,
                        pageFlowInstructions: pageFlowInstructions,
                        pages: uploadedPages.map(p => ({ name: p.name, role: p.role })),
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setFlowState("error");
                setErrorMessage(errorData.error || "Generation failed");
                return;
            }

            // Read streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                setFlowState("error");
                setErrorMessage("Streaming not supported");
                return;
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    const data = line.slice(6); // Remove 'data: ' prefix

                    if (data === '[DONE]') {
                        setGenerationStep("complete");
                        setFlowState("generated");
                        setLastSaved(new Date());
                        setCenterMode("preview");
                        continue;
                    }

                    try {
                        const stage = JSON.parse(data);

                        // Update step based on stage
                        if (stage.stage === 'analyzing') {
                            setGenerationStep("analyzing");
                        } else if (stage.stage === 'scaffold') {
                            setGenerationStep("structure");
                            // Show scaffold preview immediately!
                            if (stage.previewHtml) {
                                setPreviewHtml(stage.previewHtml);
                                setCenterMode("preview"); // Switch to preview early
                            }
                            if (stage.code) {
                                setGeneratedCode(stage.code);
                            }
                        } else if (stage.stage === 'styling') {
                            setGenerationStep("styling");
                            // Update with styled preview
                            if (stage.previewHtml) {
                                setPreviewHtml(stage.previewHtml);
                            }
                            if (stage.code) {
                                setGeneratedCode(stage.code);
                            }
                        } else if (stage.stage === 'complete') {
                            setGenerationStep("complete");
                            if (stage.files) {
                                setGeneratedFiles(stage.files);
                            }
                            if (stage.previewHtml) {
                                setPreviewHtml(stage.previewHtml);
                            }
                            if (stage.code) {
                                setGeneratedCode(stage.code);
                            }
                            if (stage.error) {
                                setFlowState("error");
                                setErrorMessage(stage.error);
                                return;
                            }
                            setFlowState("generated");
                            setLastSaved(new Date());
                        }
                    } catch {
                        // Ignore parsing errors for partial chunks
                    }
                }
            }
        } catch (error) {
            setFlowState("error");
            setErrorMessage(error instanceof Error ? error.message : "Generation failed. Please try again.");
        }
    };

    // Handle modification via chat
    const handleModify = async (command: string) => {
        if (!studioConfig || !generatedCode) return;
        setIsModifying(true);

        try {
            const response = await fetch("/api/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    existingCode: generatedCode,
                    command: command,
                }),
            });

            const result = await response.json();

            if (result.code) {
                setGeneratedCode(result.code);
                setLastSaved(new Date());
            }
        } catch (err) {
            console.error("Modify error:", err);
        } finally {
            setIsModifying(false);
        }
    };

    // Save project
    const handleSave = async () => {
        if (!user || !studioConfig) return;

        setIsSaving(true);
        try {
            // Generate thumbnail (simple approach - take first image)
            const thumbnailDataUrl = uploadedPages[0]?.dataUrl || "";

            const projectData = {
                name: projectName,
                status: (generatedCode ? "generated" : "draft") as "generated" | "draft",
                isTemplate: false,
                images: uploadedPages,
                studioConfig,
                generatedCode,
                generatedCodeFiles: {},
                chatHistory: modificationHistory,
                thumbnailDataUrl,
                pageCount: uploadedPages.length,
                techStack: studioConfig.techStack,
                pageFlowInstructions,
            };

            const response = await fetch("/api/projects/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": user.uid,
                },
                body: JSON.stringify({
                    projectId,
                    projectData,
                }),
            });

            const result = await response.json();

            if (result.success && result.projectId) {
                setProjectId(result.projectId);
                setLastSaved(new Date());

                // Update URL with project ID
                if (!projectId) {
                    window.history.replaceState({}, "", `/studio?project=${result.projectId}`);
                }
            }
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (loading) return null;
    if (!user) return null;

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
            {/* ===== TOP BAR (FIXED) ===== */}
            <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/home")}
                        className="text-sm font-medium text-white/60 hover:text-white transition-colors"
                    >
                        NAPKIN
                    </button>
                    <div className="w-px h-4 bg-white/10" />
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="bg-transparent text-sm font-medium text-white/90 focus:outline-none focus:text-white max-w-[200px]"
                    />

                </div>
                <div className="flex items-center gap-4">
                    {/* Flow Status */}
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{
                                opacity: flowState === "analyzing" || flowState === "generating" ? [0.4, 1, 0.4] : 1,
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: flowState === "analyzing" || flowState === "generating" ? Infinity : 0,
                            }}
                            className={`w-1.5 h-1.5 rounded-full ${flowState === "generated" ? "bg-green-400" :
                                flowState === "error" ? "bg-red-400" :
                                    "bg-white/60"
                                }`}
                        />
                        <span className="text-xs text-white/40 capitalize">{flowState}</span>
                    </div>
                    {lastSaved && (
                        <span className="text-xs text-white/30">Saved {formatTime(lastSaved)}</span>
                    )}
                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
                    >
                        <IconSave size={14} />
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </header>

            {/* ===== MAIN CONTENT (3 PANELS) ===== */}
            <div className="flex-1 flex overflow-hidden">
                {/* ===== LEFT PANEL: SUGGESTIONS / CHAT (25%) ===== */}
                <div className="w-1/4 flex-shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
                    {flowState !== "generated" ? (
                        <SuggestionsPanel
                            layoutAnalysis={layoutAnalysis}
                            isAnalyzing={flowState === "analyzing"}
                            isGenerating={flowState === "generating"}
                            onConfirm={handleConfirmPlan}
                            onAnalyze={handleStartAnalysis}
                            hasImages={uploadedPages.length > 0}
                            savedConfig={studioConfig}
                            generationStep={generationStep}
                            inputType={inputType}
                            textPrompt={textPrompt}
                            uploadedPages={uploadedPages.map(p => ({ name: p.name, role: p.role }))}
                        />
                    ) : (
                        <ModifyChat
                            config={studioConfig!}
                            onModify={handleModify}
                            isProcessing={isModifying}
                            modificationHistory={modificationHistory}
                            onHistoryUpdate={setModificationHistory}
                        />
                    )}
                </div>

                {/* ===== CENTER PANEL: PREVIEW / CODE (50%) ===== */}
                <div className="w-1/2 flex-shrink-0 flex flex-col overflow-hidden">
                    {/* Toggle Bar */}
                    <div className="h-12 flex-shrink-0 flex items-center justify-center gap-2 border-b border-white/[0.06] bg-white/[0.02]">
                        <button
                            onClick={() => setCenterMode("preview")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${centerMode === "preview"
                                ? "bg-white text-black"
                                : "text-white/60 hover:text-white"
                                }`}
                        >
                            <IconPreview size={14} />
                            Preview
                        </button>
                        <button
                            onClick={() => setCenterMode("code")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${centerMode === "code"
                                ? "bg-white text-black"
                                : "text-white/60 hover:text-white"
                                }`}
                        >
                            <IconCode size={14} />
                            Code
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {centerMode === "preview" ? (
                            <SandboxedPreview
                                generatedCode={generatedCode}
                                pages={uploadedPages.map(p => ({ id: p.id, name: p.name, role: p.role }))}
                                isGenerating={flowState === "generating"}
                                techStack={studioConfig?.techStack || "html"}
                                files={generatedFiles}
                                previewHtml={previewHtml}
                            />
                        ) : (
                            <CodeViewer
                                code={generatedCode}
                                techStack={studioConfig?.techStack || "html"}
                                files={generatedFiles}
                            />
                        )}
                    </div>
                </div>

                {/* ===== RIGHT PANEL: UPLOAD (25%) ===== */}
                <div className="w-1/4 flex-shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden">
                    <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06]">
                        <h2 className="text-sm font-medium text-white/80">Pages</h2>

                        {/* Input Type Selector */}
                        <div className="flex items-center gap-1 bg-white/[0.05] rounded p-0.5">
                            <button
                                onClick={() => setInputType("sketch")}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${inputType === "sketch"
                                    ? "bg-white text-black"
                                    : "text-white/50 hover:text-white"
                                    }`}
                                title="Upload sketches"
                            >
                                <IconSketch size={12} />
                                Sketch
                            </button>
                            <button
                                onClick={() => setInputType("text")}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${inputType === "text"
                                    ? "bg-white text-black"
                                    : "text-white/50 hover:text-white"
                                    }`}
                                title="Describe with text"
                            >
                                <IconText size={12} />
                                Text
                            </button>
                            <button
                                onClick={() => setInputType("existing")}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${inputType === "existing"
                                    ? "bg-white text-black"
                                    : "text-white/50 hover:text-white"
                                    }`}
                                title="Import existing"
                            >
                                <IconExisting size={12} />
                                Existing
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        {inputType === "sketch" && (
                            <>
                                <ImageUploader
                                    pages={uploadedPages}
                                    onPagesChange={handlePagesChange}
                                    onImageClick={(dataUrl) => setLightboxImage(dataUrl)}
                                    disabled={flowState === "analyzing" || flowState === "generating"}
                                />

                                {/* Page Flow Instructions - only shows when > 1 page */}
                                <PageFlowInstructions
                                    value={pageFlowInstructions}
                                    onChange={setPageFlowInstructions}
                                    disabled={flowState === "analyzing" || flowState === "generating"}
                                    pageCount={uploadedPages.length}
                                />
                            </>
                        )}
                        {inputType === "text" && (
                            <TextPromptInput
                                value={textPrompt}
                                onChange={setTextPrompt}
                                disabled={flowState === "analyzing" || flowState === "generating"}
                            />
                        )}
                        {inputType === "existing" && (
                            <ExistingProjectInput
                                onProjectSelect={(project) => {
                                    setProjectId(project.id);
                                    setProjectName(project.name);
                                }}
                                disabled={flowState === "analyzing" || flowState === "generating"}
                            />
                        )}
                    </div>

                    {/* Error Display */}
                    {errorMessage && (
                        <div className="p-4 border-t border-white/[0.06]">
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-xs text-red-400">{errorMessage}</p>
                                <button
                                    onClick={() => {
                                        setErrorMessage("");
                                        setFlowState("analyzed");
                                    }}
                                    className="mt-2 text-xs text-white/40 hover:text-white underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== IMAGE LIGHTBOX ===== */}
            <AnimatePresence>
                {lightboxImage && (
                    <ImageLightbox
                        imageUrl={lightboxImage}
                        onClose={() => setLightboxImage(null)}
                    />
                )}
            </AnimatePresence>

            {/* ===== FLOATING VOICE PANEL ===== */}
            {flowState === "generated" && (
                <FloatingVoicePanel
                    onCommand={handleModify}
                    isProcessing={isModifying}
                    isVisible={true}
                />
            )}
        </div>
    );
}
