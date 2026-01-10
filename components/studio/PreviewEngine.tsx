"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { runReactPreview, getExistingServerUrl, isContainerReady, RuntimeState } from './runtimes';

// Types
interface GeneratedFile {
    path: string;
    content: string;
    language: string;
}

type TechStack = "html" | "react" | "nextjs" | "vue" | "svelte";

interface PreviewEngineProps {
    techStack: TechStack;
    files: GeneratedFile[];
    previewHtml?: string;
    generatedCode?: string;
    isGenerating?: boolean;
}

// Status messages for each phase
const STATUS_ICONS: Record<string, string> = {
    booting: "🔄",
    mounting: "📁",
    installing: "📦",
    starting: "🚀",
    ready: "✅",
    error: "❌",
    idle: "⏳"
};

/**
 * PreviewEngine - Stack-aware preview runtime
 * Uses WebContainer for React/Next.js, static iframe for HTML
 */
export default function PreviewEngine({
    techStack,
    files,
    previewHtml,
    generatedCode,
    isGenerating
}: PreviewEngineProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [runtimeState, setRuntimeState] = useState<RuntimeState>({
        status: 'idle',
        message: 'Waiting for code...',
        progress: 0,
        serverUrl: null,
        error: null
    });
    const [staticHtml, setStaticHtml] = useState<string>("");
    const hasStartedRef = useRef(false);

    // Determine if we should use WebContainer or static rendering
    const useWebContainer = techStack === 'react' || techStack === 'nextjs';

    // Get the main code to preview
    const getMainCode = useCallback(() => {
        if (generatedCode) return generatedCode;

        if (files && files.length > 0) {
            const mainFile = files.find(f =>
                f.path.includes('App.tsx') ||
                f.path.includes('App.jsx') ||
                f.path.includes('page.tsx')
            ) || files[0];
            return mainFile?.content || '';
        }

        return '';
    }, [generatedCode, files]);

    // Handle WebContainer-based preview (React/Next.js)
    useEffect(() => {
        if (!useWebContainer || isGenerating) return;

        const code = getMainCode();
        if (!code) return;

        // Check if we already have a running server
        const existingUrl = getExistingServerUrl();
        if (existingUrl && isContainerReady()) {
            setRuntimeState({
                status: 'ready',
                message: 'Preview ready!',
                progress: 100,
                serverUrl: existingUrl,
                error: null
            });
            return;
        }

        // Prevent double-start
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        // Start WebContainer runtime
        runReactPreview(code, setRuntimeState)
            .then((url) => {
                console.log('[PreviewEngine] Server ready at:', url);
            })
            .catch((error) => {
                console.error('[PreviewEngine] Runtime error:', error);
                hasStartedRef.current = false;
            });
    }, [useWebContainer, getMainCode, isGenerating]);

    // Handle static HTML preview
    useEffect(() => {
        if (useWebContainer) return;

        if (previewHtml) {
            setStaticHtml(previewHtml);
            setRuntimeState({
                status: 'ready',
                message: 'Preview ready!',
                progress: 100,
                serverUrl: null,
                error: null
            });
            return;
        }

        const code = getMainCode();
        if (code) {
            const html = wrapStaticHtml(code, techStack);
            setStaticHtml(html);
            setRuntimeState({
                status: 'ready',
                message: 'Preview ready!',
                progress: 100,
                serverUrl: null,
                error: null
            });
        }
    }, [useWebContainer, previewHtml, getMainCode, techStack]);

    // Render loading state
    if (runtimeState.status !== 'ready' && runtimeState.status !== 'error') {
        return (
            <div className="h-full w-full flex flex-col bg-neutral-900">
                {/* Header with runtime mode */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${runtimeState.status === 'idle' ? 'bg-gray-400' : 'bg-blue-400 animate-pulse'
                            }`} />
                        <span className="text-xs text-white/60">
                            {techStack === 'react' ? 'React Runtime' :
                                techStack === 'nextjs' ? 'Next.js Runtime' :
                                    techStack === 'vue' ? 'Vue Runtime' : 'Static HTML'}
                        </span>
                    </div>
                    {runtimeState.progress > 0 && (
                        <span className="text-xs text-white/40">{runtimeState.progress}%</span>
                    )}
                </div>

                {/* Loading content */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-center max-w-sm">
                        {/* Spinner */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-3 border-white/20 border-t-blue-500 rounded-full mx-auto mb-6"
                        />

                        {/* Status icon and message */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-xl">{STATUS_ICONS[runtimeState.status]}</span>
                            <p className="text-white/80 font-medium">{runtimeState.message}</p>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${runtimeState.progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Status steps */}
                        <div className="mt-6 text-left space-y-2">
                            <StatusStep
                                label="Boot WebContainer"
                                done={runtimeState.progress >= 25}
                                active={runtimeState.status === 'booting'}
                            />
                            <StatusStep
                                label="Mount project files"
                                done={runtimeState.progress >= 40}
                                active={runtimeState.status === 'mounting'}
                            />
                            <StatusStep
                                label="Install dependencies"
                                done={runtimeState.progress >= 70}
                                active={runtimeState.status === 'installing'}
                            />
                            <StatusStep
                                label="Start dev server"
                                done={runtimeState.progress >= 100}
                                active={runtimeState.status === 'starting'}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render error state
    if (runtimeState.status === 'error') {
        return (
            <div className="h-full w-full flex flex-col bg-neutral-900">
                {/* Error header */}
                <div className="px-4 py-3 border-b border-red-500/30 bg-red-500/10 flex items-center gap-2">
                    <span className="text-red-400">❌</span>
                    <span className="text-sm text-red-400 font-medium">Preview Error</span>
                </div>

                {/* Error content */}
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>

                        <h3 className="text-white font-medium mb-2">Failed to start preview</h3>

                        <pre className="text-left bg-black/50 rounded-lg p-4 text-xs text-red-300 font-mono overflow-auto max-h-32 mb-6">
                            {runtimeState.error}
                        </pre>

                        {/* Fallback options */}
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    hasStartedRef.current = false;
                                    const code = getMainCode();
                                    if (code) {
                                        runReactPreview(code, setRuntimeState);
                                    }
                                }}
                                className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition flex items-center justify-center gap-2"
                            >
                                🔄 Retry
                            </button>

                            <button
                                onClick={() => {
                                    // Open in CodeSandbox
                                    const code = getMainCode();
                                    const params = new URLSearchParams({
                                        'file': '/src/App.tsx',
                                    });
                                    window.open(`https://codesandbox.io/p/sandbox/react-new?${params.toString()}`, '_blank');
                                }}
                                className="w-full px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm transition flex items-center justify-center gap-2"
                            >
                                📦 Open in CodeSandbox
                            </button>

                            <button
                                onClick={() => {
                                    // Download as ZIP
                                    console.log('Download ZIP - not implemented yet');
                                }}
                                className="w-full px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 text-sm transition flex items-center justify-center gap-2"
                            >
                                ⬇️ Download Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render preview
    return (
        <div className="h-full w-full relative bg-white">
            {/* Runtime mode indicator */}
            <div className="absolute top-2 right-2 z-10 px-2.5 py-1 bg-black/70 backdrop-blur rounded-full text-[10px] text-white/70 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${useWebContainer ? 'bg-green-400' : 'bg-blue-400'
                    }`} />
                {techStack === 'react' ? 'React Runtime' :
                    techStack === 'nextjs' ? 'Next.js Runtime' :
                        techStack === 'vue' ? 'Vue Runtime' : 'Static HTML'}
            </div>

            {/* Preview iframe */}
            {useWebContainer && runtimeState.serverUrl ? (
                <iframe
                    ref={iframeRef}
                    src={runtimeState.serverUrl}
                    className="w-full h-full border-0"
                    title="React Preview"
                />
            ) : (
                <iframe
                    ref={iframeRef}
                    srcDoc={staticHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-popups allow-forms allow-modals allow-same-origin"
                    title="Preview"
                />
            )}
        </div>
    );
}

// Status step component
function StatusStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
    return (
        <div className={`flex items-center gap-2 text-xs ${done ? 'text-green-400' : active ? 'text-white' : 'text-white/30'
            }`}>
            {done ? (
                <span>✓</span>
            ) : active ? (
                <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                >
                    →
                </motion.span>
            ) : (
                <span>○</span>
            )}
            {label}
        </div>
    );
}

// Wrap static HTML for non-WebContainer stacks
function wrapStaticHtml(code: string, techStack: TechStack): string {
    // Check if already complete HTML
    if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
        if (!code.includes('tailwindcss.com')) {
            return code.replace('<head>', '<head>\n<script src="https://cdn.tailwindcss.com"></script>');
        }
        return code;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<style>
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
</style>
</head>
<body>
${code}
</body>
</html>`;
}
