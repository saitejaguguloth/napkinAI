"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

// Types
interface GeneratedFile {
    path: string;
    content: string;
    language: string;
}

type TechStack = "html" | "react" | "nextjs" | "vue" | "svelte";
type PreviewStatus = "idle" | "preparing" | "compiling" | "rendering" | "ready" | "error";

interface PreviewEngineProps {
    techStack: TechStack;
    files: GeneratedFile[];
    previewHtml?: string;
    generatedCode?: string;
    isGenerating?: boolean;
}

// Status messages with more detail
const STATUS_MESSAGES: Record<PreviewStatus, { title: string; detail: string }> = {
    idle: { title: "Waiting for code...", detail: "" },
    preparing: { title: "Starting preview server...", detail: "Initializing runtime environment" },
    compiling: { title: "Bundling application...", detail: "Transpiling JSX and processing imports" },
    rendering: { title: "Launching preview...", detail: "Mounting React components" },
    ready: { title: "", detail: "" },
    error: { title: "Preview Error", detail: "" }
};

// Get runtime mode label
function getRuntimeLabel(stack: TechStack): string {
    switch (stack) {
        case "html": return "Static HTML";
        case "react": return "React Runtime";
        case "nextjs": return "Next.js Runtime";
        case "vue": return "Vue Runtime";
        case "svelte": return "Svelte (Static)";
        default: return "Preview";
    }
}

/**
 * Enhanced PreviewEngine - Handles rendering of generated code based on tech stack
 * Now with better error handling, loading states, and runtime indicators
 */
export default function PreviewEngine({
    techStack,
    files,
    previewHtml,
    generatedCode,
    isGenerating
}: PreviewEngineProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [status, setStatus] = useState<PreviewStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [compiledHtml, setCompiledHtml] = useState<string>("");
    const [iframeKey, setIframeKey] = useState(0);

    // Build preview when inputs change
    useEffect(() => {
        if (isGenerating) {
            setStatus("preparing");
            return;
        }

        // If we have previewHtml from API, use it directly
        if (previewHtml) {
            setCompiledHtml(previewHtml);
            setStatus("ready");
            setError(null);
            return;
        }

        // If we have files, compile based on tech stack
        if (files && files.length > 0) {
            compilePreview(techStack, files);
            return;
        }

        // Fallback to generatedCode if available
        if (generatedCode) {
            compileFromCode(techStack, generatedCode);
            return;
        }

        setStatus("idle");
    }, [techStack, files, previewHtml, generatedCode, isGenerating]);

    // Compile preview based on tech stack
    const compilePreview = useCallback(async (stack: TechStack, fileList: GeneratedFile[]) => {
        setStatus("compiling");
        setError(null);

        try {
            // Simulate brief compilation time for UX
            await new Promise(resolve => setTimeout(resolve, 300));

            let html: string;

            switch (stack) {
                case "html":
                    html = compileHtml(fileList);
                    break;
                case "react":
                case "nextjs":
                    html = compileReact(fileList);
                    break;
                case "vue":
                    html = compileVue(fileList);
                    break;
                case "svelte":
                    html = compileSvelte(fileList);
                    break;
                default:
                    html = compileHtml(fileList);
            }

            setStatus("rendering");
            await new Promise(resolve => setTimeout(resolve, 200));

            setCompiledHtml(html);
            setStatus("ready");
            setIframeKey(prev => prev + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Compilation failed");
            setStatus("error");
        }
    }, []);

    // Compile from raw code string
    const compileFromCode = useCallback(async (stack: TechStack, code: string) => {
        setStatus("compiling");
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            let html: string;

            if (stack === "html") {
                html = wrapHtml(code);
            } else if (stack === "react" || stack === "nextjs") {
                html = wrapReactCode(code);
            } else if (stack === "vue") {
                html = wrapVueCode(code);
            } else {
                html = wrapHtml(code);
            }

            setStatus("rendering");
            await new Promise(resolve => setTimeout(resolve, 200));

            setCompiledHtml(html);
            setStatus("ready");
            setIframeKey(prev => prev + 1);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Compilation failed");
            setStatus("error");
        }
    }, []);

    // Render loading state
    if (status === "idle" || status === "preparing" || status === "compiling" || status === "rendering") {
        const { title, detail } = STATUS_MESSAGES[status];
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full mx-auto mb-4"
                    />
                    <p className="text-white/70 text-sm font-medium">{title}</p>
                    {detail && (
                        <p className="text-white/40 text-xs mt-1">{detail}</p>
                    )}
                    <div className="mt-4 px-3 py-1 bg-white/5 rounded-full inline-flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-xs text-white/50">{getRuntimeLabel(techStack)}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Render error state
    if (status === "error") {
        return (
            <div className="h-full w-full flex flex-col bg-neutral-900">
                {/* Error header */}
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 text-xs font-bold">!</span>
                        </div>
                        <span className="text-red-400 text-sm font-medium">Preview Error</span>
                        <span className="text-white/40 text-xs ml-auto">{getRuntimeLabel(techStack)}</span>
                    </div>
                </div>

                {/* Error content */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center max-w-lg">
                        <pre className="text-left bg-black/50 rounded-lg p-4 text-xs text-red-300 font-mono overflow-auto max-h-48 mb-4">
                            {error}
                        </pre>
                        <button
                            onClick={() => generatedCode ? compileFromCode(techStack, generatedCode) : (files.length > 0 ? compilePreview(techStack, files) : null)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm transition"
                        >
                            Retry Compilation
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render preview with runtime indicator
    return (
        <div className="h-full w-full relative">
            {/* Runtime indicator badge */}
            <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white/50 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${techStack === 'html' ? 'bg-green-400' : 'bg-blue-400'}`} />
                {getRuntimeLabel(techStack)}
            </div>

            <iframe
                ref={iframeRef}
                key={iframeKey}
                srcDoc={compiledHtml}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-popups allow-forms allow-modals allow-same-origin"
                title="Preview"
            />
        </div>
    );
}

// ============================================
// COMPILATION FUNCTIONS
// ============================================

function compileHtml(files: GeneratedFile[]): string {
    const htmlFile = files.find(f => f.path.endsWith('.html') || f.path === 'index.html');
    if (htmlFile) {
        let content = htmlFile.content;
        if (!content.includes('tailwindcss.com')) {
            content = content.replace('<head>', '<head>\n<script src="https://cdn.tailwindcss.com"></script>');
        }
        return content;
    }
    return getPlaceholderHtml("No HTML file found");
}

function compileReact(files: GeneratedFile[]): string {
    const mainFile = files.find(f =>
        f.path.includes('App.tsx') ||
        f.path.includes('App.jsx') ||
        f.path.includes('page.tsx') ||
        f.path.includes('page.jsx')
    ) || files.find(f =>
        f.path.endsWith('.tsx') || f.path.endsWith('.jsx')
    );

    if (!mainFile) {
        return getPlaceholderHtml("No React component found");
    }

    return wrapReactCode(mainFile.content);
}

function compileVue(files: GeneratedFile[]): string {
    const vueFile = files.find(f => f.path.endsWith('.vue'));
    if (!vueFile) {
        return getPlaceholderHtml("No Vue component found");
    }
    return wrapVueCode(vueFile.content);
}

function compileSvelte(files: GeneratedFile[]): string {
    const svelteFile = files.find(f => f.path.endsWith('.svelte'));
    if (!svelteFile) {
        return getPlaceholderHtml("No Svelte component found");
    }

    let content = svelteFile.content;
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    content = content.replace(/<style[\s\S]*?<\/style>/gi, '');
    content = content.replace(/\{#[\s\S]*?\}/g, '');
    content = content.replace(/\{\/[\s\S]*?\}/g, '');
    content = content.replace(/\{:[\s\S]*?\}/g, '');
    content = content.replace(/\{[\w.]+\}/g, '...');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<style>body{margin:0}</style>
</head>
<body>
${content}
<div style="position:fixed;bottom:8px;right:8px;background:rgba(0,0,0,0.8);color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;">
Svelte Preview (Static)
</div>
</body>
</html>`;
}

// ============================================
// CODE WRAPPERS
// ============================================

function wrapHtml(code: string): string {
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
</head>
<body>
${code}
</body>
</html>`;
}

function wrapReactCode(code: string): string {
    // Clean up the code for browser execution
    let cleanCode = code;

    // Remove 'use client' directive
    cleanCode = cleanCode.replace(/["']use client["'];?\s*/g, '');

    // Remove TypeScript type annotations (simplified)
    cleanCode = cleanCode.replace(/:\s*React\.\w+(\<[^>]*\>)?/g, '');
    cleanCode = cleanCode.replace(/:\s*(string|number|boolean|any|void|null|undefined)(\[\])?/g, '');
    cleanCode = cleanCode.replace(/<(\w+)\s+extends\s+[^>]+>/g, '<$1>');

    // Remove import statements (comprehensive patterns)
    cleanCode = cleanCode.replace(/^import\s+type\s+.*?;?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\w+\s*,?\s*\{?[^}]*\}?\s*from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');

    // Remove any remaining import lines
    cleanCode = cleanCode.split('\n').filter(line => !line.trim().startsWith('import ')).join('\n');

    // Handle export patterns
    cleanCode = cleanCode.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
    cleanCode = cleanCode.replace(/export\s+default\s+/g, '');
    cleanCode = cleanCode.replace(/export\s+function\s+(\w+)/g, 'function $1');
    cleanCode = cleanCode.replace(/export\s+const\s+/g, 'const ');

    // Find component name
    const funcMatch = cleanCode.match(/function\s+([A-Z]\w*)\s*\(/);
    const arrowMatch = cleanCode.match(/const\s+([A-Z]\w*)\s*=\s*\(/);
    const componentName = funcMatch?.[1] || arrowMatch?.[1] || 'App';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
#root { min-height: 100vh; }
.preview-error {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
    color: #991B1B;
    padding: 16px 20px;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 13px;
    z-index: 9999;
    border-bottom: 2px solid #F87171;
}
.preview-error::before {
    content: '⚠️ ';
}
.preview-loading {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #18181B;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #71717A;
    font-family: system-ui;
}
</style>
</head>
<body>
<div id="root"><div class="preview-loading">Loading React...</div></div>
<script type="text/babel" data-presets="react">
// React hooks from global React
const { 
    useState, useEffect, useRef, useCallback, useMemo, 
    useContext, createContext, Fragment, memo,
    useReducer, useLayoutEffect, useImperativeHandle,
    forwardRef, lazy, Suspense
} = React;

// Mock common packages
const Link = ({ children, href, ...props }) => React.createElement('a', { href: href || '#', ...props }, children);
const Image = ({ src, alt, ...props }) => React.createElement('img', { src, alt, loading: 'lazy', ...props });

// Error boundary wrapper
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('React Error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return React.createElement('div', { className: 'preview-error' },
                'Runtime Error: ' + (this.state.error?.message || 'Unknown error')
            );
        }
        return this.props.children;
    }
}

// Window error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    document.getElementById('root').innerHTML = '<div class="preview-error">JavaScript Error: ' + msg + '</div>';
    return false;
};

try {
${cleanCode}

// Render the app
const rootElement = document.getElementById('root');
rootElement.innerHTML = ''; // Clear loading
const root = ReactDOM.createRoot(rootElement);
root.render(
    React.createElement(ErrorBoundary, null,
        React.createElement(${componentName})
    )
);
} catch (error) {
    console.error('Compilation Error:', error);
    document.getElementById('root').innerHTML = '<div class="preview-error">Compile Error: ' + error.message + '</div>';
}
</script>
</body>
</html>`;
}

function wrapVueCode(code: string): string {
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);

    const template = templateMatch ? templateMatch[1].trim() : '<div>No template</div>';
    let script = scriptMatch ? scriptMatch[1].trim() : '';
    const style = styleMatch ? styleMatch[1].trim() : '';

    script = script.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<style>
body { margin: 0; }
${style}
</style>
</head>
<body>
<div id="app">${template}</div>
<script>
const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

try {
    const app = createApp({
        setup() {
            ${script.replace(/<script[^>]*>|<\/script>/g, '')}
            return {};
        }
    });
    app.mount('#app');
} catch (error) {
    document.getElementById('app').innerHTML = '<div style="padding:20px;color:red;">Error: ' + error.message + '</div>';
    console.error('Vue error:', error);
}
</script>
</body>
</html>`;
}

function getPlaceholderHtml(message: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-100 flex items-center justify-center">
<div class="text-center">
<p class="text-gray-500">${message}</p>
</div>
</body>
</html>`;
}
