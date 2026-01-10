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

        // If we have previewHtml from API (only for HTML), use it directly
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
            await new Promise(resolve => setTimeout(resolve, 100));

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
                    {detail && <p className="text-white/40 text-xs mt-1">{detail}</p>}
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
                <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 text-xs font-bold">!</span>
                        </div>
                        <span className="text-red-400 text-sm font-medium">Preview Error</span>
                        <span className="text-white/40 text-xs ml-auto">{getRuntimeLabel(techStack)}</span>
                    </div>
                </div>
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

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"></script>
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

    // Remove TypeScript type annotations
    cleanCode = cleanCode.replace(/:\s*React\.\w+(<[^>]*>)?/g, '');
    cleanCode = cleanCode.replace(/:\s*(string|number|boolean|any|void|null|undefined)(\[\])?/g, '');
    cleanCode = cleanCode.replace(/<(\w+)\s+extends\s+[^>]+>/g, '<$1>');
    cleanCode = cleanCode.replace(/:\s*\{[^}]+\}/g, '');
    cleanCode = cleanCode.replace(/:\s*\([^)]+\)\s*=>/g, '');

    // Remove import statements
    cleanCode = cleanCode.replace(/^import\s+type\s+.*?;?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+\w+\s*,?\s*\{?[^}]*\}?\s*from\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
    cleanCode = cleanCode.split('\n').filter(line => !line.trim().startsWith('import ')).join('\n');

    // Handle export patterns - BEFORE finding component name
    cleanCode = cleanCode.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
    cleanCode = cleanCode.replace(/export\s+default\s+/g, '');
    cleanCode = cleanCode.replace(/export\s+function\s+(\w+)/g, 'function $1');
    cleanCode = cleanCode.replace(/export\s+const\s+/g, 'const ');

    // Find component name with multiple patterns
    let componentName = 'App';

    // Pattern 1: function ComponentName()
    const funcMatch = cleanCode.match(/function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
    if (funcMatch?.[1]) {
        componentName = funcMatch[1];
    }

    // Pattern 2: const ComponentName = () =>
    if (componentName === 'App') {
        const arrowMatch = cleanCode.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*\(/);
        if (arrowMatch?.[1]) {
            componentName = arrowMatch[1];
        }
    }

    // Pattern 3: const ComponentName = function
    if (componentName === 'App') {
        const funcExprMatch = cleanCode.match(/const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*function/);
        if (funcExprMatch?.[1]) {
            componentName = funcExprMatch[1];
        }
    }

    // Pattern 4: Look for any function starting with uppercase
    if (componentName === 'App') {
        const anyFuncMatch = cleanCode.match(/(?:function|const)\s+([A-Z]\w*)/);
        if (anyFuncMatch?.[1]) {
            componentName = anyFuncMatch[1];
        }
    }

    // Build the final HTML with proper escaping
    const codeJson = JSON.stringify(cleanCode);

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
    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
    color: #991B1B;
    padding: 16px 20px;
    font-family: monospace;
    font-size: 13px;
    border-bottom: 2px solid #F87171;
    white-space: pre-wrap;
}
.preview-loading {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #18181B;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #71717A;
}
.spinner {
    width: 32px; height: 32px;
    border: 3px solid #333;
    border-top-color: #666;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
<div id="root">
    <div class="preview-loading">
        <div class="spinner"></div>
        <div>Initializing React...</div>
    </div>
</div>
<script>
window.addEventListener('load', function() {
    var root = document.getElementById('root');
    
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof Babel === 'undefined') {
        root.innerHTML = '<div class="preview-error">Failed to load React/Babel CDN. Check internet connection.</div>';
        return;
    }
    
    root.innerHTML = '<div class="preview-loading"><div class="spinner"></div><div>Compiling JSX...</div></div>';
    
    // React hooks
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useCallback = React.useCallback;
    var useMemo = React.useMemo;
    var useContext = React.useContext;
    var createContext = React.createContext;
    var Fragment = React.Fragment;
    var memo = React.memo;
    var useReducer = React.useReducer;
    var useLayoutEffect = React.useLayoutEffect;
    var forwardRef = React.forwardRef;
    
    // Mock Next.js components
    function Link(props) {
        return React.createElement('a', Object.assign({}, props, { href: props.href || '#' }), props.children);
    }
    function Image(props) {
        return React.createElement('img', Object.assign({}, props, { loading: 'lazy' }));
    }
    
    var detectedName = '${componentName}';
    var jsxCode = ${codeJson};
    
    console.log('[Preview] Component name:', detectedName);
    console.log('[Preview] Code preview:', jsxCode.substring(0, 300));
    
    try {
        // Add component export to the code
        var codeWithExport = jsxCode + '\\n\\nwindow.__PREVIEW_COMPONENT__ = ' + detectedName + ';';
        
        console.log('[Preview] Transforming with Babel...');
        var transformed = Babel.transform(codeWithExport, {
            presets: ['react'],
            filename: 'preview.jsx'
        });
        
        console.log('[Preview] Babel successful, executing...');
        root.innerHTML = '<div class="preview-loading"><div class="spinner"></div><div>Mounting...</div></div>';
        
        // Execute the transformed code
        (0, eval)(transformed.code);
        
        var Component = window.__PREVIEW_COMPONENT__;
        console.log('[Preview] Component type:', typeof Component);
        
        if (typeof Component !== 'function') {
            throw new Error('Component "' + detectedName + '" is not a valid React component (got ' + typeof Component + ')');
        }
        
        root.innerHTML = '';
        ReactDOM.createRoot(root).render(React.createElement(Component));
        console.log('[Preview] Render complete!');
        
    } catch (error) {
        console.error('[Preview] Error:', error);
        var msg = error.message || String(error);
        root.innerHTML = '<div class="preview-error">Preview Error: ' + msg + '</div>';
    }
});
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
var createApp = Vue.createApp;
var ref = Vue.ref;
var reactive = Vue.reactive;
var computed = Vue.computed;
var onMounted = Vue.onMounted;
var watch = Vue.watch;

try {
    var app = createApp({
        setup: function() {
            ${script}
            return {};
        }
    });
    app.mount('#app');
} catch (error) {
    document.getElementById('app').innerHTML = '<div style="padding:20px;color:red;">Error: ' + error.message + '</div>';
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
