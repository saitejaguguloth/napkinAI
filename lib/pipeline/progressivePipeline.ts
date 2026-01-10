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
    // For React/Next.js, generate React code directly
    if (config.techStack === 'react' || config.techStack === 'nextjs') {
        return generateReactScaffold(imageBase64, mimeType, config, sections);
    }
    
    // For Vue/Svelte, generate their native formats
    if (config.techStack === 'vue') {
        return generateVueScaffold(imageBase64, mimeType, config, sections);
    }
    
    if (config.techStack === 'svelte') {
        return generateSvelteScaffold(imageBase64, mimeType, config, sections);
    }
    
    // Default: HTML generation
    return generateHtmlScaffold(imageBase64, mimeType, config, sections);
}

/**
 * Generate React/Next.js scaffold
 */
async function generateReactScaffold(
    imageBase64: string,
    mimeType: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const isNextJs = config.techStack === 'nextjs';
    
    const prompt = `You are a WORLD-CLASS React developer from Vercel or Linear. Look at this sketch and create a STUNNING, PIXEL-PERFECT React component.

ANALYZE THE IMAGE:
- Identify the layout structure (navbar, hero, sections, footer)
- Note the visual hierarchy and spacing
- Understand the content blocks and their purpose
- Recreate the design with MODERN styling

OUTPUT FORMAT - SINGLE REACT COMPONENT:
${isNextJs ? `"use client";

` : ''}import { useState } from 'react';

export default function App() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* YOUR BEAUTIFUL REACT UI HERE */}
        </div>
    );
}

DESIGN SYSTEM - USE THESE EXACT PATTERNS IN JSX:

NAVBAR:
<nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Brand</a>
        <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#" className="text-sm text-slate-300 hover:text-white transition-colors">Pricing</a>
            <button className="bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25">
                Get Started
            </button>
        </div>
        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    </div>
</nav>

HERO SECTION:
<section className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-violet-500/5 to-transparent"></div>
    <div className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-slate-300">Now Available</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
            Build Something<br/>Extraordinary
        </h1>
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The modern platform for creating stunning digital experiences.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                Start Building Free
            </button>
            <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300">
                Watch Demo
            </button>
        </div>
    </div>
</section>

FEATURE CARDS:
<div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 group">
    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
    </div>
    <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
    <p className="text-slate-400 leading-relaxed">Optimized performance that loads in milliseconds.</p>
</div>

SECTIONS TO BUILD: ${sections.join(', ')}

CRITICAL RULES FOR REACT:
1. Use className NOT class
2. Use camelCase for style props: strokeLinecap, strokeWidth, etc.
3. Use {/* */} for JSX comments
4. Close all tags properly (self-closing like <br/>, <img />)
5. Use onChange, onClick handlers properly
6. Use useState for interactive elements
7. ALWAYS use dark theme: bg-slate-950, bg-slate-900, text-white
8. ALWAYS use gradients: bg-gradient-to-r from-blue-500 to-violet-500
9. ALWAYS use glass effects: bg-white/5, backdrop-blur-xl, border-white/10
10. ALWAYS use large text: text-5xl, text-6xl, text-7xl
11. ALWAYS use proper spacing: py-20, py-24, px-6, gap-8
12. ALWAYS use shadows and hover effects

OUTPUT: A COMPLETE, BEAUTIFUL React component. No imports from external libraries (except useState from 'react').

NO EXPLANATIONS. NO MARKDOWN CODE FENCES. JUST THE REACT CODE.`;

    const result = await callGeminiFlash(imageBase64, mimeType, prompt);
    
    // Validate and clean the result
    if (!result || result.length < 200) {
        console.error('Gemini returned empty React response, using fallback');
        return getFallbackReact(sections, config);
    }
    
    let cleanedResult = result;
    
    // Ensure it has export default
    if (!cleanedResult.includes('export default')) {
        cleanedResult = `${isNextJs ? '"use client";\n\n' : ''}import { useState } from 'react';

export default function App() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            ${cleanedResult}
        </div>
    );
}`;
    }
    
    return cleanedResult;
}

/**
 * Generate Vue scaffold
 */
async function generateVueScaffold(
    imageBase64: string,
    mimeType: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const prompt = `You are a WORLD-CLASS Vue.js developer. Look at this sketch and create a STUNNING Vue component.

ANALYZE THE IMAGE AND CREATE A BEAUTIFUL VUE COMPONENT.

OUTPUT FORMAT - VUE SINGLE FILE COMPONENT:
<script setup>
import { ref } from 'vue';

const mobileMenuOpen = ref(false);
</script>

<template>
    <div class="min-h-screen bg-slate-950 text-white">
        <!-- YOUR BEAUTIFUL VUE UI HERE -->
    </div>
</template>

<style>
/* Tailwind is included globally */
</style>

DESIGN SYSTEM - USE DARK THEME:
- bg-slate-950, bg-slate-900 for backgrounds
- text-white, text-slate-300, text-slate-400 for text
- bg-gradient-to-r from-blue-500 to-violet-500 for gradients
- border-white/10, bg-white/5 for glass effects
- Large text: text-5xl, text-6xl, text-7xl
- Proper spacing: py-20, py-24, px-6, gap-8
- Shadows: shadow-xl, shadow-2xl
- Hover effects: hover:scale-105, hover:-translate-y-0.5

SECTIONS TO BUILD: ${sections.join(', ')}

NO EXPLANATIONS. NO MARKDOWN. JUST THE VUE CODE.`;

    const result = await callGeminiFlash(imageBase64, mimeType, prompt);
    
    if (!result || result.length < 200) {
        return getFallbackVue(sections);
    }
    
    return result;
}

/**
 * Generate Svelte scaffold
 */
async function generateSvelteScaffold(
    imageBase64: string,
    mimeType: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const prompt = `You are a WORLD-CLASS Svelte developer. Look at this sketch and create a STUNNING Svelte component.

ANALYZE THE IMAGE AND CREATE A BEAUTIFUL SVELTE COMPONENT.

OUTPUT FORMAT - SVELTE COMPONENT:
<script>
    let mobileMenuOpen = false;
</script>

<div class="min-h-screen bg-slate-950 text-white">
    <!-- YOUR BEAUTIFUL SVELTE UI HERE -->
</div>

<style>
/* Tailwind is included globally */
</style>

DESIGN SYSTEM - USE DARK THEME:
- bg-slate-950, bg-slate-900 for backgrounds
- text-white, text-slate-300, text-slate-400 for text
- bg-gradient-to-r from-blue-500 to-violet-500 for gradients
- Large text: text-5xl, text-6xl, text-7xl

SECTIONS TO BUILD: ${sections.join(', ')}

NO EXPLANATIONS. NO MARKDOWN. JUST THE SVELTE CODE.`;

    const result = await callGeminiFlash(imageBase64, mimeType, prompt);
    
    if (!result || result.length < 200) {
        return getFallbackSvelte(sections);
    }
    
    return result;
}

/**
 * Generate HTML scaffold (original implementation)
 */
async function generateHtmlScaffold(
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
${config.pageFlowInstructions ? `\nNAVIGATION FLOW:\n${config.pageFlowInstructions}` : ''}`;
    } else if (config.pageFlowInstructions) {
        navInstructions = `\nNAVIGATION FLOW:\n${config.pageFlowInstructions}\n\nIMPORTANT: Implement the navigation logic described above.`;
    }

    const prompt = `You are a WORLD-CLASS UI designer from Stripe, Linear, or Vercel. Look at this sketch and create a STUNNING, PIXEL-PERFECT website.

ANALYZE THE IMAGE:
- Identify the layout structure (navbar, hero, sections, footer)
- Note the visual hierarchy and spacing
- Understand the content blocks and their purpose
- Recreate the design with MODERN styling

${pagesContext}

MANDATORY OUTPUT FORMAT - COMPLETE HTML DOCUMENT:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
    </style>
</head>
<body class="bg-slate-950 text-white antialiased">
    <!-- YOUR BEAUTIFUL UI HERE -->
</body>
</html>

DESIGN SYSTEM - USE THESE EXACT PATTERNS:

NAVBAR (REQUIRED):
<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Brand</a>
        <div class="hidden md:flex items-center gap-8">
            <a href="#" class="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
            <a href="#" class="text-sm text-slate-300 hover:text-white transition-colors">Pricing</a>
            <a href="#" class="text-sm text-slate-300 hover:text-white transition-colors">About</a>
            <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/25">Get Started</button>
        </div>
    </div>
</nav>

HERO SECTION (REQUIRED):
<section class="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-violet-500/5 to-transparent"></div>
    <div class="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
        <div class="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
            <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span class="text-sm text-slate-300">Now Available</span>
        </div>
        <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
            Build Something<br/>Extraordinary
        </h1>
        <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The modern platform for creating stunning digital experiences. Fast, beautiful, and built for the future.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300">
                Start Building Free
            </button>
            <button class="bg-white/5 border border-white/10 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300">
                Watch Demo
            </button>
        </div>
    </div>
</section>

FEATURE CARDS:
<div class="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 group">
    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
    </div>
    <h3 class="text-xl font-bold mb-3">Lightning Fast</h3>
    <p class="text-slate-400 leading-relaxed">Optimized performance that loads in milliseconds, not seconds.</p>
</div>

BUTTONS:
<button class="bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-3 rounded-full font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
    Primary Button
</button>

SECTIONS TO BUILD: ${sections.join(', ')}

CRITICAL RULES:
1. ALWAYS include the Tailwind CDN script in <head>
2. ALWAYS use dark theme: bg-slate-950, bg-slate-900, text-white, text-slate-300, text-slate-400
3. ALWAYS use gradients: bg-gradient-to-r, bg-gradient-to-br, from-blue-500 to-violet-500
4. ALWAYS use glass effects: bg-white/5, backdrop-blur-xl, border-white/10
5. ALWAYS use large text: text-5xl, text-6xl, text-7xl for headings
6. ALWAYS use proper spacing: py-20, py-24, px-6, gap-8
7. ALWAYS use shadows: shadow-xl, shadow-2xl, shadow-blue-500/25
8. ALWAYS use rounded corners: rounded-xl, rounded-2xl, rounded-full
9. ALWAYS use hover effects: hover:scale-105, hover:-translate-y-0.5, hover:bg-white/10
10. ALWAYS use transitions: transition-all duration-300

NEVER:
- Use unstyled HTML
- Use default browser styles
- Use bg-white or bg-gray-100
- Use small text (text-sm, text-base)
- Forget Tailwind classes
- Output skeleton/placeholder UI
- Use Lorem ipsum

${navInstructions}

OUTPUT: A COMPLETE, BEAUTIFUL, PRODUCTION-READY HTML document. This should look like a $50,000 startup landing page.

NO EXPLANATIONS. NO MARKDOWN. JUST THE HTML CODE.`;

    const result = await callGeminiFlash(imageBase64, mimeType, prompt);
    
    // Validate result - if empty or too short, return a fallback
    if (!result || result.length < 500) {
        console.error('Gemini returned empty or too short response, using fallback');
        return getFallbackHTML(sections, config);
    }
    
    // Ensure the result has proper HTML structure
    let cleanedResult = result;
    
    // If response doesn't start with <!DOCTYPE, wrap it properly
    if (!cleanedResult.toLowerCase().trim().startsWith('<!doctype')) {
        cleanedResult = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
    </style>
</head>
<body class="bg-slate-950 text-white antialiased">
${cleanedResult}
</body>
</html>`;
    }
    
    // Ensure Tailwind CDN is present
    if (!cleanedResult.includes('tailwindcss.com')) {
        cleanedResult = cleanedResult.replace('<head>', '<head>\n    <script src="https://cdn.tailwindcss.com"></script>');
    }
    
    return cleanedResult;
}

/**
 * Generate fallback HTML if Gemini fails
 */
function getFallbackHTML(sections: string[], config: PipelineConfig): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-lg z-50 border-b border-white/10">
        <div class="container mx-auto px-6 py-4 flex items-center justify-between">
            <a href="#" class="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Brand</a>
            <div class="flex items-center gap-8">
                <a href="#features" class="text-white/70 hover:text-white transition-colors">Features</a>
                <a href="#pricing" class="text-white/70 hover:text-white transition-colors">Pricing</a>
                <a href="#contact" class="text-white/70 hover:text-white transition-colors">Contact</a>
                <button class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-full font-semibold hover:scale-105 transition-transform">Get Started</button>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 pt-20">
        <div class="container mx-auto px-6 text-center">
            <h1 class="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Build Something Amazing
            </h1>
            <p class="text-xl md:text-2xl text-white/70 mb-10 max-w-3xl mx-auto">
                Transform your ideas into reality with our powerful platform. Create stunning experiences that users love.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-purple-500/25 hover:scale-105 hover:shadow-2xl transition-all duration-300">
                    Start Free Trial
                </button>
                <button class="border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300">
                    Watch Demo
                </button>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 bg-black">
        <div class="container mx-auto px-6">
            <h2 class="text-4xl md:text-5xl font-bold text-center mb-16">Powerful Features</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                    <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Lightning Fast</h3>
                    <p class="text-white/60">Optimized for speed. Get results in milliseconds, not seconds.</p>
                </div>
                <div class="bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                    <div class="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Secure by Default</h3>
                    <p class="text-white/60">Enterprise-grade security built into every layer.</p>
                </div>
                <div class="bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                    <div class="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Easy to Use</h3>
                    <p class="text-white/60">Intuitive interface that anyone can master in minutes.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
            <p class="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Join thousands of satisfied customers who are already building amazing things.</p>
            <button class="bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-transform duration-300">
                Start Your Free Trial
            </button>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 bg-black border-t border-white/10">
        <div class="container mx-auto px-6 text-center text-white/60">
            <p>&copy; 2026 Brand. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

/**
 * Generate fallback React if Gemini fails
 */
function getFallbackReact(sections: string[], config: PipelineConfig): string {
    const isNextJs = config.techStack === 'nextjs';
    return `${isNextJs ? '"use client";\n\n' : ''}import { useState } from 'react';

export default function App() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl z-50 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <a href="#" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Brand</a>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
                        <button className="bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/25">
                            Get Started
                        </button>
                    </div>
                    <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-violet-500/5 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="text-sm text-slate-300">Now Available</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
                        Build Something<br/>Extraordinary
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        The modern platform for creating stunning digital experiences. Fast, beautiful, and built for the future.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                            Start Building Free
                        </button>
                        <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all duration-300">
                            Watch Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Powerful Features</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: 'Lightning Fast', desc: 'Optimized for speed', color: 'from-blue-500 to-violet-500' },
                            { title: 'Secure by Default', desc: 'Enterprise-grade security', color: 'from-emerald-500 to-teal-500' },
                            { title: 'Easy to Use', desc: 'Intuitive interface', color: 'from-rose-500 to-pink-500' }
                        ].map((feature, i) => (
                            <div key={i} className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                                <div className={\`w-12 h-12 bg-gradient-to-br \${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg\`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-blue-600 to-violet-600">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
                    <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">Join thousands who are already building amazing things.</p>
                    <button className="bg-white text-violet-600 px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform duration-300">
                        Start Your Free Trial
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-950 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
                    <p>&copy; 2026 Brand. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}`;
}

/**
 * Generate fallback Vue if Gemini fails
 */
function getFallbackVue(sections: string[]): string {
    return `<script setup>
import { ref } from 'vue';

const mobileMenuOpen = ref(false);
</script>

<template>
    <div class="min-h-screen bg-slate-950 text-white">
        <!-- Navigation -->
        <nav class="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl z-50 border-b border-white/10">
            <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <a href="#" class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Brand</a>
                <div class="hidden md:flex items-center gap-8">
                    <a href="#features" class="text-slate-300 hover:text-white transition-colors">Features</a>
                    <a href="#pricing" class="text-slate-300 hover:text-white transition-colors">Pricing</a>
                    <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/25">
                        Get Started
                    </button>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-violet-500/5 to-transparent"></div>
            <div class="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
                <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
                    Build Something<br/>Extraordinary
                </h1>
                <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                    The modern platform for creating stunning digital experiences.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-blue-500/25">
                        Start Building Free
                    </button>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="py-12 bg-slate-950 border-t border-white/10">
            <div class="max-w-7xl mx-auto px-6 text-center text-slate-500">
                <p>&copy; 2026 Brand. All rights reserved.</p>
            </div>
        </footer>
    </div>
</template>`;
}

/**
 * Generate fallback Svelte if Gemini fails
 */
function getFallbackSvelte(sections: string[]): string {
    return `<script>
    let mobileMenuOpen = false;
</script>

<div class="min-h-screen bg-slate-950 text-white">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl z-50 border-b border-white/10">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <a href="#" class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Brand</a>
            <div class="hidden md:flex items-center gap-8">
                <a href="#features" class="text-slate-300 hover:text-white transition-colors">Features</a>
                <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/25">
                    Get Started
                </button>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-violet-500/5 to-transparent"></div>
        <div class="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
            <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
                Build Something<br/>Extraordinary
            </h1>
            <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                The modern platform for creating stunning digital experiences.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-blue-500/25">
                    Start Building Free
                </button>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 bg-slate-950 border-t border-white/10">
        <div class="max-w-7xl mx-auto px-6 text-center text-slate-500">
            <p>&copy; 2026 Brand. All rights reserved.</p>
        </div>
    </footer>
</div>`;
}

/**
 * Stage 3: Apply styling and colors
 * Enhance scaffold with full styling - ~5-8 seconds
 */
async function applyStyles(
    scaffoldCode: string,
    config: PipelineConfig
): Promise<string> {
    // If the scaffold is already well-styled (has gradients and proper classes), skip enhancement
    const hasGoodStyling = scaffoldCode.includes('bg-gradient-to') && 
                          scaffoldCode.includes('rounded-') && 
                          scaffoldCode.includes('shadow-') &&
                          scaffoldCode.includes('hover:');
    
    if (hasGoodStyling && scaffoldCode.length > 2000) {
        console.log('Scaffold already has good styling, skipping enhancement pass');
        return scaffoldCode;
    }

    const prompt = `You are a senior UI engineer at Vercel. Polish this HTML to look STUNNING and PROFESSIONAL.

CURRENT CODE (may be incomplete or poorly styled):
${scaffoldCode.slice(0, 12000)}

YOUR TASK: Return the COMPLETE, POLISHED HTML document.

CRITICAL REQUIREMENTS:
1. Keep the FULL <!DOCTYPE html> structure
2. Keep the Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use DARK THEME: bg-slate-950, bg-slate-900, text-white
4. Use GRADIENTS: bg-gradient-to-r from-blue-500 to-violet-500
5. Use GLASS EFFECTS: bg-white/5, backdrop-blur-xl, border-white/10
6. Use LARGE TEXT: text-5xl, text-6xl, text-7xl for headings
7. Use PROPER SPACING: py-20, py-24, px-6, gap-8
8. Use SHADOWS: shadow-xl, shadow-2xl, shadow-blue-500/25
9. Use ROUNDED CORNERS: rounded-xl, rounded-2xl, rounded-full
10. Use HOVER EFFECTS: hover:-translate-y-0.5, hover:scale-105
11. Use TRANSITIONS: transition-all duration-300

DESIGN SYSTEM: ${config.designSystem || 'minimal'}

OUTPUT: The COMPLETE polished HTML document. No explanations, no markdown, just code.`;

    const response = await callGeminiTextOnly(prompt);
    
    if (!response || response.length < scaffoldCode.length * 0.5) {
        // Enhancement failed or returned less code, keep original
        return scaffoldCode;
    }
    
    // Ensure result has proper structure
    let result = response;
    if (!result.toLowerCase().includes('<!doctype')) {
        return scaffoldCode; // Keep original if enhancement broke the structure
    }
    
    // Ensure Tailwind CDN is present
    if (!result.includes('tailwindcss.com')) {
        result = result.replace('<head>', '<head>\n    <script src="https://cdn.tailwindcss.com"></script>');
    }
    
    return result;
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
                    temperature: 0.8,
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
    let result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up markdown code fences if present (all common types)
    result = result.replace(/```(?:html|tsx|jsx|typescript|javascript|vue|svelte|css|json)\n?/gi, '');
    result = result.replace(/```\n?/g, '');
    result = result.trim();
    
    console.log('Gemini response length:', result.length);
    console.log('Gemini response preview:', result.slice(0, 500));
    
    return result;
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
                    temperature: 0.8,
                    maxOutputTokens: 8192,
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini error: ${error}`);
    }

    const data: GeminiResponse = await response.json();
    let result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up markdown code fences if present (all common types)
    result = result.replace(/```(?:html|tsx|jsx|typescript|javascript|vue|svelte|css|json)\n?/gi, '');
    result = result.replace(/```\n?/g, '');
    result = result.trim();
    
    return result;
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
            // Only send previewHtml for HTML - let PreviewEngine handle React/Next.js
            previewHtml: config.techStack === 'html' ? generateQuickPreviewHtml(scaffoldCode, config.techStack) : undefined
        });

        // Stage 3: Styling Pass (~5-8 seconds)
        onProgress({ stage: 'styling', progress: 60 });

        const styledCode = await applyStyles(scaffoldCode, config);

        onProgress({
            stage: 'styling',
            progress: 80,
            code: styledCode,
            // Only send previewHtml for HTML - let PreviewEngine handle React/Next.js
            previewHtml: config.techStack === 'html' ? generateQuickPreviewHtml(styledCode, config.techStack) : undefined
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
            // Only send previewHtml for HTML - PreviewEngine handles React/Next.js better
            previewHtml: config.techStack === 'html'
                ? (result.previewHtml || generateQuickPreviewHtml(styledCode, config.techStack))
                : undefined
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
 * Text-to-Website Pipeline
 * Generates a website from a text description (no image required)
 */
export async function runTextToWebsitePipeline(
    config: PipelineConfig,
    onProgress: PipelineCallback
): Promise<PipelineStage> {
    try {
        const textPrompt = config.textPrompt || '';
        
        if (!textPrompt || textPrompt.trim().length < 10) {
            throw new Error('Text prompt is required for text-to-website generation');
        }

        // Stage 1: Analyzing prompt
        onProgress({ stage: 'analyzing', progress: 10 });

        // Analyze the text to determine sections
        const promptLower = textPrompt.toLowerCase();
        let sections = ['hero', 'features', 'cta', 'footer'];
        
        if (promptLower.includes('dashboard')) {
            sections = ['sidebar', 'header', 'stats', 'charts', 'table'];
        } else if (promptLower.includes('ecommerce') || promptLower.includes('product')) {
            sections = ['header', 'hero', 'products', 'categories', 'footer'];
        } else if (promptLower.includes('blog')) {
            sections = ['header', 'featured', 'articles', 'footer'];
        } else if (promptLower.includes('login') || promptLower.includes('auth')) {
            sections = ['auth-form'];
        } else if (promptLower.includes('pricing')) {
            sections = ['hero', 'pricing', 'features', 'faq', 'footer'];
        }

        onProgress({ stage: 'analyzing', progress: 25 });

        // Stage 2: Generate scaffold from text
        onProgress({ stage: 'scaffold', progress: 30 });

        const scaffoldCode = await generateTextBasedScaffold(textPrompt, config, sections);

        const scaffoldFiles = config.techStack === 'html'
            ? [{ path: 'index.html', content: scaffoldCode, language: 'html' }]
            : [{ path: config.techStack === 'react' ? 'src/App.tsx' : 'app/page.tsx', content: scaffoldCode, language: 'typescript' }];

        onProgress({
            stage: 'scaffold',
            progress: 50,
            code: scaffoldCode,
            files: scaffoldFiles,
            previewHtml: config.techStack === 'html' ? generateQuickPreviewHtml(scaffoldCode, config.techStack) : undefined
        });

        // Stage 3: Styling Pass
        onProgress({ stage: 'styling', progress: 60 });

        const styledCode = await applyStyles(scaffoldCode, config);

        onProgress({
            stage: 'styling',
            progress: 80,
            code: styledCode,
            previewHtml: config.techStack === 'html' ? generateQuickPreviewHtml(styledCode, config.techStack) : undefined
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
            previewHtml: config.techStack === 'html'
                ? (result.previewHtml || generateQuickPreviewHtml(styledCode, config.techStack))
                : undefined
        };

        onProgress(finalStage);
        return finalStage;

    } catch (error) {
        const errorStage: PipelineStage = {
            stage: 'complete',
            progress: 100,
            error: error instanceof Error ? error.message : 'Text-to-website pipeline failed'
        };
        onProgress(errorStage);
        return errorStage;
    }
}

/**
 * Generate scaffold from text description (no image)
 */
async function generateTextBasedScaffold(
    textPrompt: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    // Route to appropriate generator based on tech stack
    if (config.techStack === 'react' || config.techStack === 'nextjs') {
        return generateTextBasedReactScaffold(textPrompt, config, sections);
    }
    if (config.techStack === 'vue') {
        return generateTextBasedVueScaffold(textPrompt, config, sections);
    }
    if (config.techStack === 'svelte') {
        return generateTextBasedSvelteScaffold(textPrompt, config, sections);
    }
    // Default: HTML
    return generateTextBasedHtmlScaffold(textPrompt, config, sections);
}

/**
 * Generate HTML from text description
 */
async function generateTextBasedHtmlScaffold(
    textPrompt: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const prompt = `You are a WORLD-CLASS UI designer from Stripe, Linear, or Vercel. Create a STUNNING, PIXEL-PERFECT website based on this description:

USER REQUEST: "${textPrompt}"

MANDATORY OUTPUT FORMAT - COMPLETE HTML DOCUMENT:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white antialiased">
    <!-- YOUR BEAUTIFUL UI HERE -->
</body>
</html>

DESIGN SYSTEM - USE THESE EXACT PATTERNS:

NAVBAR:
<nav class="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Brand</a>
        <div class="hidden md:flex items-center gap-8">
            <a href="#" class="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
            <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/25">Get Started</button>
        </div>
    </div>
</nav>

HERO SECTION:
<section class="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-violet-500/5 to-transparent"></div>
    <div class="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
        <h1 class="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Your Headline Here
        </h1>
        <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Your description here
        </p>
        <button class="bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-4 rounded-full font-semibold text-lg shadow-xl shadow-blue-500/25">
            Call to Action
        </button>
    </div>
</section>

FEATURE CARDS:
<div class="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl mb-6"></div>
    <h3 class="text-xl font-bold mb-3">Feature Title</h3>
    <p class="text-slate-400">Feature description</p>
</div>

SECTIONS TO INCLUDE: ${sections.join(', ')}

CRITICAL RULES:
1. ALWAYS include Tailwind CDN
2. ALWAYS use dark theme: bg-slate-950, text-white
3. ALWAYS use gradients: from-blue-500 to-violet-500
4. ALWAYS use glass effects: bg-white/5, backdrop-blur-xl
5. ALWAYS use large text for headings: text-5xl, text-6xl
6. ALWAYS use proper spacing: py-20, px-6, gap-8
7. ALWAYS use shadows and hover effects
8. CREATE REAL CONTENT based on the user's description - NOT Lorem ipsum

OUTPUT: A COMPLETE, BEAUTIFUL HTML document. No explanations, no markdown.`;

    const result = await callGeminiTextOnly(prompt);
    
    if (!result || result.length < 500) {
        return getFallbackHTML(sections, config);
    }
    
    let cleanedResult = result;
    if (!cleanedResult.toLowerCase().trim().startsWith('<!doctype')) {
        cleanedResult = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white antialiased">
${cleanedResult}
</body>
</html>`;
    }
    
    if (!cleanedResult.includes('tailwindcss.com')) {
        cleanedResult = cleanedResult.replace('<head>', '<head>\n    <script src="https://cdn.tailwindcss.com"></script>');
    }
    
    return cleanedResult;
}

/**
 * Generate React from text description
 */
async function generateTextBasedReactScaffold(
    textPrompt: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const isNextJs = config.techStack === 'nextjs';
    
    const prompt = `You are a WORLD-CLASS React developer. Create a STUNNING React component based on this description:

USER REQUEST: "${textPrompt}"

OUTPUT FORMAT - SINGLE REACT COMPONENT:
${isNextJs ? '"use client";\n\n' : ''}import { useState } from 'react';

export default function App() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* YOUR BEAUTIFUL UI */}
        </div>
    );
}

DESIGN SYSTEM:
- Dark theme: bg-slate-950, bg-slate-900, text-white
- Gradients: bg-gradient-to-r from-blue-500 to-violet-500
- Glass effects: bg-white/5, backdrop-blur-xl, border-white/10
- Large text: text-5xl, text-6xl, text-7xl
- Proper spacing: py-20, px-6, gap-8

SECTIONS TO INCLUDE: ${sections.join(', ')}

RULES:
1. Use className NOT class
2. Use camelCase for SVG props
3. Use useState for interactive elements
4. CREATE REAL CONTENT based on the description
5. Use SVG icons inline

OUTPUT: A COMPLETE React component. No explanations, no markdown.`;

    const result = await callGeminiTextOnly(prompt);
    
    if (!result || result.length < 200) {
        return getFallbackReact(sections, config);
    }
    
    let cleanedResult = result;
    if (!cleanedResult.includes('export default')) {
        cleanedResult = `${isNextJs ? '"use client";\n\n' : ''}import { useState } from 'react';

export default function App() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            ${cleanedResult}
        </div>
    );
}`;
    }
    
    return cleanedResult;
}

/**
 * Generate Vue from text description
 */
async function generateTextBasedVueScaffold(
    textPrompt: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const prompt = `You are a WORLD-CLASS Vue developer. Create a STUNNING Vue component based on this description:

USER REQUEST: "${textPrompt}"

OUTPUT FORMAT - VUE SFC:
<script setup>
import { ref } from 'vue';
const mobileMenuOpen = ref(false);
</script>

<template>
    <div class="min-h-screen bg-slate-950 text-white">
        <!-- YOUR UI -->
    </div>
</template>

SECTIONS TO INCLUDE: ${sections.join(', ')}

OUTPUT: A COMPLETE Vue SFC. No explanations, no markdown.`;

    const result = await callGeminiTextOnly(prompt);
    
    if (!result || result.length < 200) {
        return getFallbackVue(sections);
    }
    
    return result;
}

/**
 * Generate Svelte from text description
 */
async function generateTextBasedSvelteScaffold(
    textPrompt: string,
    config: PipelineConfig,
    sections: string[]
): Promise<string> {
    const prompt = `You are a WORLD-CLASS Svelte developer. Create a STUNNING Svelte component based on this description:

USER REQUEST: "${textPrompt}"

OUTPUT FORMAT - SVELTE COMPONENT:
<script>
    let mobileMenuOpen = false;
</script>

<div class="min-h-screen bg-slate-950 text-white">
    <!-- YOUR UI -->
</div>

SECTIONS TO INCLUDE: ${sections.join(', ')}

OUTPUT: A COMPLETE Svelte component. No explanations, no markdown.`;

    const result = await callGeminiTextOnly(prompt);
    
    if (!result || result.length < 200) {
        return getFallbackSvelte(sections);
    }
    
    return result;
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
