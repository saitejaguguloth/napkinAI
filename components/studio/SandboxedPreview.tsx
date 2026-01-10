"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    IconDesktop,
    IconTablet,
    IconMobile,
    IconFullscreen,
    IconClose,
    IconCopy,
    IconDownload,
} from "./StudioIcons";
import PreviewEngine from "./PreviewEngine";

// File type from generator
interface GeneratedFile {
    path: string;
    content: string;
    language: string;
}

interface SandboxedPreviewProps {
    generatedCode: string;
    pages: { id: string; name: string; role: string }[];
    isGenerating: boolean;
    techStack?: "html" | "react" | "nextjs" | "vue" | "svelte";
    files?: GeneratedFile[];
    previewHtml?: string;
}

type DevicePreset = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES = {
    desktop: { width: "100%", height: "100%" },
    tablet: { width: "768px", height: "1024px" },
    mobile: { width: "375px", height: "812px" },
};

/**
 * Injects a virtual router and navigation isolation into the generated HTML
 * This ensures:
 * 1. All links stay inside the sandbox
 * 2. Buttons trigger internal navigation or mock actions
 * 3. No escape to napkin.app routes
 */
function injectVirtualRouter(html: string, pages: { name: string }[]): string {
    const pageNames = pages.map(p => p.name.toLowerCase().replace(/\s+/g, '-'));

    const routerScript = `
<script>
(function() {
    // Virtual Router - Prevents navigation escape
    const PAGES = ${JSON.stringify(pageNames)};
    let currentPage = PAGES[0] || 'home';
    
    // Block all external navigation
    window.addEventListener('click', function(e) {
        const target = e.target.closest('a, button, [data-navigate]');
        if (!target) return;
        
        // Always prevent default for all clicks
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Check for navigation attribute
        const navigateTo = target.getAttribute('data-navigate') || 
                           target.getAttribute('href');
        
        if (navigateTo) {
            // Handle internal navigation only
            if (navigateTo.startsWith('#') || navigateTo.startsWith('/') || PAGES.includes(navigateTo.replace('/', ''))) {
                const pageName = navigateTo.replace(/^[#/]/, '');
                if (PAGES.includes(pageName)) {
                    // Navigate to page section
                    const section = document.querySelector('[data-page="' + pageName + '"]');
                    if (section) {
                        document.querySelectorAll('[data-page]').forEach(s => s.style.display = 'none');
                        section.style.display = 'block';
                        currentPage = pageName;
                    }
                }
            }
            
            // Mock button actions
            if (target.tagName === 'BUTTON' || target.getAttribute('type') === 'submit') {
                mockButtonAction(target);
            }
        } else {
            // Handle buttons without href
            if (target.tagName === 'BUTTON') {
                mockButtonAction(target);
            }
        }
        
        return false;
    }, true);
    
    // Mock button interactions
    function mockButtonAction(button) {
        const text = button.textContent.toLowerCase();
        const originalText = button.textContent;
        
        // Loading state
        button.disabled = true;
        button.style.opacity = '0.7';
        button.textContent = 'Loading...';
        
        setTimeout(function() {
            button.disabled = false;
            button.style.opacity = '1';
            
            // Simulate action completion
            if (text.includes('submit') || text.includes('save')) {
                button.textContent = 'Saved!';
                setTimeout(() => button.textContent = originalText, 1500);
            } else if (text.includes('login') || text.includes('sign')) {
                showToast('Logged in successfully');
                button.textContent = originalText;
            } else {
                button.textContent = originalText;
            }
        }, 800);
    }
    
    // Toast notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#fff;color:#000;padding:12px 24px;border-radius:8px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;animation:fadeIn 0.3s ease';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
    
    // Block form submissions
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn) mockButtonAction(submitBtn);
    }, true);
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
    
    console.log('[NAPKIN] Virtual router initialized. Navigation isolated.');
})();
</script>
`;

    // Inject before </body> or at end
    if (html.includes('</body>')) {
        return html.replace('</body>', routerScript + '</body>');
    }
    return html + routerScript;
}

/**
 * Sanitizes generated HTML to prevent escape attempts
 */
function sanitizeHtml(html: string): string {
    // Remove any target="_blank" or target="_top" that could escape
    let sanitized = html.replace(/target\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: links that might redirect
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

    // Remove window.location assignments
    sanitized = sanitized.replace(/window\.location\s*=|location\.href\s*=/gi, '// blocked: ');

    // Remove window.open calls
    sanitized = sanitized.replace(/window\.open\s*\(/gi, '// blocked: (');

    return sanitized;
}

export default function SandboxedPreview({
    generatedCode,
    pages,
    isGenerating,
    techStack = "html",
    files = [],
    previewHtml = "",
}: SandboxedPreviewProps) {
    const [devicePreset, setDevicePreset] = useState<DevicePreset>("desktop");
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copied, setCopied] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Use PreviewEngine when we have files, previewHtml, or generatedCode
    const useLivePreview = files.length > 0 || previewHtml || generatedCode;

    const getPreviewHtml = useCallback(() => {
        if (!generatedCode) return "";

        // Sanitize and inject virtual router
        let html = sanitizeHtml(generatedCode);
        html = injectVirtualRouter(html, pages);

        return html;
    }, [generatedCode, pages]);

    const handleCopy = async () => {
        if (generatedCode) {
            await navigator.clipboard.writeText(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (generatedCode) {
            const blob = new Blob([generatedCode], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "generated-ui.html";
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const DEVICES = [
        { id: "desktop" as const, icon: IconDesktop },
        { id: "tablet" as const, icon: IconTablet },
        { id: "mobile" as const, icon: IconMobile },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                {/* Device Presets */}
                <div className="flex items-center gap-1">
                    {DEVICES.map((device) => {
                        const Icon = device.icon;
                        return (
                            <button
                                key={device.id}
                                onClick={() => setDevicePreset(device.id)}
                                className={`p-2 rounded-lg transition-colors ${devicePreset === device.id
                                    ? "bg-white/10 text-white"
                                    : "text-white/40 hover:text-white/60"
                                    }`}
                            >
                                <Icon size={16} />
                            </button>
                        );
                    })}
                </div>

                {/* Zoom & Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZoom(Math.max(25, zoom - 25))}
                        className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/60 text-sm"
                    >
                        −
                    </button>
                    <span className="text-xs text-white/40 w-12 text-center">{zoom}%</span>
                    <button
                        onClick={() => setZoom(Math.min(200, zoom + 25))}
                        className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/60 text-sm"
                    >
                        +
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-2" />

                    <button
                        onClick={handleCopy}
                        disabled={!generatedCode}
                        className="p-2 rounded-lg text-white/40 hover:text-white/60 disabled:opacity-30 transition-colors"
                    >
                        <IconCopy size={16} />
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!generatedCode}
                        className="p-2 rounded-lg text-white/40 hover:text-white/60 disabled:opacity-30 transition-colors"
                    >
                        <IconDownload size={16} />
                    </button>
                    <button
                        onClick={() => setIsFullscreen(true)}
                        disabled={!generatedCode}
                        className="p-2 rounded-lg text-white/40 hover:text-white/60 disabled:opacity-30 transition-colors"
                    >
                        <IconFullscreen size={16} />
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-neutral-900/50 flex items-start justify-center p-6">
                {isGenerating ? (
                    <div className="h-full flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full"
                        />
                    </div>
                ) : generatedCode || files.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-lg shadow-2xl overflow-hidden"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: "top center",
                            width: DEVICE_SIZES[devicePreset].width,
                            height: DEVICE_SIZES[devicePreset].height,
                            maxWidth: devicePreset === "desktop" ? "100%" : undefined,
                        }}
                    >
                        {useLivePreview ? (
                            /* PreviewEngine for all stacks */
                            <PreviewEngine
                                techStack={techStack}
                                files={files}
                                previewHtml={previewHtml}
                                generatedCode={generatedCode}
                                isGenerating={isGenerating}
                            />
                        ) : (
                            /* Static iframe for HTML */
                            <iframe
                                ref={iframeRef}
                                srcDoc={getPreviewHtml()}
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-same-origin"
                                title="Preview"
                                style={{ pointerEvents: 'auto' }}
                            />
                        )}
                    </motion.div>
                ) : (
                    <div className="h-full flex items-center justify-center text-white/20">
                        <p className="text-sm">Preview will appear after generation</p>
                    </div>
                )}
            </div>

            {/* Copy Toast */}
            <AnimatePresence>
                {copied && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-6 right-6 px-4 py-2 bg-white text-black text-sm rounded-lg shadow-lg"
                    >
                        Copied to clipboard
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <span className="text-sm text-white/60">Fullscreen Preview</span>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="p-2 rounded-lg text-white/40 hover:text-white transition-colors"
                            >
                                <IconClose size={20} />
                            </button>
                        </div>
                        <div className="flex-1">
                            {useLivePreview ? (
                                <PreviewEngine
                                    techStack={techStack}
                                    files={files}
                                    previewHtml={previewHtml}
                                    generatedCode={generatedCode}
                                    isGenerating={false}
                                />
                            ) : (
                                <iframe
                                    srcDoc={getPreviewHtml()}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts"
                                    title="Fullscreen Preview"
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
