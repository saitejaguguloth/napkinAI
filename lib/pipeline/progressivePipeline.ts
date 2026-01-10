// Progressive Generation Pipeline
// Generates UI in multiple stages for faster first-paint

import { PipelineStage, PipelineConfig, PipelineCallback, GeneratedFile } from './types';
import { generateForTechStack } from '@/lib/generator';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
}

/**
 * Compress image for faster upload to Gemini
 * Target: Under 1MB base64
 */
export function compressImageForGemini(base64: string, maxSizeKB: number = 800): string {
    // If already small enough, return as-is
    const sizeKB = (base64.length * 0.75) / 1024;
    if (sizeKB <= maxSizeKB) {
        return base64;
    }

    // For server-side, we can't easily resize images
    // Accept the size but log a warning
    console.warn(`Image size (${sizeKB.toFixed(0)}KB) exceeds target (${maxSizeKB}KB). Consider client-side compression.`);
    return base64;
}

/**
 * Stage 1: Analyze layout structure from image
 * Fast pass using Gemini Flash - ~2-3 seconds
 */
async function analyzeLayout(
    imageBase64: string,
    mimeType: string
): Promise<{ sections: string[]; navType: string; pageType: string }> {
    const prompt = `Analyze this UI sketch/design image. Return ONLY a JSON object with:
{
  "sections": ["hero", "features", "pricing", "footer"] // List detected sections
  "navType": "topnav" | "sidebar" | "bottomnav" | "none",
  "pageType": "landing" | "dashboard" | "form" | "blog" | "ecommerce"
}

Be concise. Only JSON, no explanation.`;

    const response = await callGeminiFlash(imageBase64, mimeType, prompt);

    try {
        const parsed = JSON.parse(response);
        return {
            sections: parsed.sections || ['hero', 'content', 'footer'],
            navType: parsed.navType || 'topnav',
            pageType: parsed.pageType || 'landing'
        };
    } catch {
        return { sections: ['hero', 'content', 'footer'], navType: 'topnav', pageType: 'landing' };
    }
}

/**
 * Stage 2: Generate UI scaffold
 * Basic structure with placeholder content - ~5-8 seconds
 */
async function generateScaffold(
    imageBase64: string,
    mimeType: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const hasMultiplePages = config.pages && config.pages.length > 1;

    // Build pages context if available
    const pagesContext = hasMultiplePages
        ? `\n\nMULTIPLE PAGES TO GENERATE:\n${config.pages!.map((p, i) => `- Page ${i + 1}: "${p.name}" (${p.role})`).join('\n')}\n\nYou MUST generate ALL ${config.pages!.length} pages in the output.`
        : '';

    // Build navigation instructions for multi-page
    let navInstructions = '';
    if (hasMultiplePages && config.techStack === 'html') {
        navInstructions = `
MULTI-PAGE IMPLEMENTATION (CRITICAL):
1. Create a wrapper div for EACH page with id="page-1", id="page-2", etc.
2. Only Page 1 should be visible initially (display: block), others hidden (display: none)
3. Add this JavaScript navigation function:
   function showPage(pageNum) {
     document.querySelectorAll('[id^="page-"]').forEach(p => p.style.display = 'none');
     document.getElementById('page-' + pageNum).style.display = 'block';
   }
4. All navigation buttons/links should call showPage(N) onclick
${config.pageFlowInstructions ? `\nNAVIGATION FLOW:\n${config.pageFlowInstructions}` : ''}

Example structure:
<div id="page-1"><!-- Page 1 content --></div>
<div id="page-2" style="display:none"><!-- Page 2 content --></div>
<button onclick="showPage(2)">Get Started</button>`;
    } else if (config.pageFlowInstructions) {
        navInstructions = `\nNAVIGATION FLOW:\n${config.pageFlowInstructions}\n\nIMPORTANT: Implement the navigation logic described above.`;
    }

    const prompt = `Convert this sketch to ${config.techStack === 'html' ? 'HTML' : 'React TSX'} code.
${pagesContext}
REQUIREMENTS:
- ${config.techStack === 'html' ? 'Complete HTML document with Tailwind CDN' : 'React functional component'}
- Include these sections: ${sections.join(', ')}
- Navigation: ${config.navType}
- Use Tailwind CSS for styling
- Basic grayscale colors for now (styling comes later)
- Include placeholder text and structure
${navInstructions}
OUTPUT: Only the complete code, no explanations.`;

    return callGeminiFlash(imageBase64, mimeType, prompt);
}

/**
 * Stage 3: Apply styling and colors
 * Enhance scaffold with full styling - ~5-8 seconds
 */
async function applyStyles(
    scaffoldCode: string,
    config: PipelineConfig
): Promise<string> {
    const colors = config.colorPalette?.colors || ['#000000', '#333333', '#666666', '#FFFFFF', '#F5F5F5'];

    const prompt = `Enhance this ${config.techStack === 'html' ? 'HTML' : 'React'} code with styling:

CURRENT CODE:
${scaffoldCode.slice(0, 8000)} // Limit to avoid token limits

REQUIREMENTS:
- Apply this color palette: Primary=${colors[0]}, Secondary=${colors[1]}, Accent=${colors[2]}
- Design style: ${config.designSystem}
- Add hover effects and transitions
${config.interactionLevel === 'full' ? '- Add click handlers and interactive states' : ''}
- Keep all existing structure
- Use Tailwind classes

OUTPUT: The complete enhanced code, no explanations.`;

    const response = await callGeminiTextOnly(prompt);
    return response || scaffoldCode;
}

/**
 * Call Gemini 1.5 Flash for fast image analysis
 */
async function callGeminiFlash(
    imageBase64: string,
    mimeType: string,
    prompt: string
): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    // Clean base64
    let cleanBase64 = imageBase64;
    if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: cleanBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192,
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini Flash error: ${error}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Call Gemini for text-only prompts
 */
async function callGeminiTextOnly(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 16384,
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini error: ${error}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Main progressive pipeline executor
 * Calls callback with each stage result for streaming updates
 */
export async function runProgressivePipeline(
    imageBase64: string,
    mimeType: string,
    config: PipelineConfig,
    onProgress: PipelineCallback
): Promise<PipelineStage> {
    try {
        // Stage 1: Layout Analysis (~2-3 seconds)
        onProgress({ stage: 'analyzing', progress: 10 });

        const layout = await analyzeLayout(imageBase64, mimeType);

        onProgress({ stage: 'analyzing', progress: 25 });

        // Stage 2: UI Scaffold (~5-8 seconds)
        onProgress({ stage: 'scaffold', progress: 30 });

        const scaffoldCode = await generateScaffold(imageBase64, mimeType, config, layout.sections);

        // Generate preview for scaffold
        const scaffoldFiles = config.techStack === 'html'
            ? [{ path: 'index.html', content: scaffoldCode, language: 'html' }]
            : [{ path: config.techStack === 'react' ? 'src/App.tsx' : 'app/page.tsx', content: scaffoldCode, language: 'typescript' }];

        onProgress({
            stage: 'scaffold',
            progress: 50,
            code: scaffoldCode,
            files: scaffoldFiles,
            previewHtml: generateQuickPreviewHtml(scaffoldCode, config.techStack)
        });

        // Stage 3: Styling Pass (~5-8 seconds)
        onProgress({ stage: 'styling', progress: 60 });

        const styledCode = await applyStyles(scaffoldCode, config);

        onProgress({
            stage: 'styling',
            progress: 80,
            code: styledCode,
            previewHtml: generateQuickPreviewHtml(styledCode, config.techStack)
        });

        // Stage 4: Package into files
        onProgress({ stage: 'complete', progress: 90 });

        const generatorConfig = {
            techStack: config.techStack,
            styling: 'tailwind' as const,
            designSystem: config.designSystem,
            colorPalette: config.colorPalette,
            interactionLevel: config.interactionLevel,
            features: config.features,
            pageType: config.pageType,
            navType: config.navType as 'topnav' | 'sidebar' | 'bottomnav' | 'none',
        };

        const result = await generateForTechStack(config.techStack, styledCode, generatorConfig);

        const finalStage: PipelineStage = {
            stage: 'complete',
            progress: 100,
            code: styledCode,
            files: result.files,
            previewHtml: result.previewHtml || generateQuickPreviewHtml(styledCode, config.techStack)
        };

        onProgress(finalStage);
        return finalStage;

    } catch (error) {
        const errorStage: PipelineStage = {
            stage: 'complete',
            progress: 100,
            error: error instanceof Error ? error.message : 'Pipeline failed'
        };
        onProgress(errorStage);
        return errorStage;
    }
}

/**
 * Generate quick preview HTML for iframe rendering
 */
function generateQuickPreviewHtml(code: string, techStack: string): string {
    if (techStack === 'html') {
        let html = code;

        // Check if it needs DOCTYPE wrapping
        if (!html.toLowerCase().includes('<!doctype')) {
            html = `<!DOCTYPE html>
<html><head>
<script src="https://cdn.tailwindcss.com"></script>
</head><body>${html}</body></html>`;
        }

        // Inject multi-page navigation script if page sections exist
        if (html.includes('id="page-') && !html.includes('function showPage')) {
            const navScript = `
<script>
function showPage(pageNum) {
  document.querySelectorAll('[id^="page-"]').forEach(function(p) { p.style.display = 'none'; });
  var target = document.getElementById('page-' + pageNum);
  if (target) target.style.display = 'block';
}
</script>`;
            // Inject before </body> or at end
            if (html.includes('</body>')) {
                html = html.replace('</body>', navScript + '</body>');
            } else {
                html += navScript;
            }
        }

        return html;
    }

    // For React/Vue/Svelte, render with Babel/CDN
    if (techStack === 'react' || techStack === 'nextjs') {
        // Clean up the code for browser execution
        let cleanCode = code;

        // Remove 'use client' directive
        cleanCode = cleanCode.replace(/["']use client["'];?\s*/g, '');

        // Remove import statements (including multi-line)
        cleanCode = cleanCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
        cleanCode = cleanCode.replace(/^import\s+['"].*?['"];?\s*$/gm, '');
        cleanCode = cleanCode.replace(/^import\s+\{[\s\S]*?\}\s+from\s+['"].*?['"];?\s*$/gm, '');

        // Handle export default patterns
        cleanCode = cleanCode.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
        cleanCode = cleanCode.replace(/export\s+default\s+/g, '');

        // Find component name - look for function declarations starting with uppercase
        const funcMatch = cleanCode.match(/function\s+([A-Z]\w*)\s*\(/);
        const componentName = funcMatch ? funcMatch[1] : 'App';

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
body { margin: 0; }
#root { min-height: 100vh; }
.preview-error {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #FEE2E2;
    color: #991B1B;
    padding: 12px 16px;
    font-family: monospace;
    font-size: 13px;
    z-index: 9999;
}
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="react">
// React hooks from global React
const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext, Fragment } = React;

// Error boundary wrapper
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return React.createElement('div', { className: 'preview-error' },
                'Error: ' + (this.state.error?.message || 'Unknown error')
            );
        }
        return this.props.children;
    }
}

try {
${cleanCode}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    React.createElement(ErrorBoundary, null,
        React.createElement(${componentName})
    )
);
} catch (error) {
    document.getElementById('root').innerHTML = '<div class="preview-error">Compile Error: ' + error.message + '</div>';
    console.error('React compilation error:', error);
}
</script>
</body>
</html>`;
    }

    // Fallback
    return `<!DOCTYPE html>
<html><head>
<script src="https://cdn.tailwindcss.com"></script>
</head><body>
<div class="p-8 text-center text-gray-500">
Preview not available for ${techStack}. Check the Code tab.
</div>
</body></html>`;
}

export type { PipelineStage, PipelineConfig, PipelineCallback };
