import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";
const VISION_MODEL_NAME = "gemini-2.5-flash";

// Initialize client once
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is not set");
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

/**
 * Generate content using Gemini 2.5 Flash
 * Simple text-only generation using generateContent()
 */
export async function generateContent(
    systemPrompt: string,
    userInput: string
): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: MODEL_NAME });

    // Combine system prompt and user input
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userInput}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return cleanGeneratedCode(text);
}

/**
 * Generate UI code from an image using Gemini 2.5 Flash multimodal
 * Uses generateContent with an array of parts (text instruction + image)
 */
export async function generateFromImage(
    imageBase64: string,
    mimeType: string,
    mode: "exact" | "enhanced" | "production" = "enhanced",
    instruction?: string
): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: VISION_MODEL_NAME });

    // Mode-specific prompts
    const prompts = {
        exact: `You are an image-to-UI transcription engine.

Convert this sketch/wireframe into HTML with Tailwind CSS while preserving the EXACT layout.

ABSOLUTE RULES:
- Do NOT redesign or improve aesthetics
- Do NOT add or remove elements
- Do NOT reorder sections
- Preserve exact positions and alignment
- Treat the sketch as a blueprint

INTERPRETATION:
- Handwritten labels → clean text
- Boxes → div containers
- Buttons → button elements
- Images → gray placeholder blocks

OUTPUT:
- ONLY HTML with Tailwind CSS
- No explanations, markdown, or comments
- No code fences`,

        enhanced: `You are a professional UI designer and frontend engineer.

Convert this sketch into a MODERN, POLISHED website using HTML with Tailwind CSS.

REQUIREMENTS:
1. PRESERVE the layout structure and hierarchy from the sketch
2. ENHANCE with modern design:
   - Apply a professional color palette (dark mode or light mode, infer from context)
   - Use proper typography with font sizes and weights
   - Add shadows, rounded corners, and spacing
   - Include hover states on interactive elements
   - Add subtle CSS transitions (0.2s ease)

3. COMPONENTS:
   - Navigation bars with proper styling
   - Cards with shadows and padding
   - Buttons with hover effects
   - Forms with styled inputs and focus states
   - Professional spacing and margins

4. MAKE IT LOOK LIKE A REAL SAAS PRODUCT

OUTPUT:
- ONLY HTML with Tailwind CSS
- Include inline <style> for any custom CSS transitions
- No explanations, markdown, or code fences`,

        production: `You are an expert frontend engineer creating an INTERACTIVE, PRODUCTION-READY website.

Convert this sketch into a fully functional, animated UI using HTML, Tailwind CSS, and vanilla JavaScript.

REQUIREMENTS:
1. PRESERVE the layout structure from the sketch
2. CREATE REAL INTERACTIVITY:
   - Navigation tabs/links that switch content
   - Modal dialogs that open/close
   - Dropdown menus that toggle
   - Form validation with visual feedback
   - Smooth scroll behaviors

3. ADD ANIMATIONS:
   - Hover effects on all interactive elements
   - Fade-in animations on page load
   - Smooth transitions between states
   - Button click feedback

4. STYLE AS A PREMIUM SAAS:
   - Modern color palette
   - Professional typography
   - Proper shadows and depth
   - Micro-interactions

5. INCLUDE ALL NECESSARY CODE:
   - Inline <style> for custom CSS
   - Inline <script> for JavaScript interactions
   - Event handlers for clicks, hovers, etc.

OUTPUT:
- Complete HTML document with embedded CSS and JS
- All interactions must be functional
- No placeholders or TODO comments
- No explanations or markdown fences`
    };

    const textInstruction = instruction || prompts[mode];

    const result = await model.generateContent([
        textInstruction,
        {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        },
    ]);

    const response = result.response;
    const text = response.text();

    return cleanGeneratedCode(text);
}

/**
 * Strip markdown code fences from generated code
 */
function cleanGeneratedCode(text: string): string {
    let cleaned = text.trim();

    // Remove ```html or ``` wrapper
    const codeBlockMatch = cleaned.match(/^```(?:html)?\n?([\s\S]*?)\n?```$/);
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
    }

    // Fallback: remove leading ``` line if present
    if (cleaned.startsWith("```")) {
        const lines = cleaned.split("\n");
        lines.shift();
        if (lines[lines.length - 1] === "```") {
            lines.pop();
        }
        return lines.join("\n").trim();
    }

    return cleaned;
}

/**
 * Generate with timeout wrapper
 */
export async function generateWithTimeout(
    systemPrompt: string,
    userInput: string,
    timeoutMs: number = 30000
): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
    });

    const generationPromise = generateContent(systemPrompt, userInput);

    return Promise.race([generationPromise, timeoutPromise]);
}

/**
 * Generate from image with timeout wrapper
 */
export async function generateFromImageWithTimeout(
    imageBase64: string,
    mimeType: string,
    mode: "exact" | "enhanced" | "production" = "enhanced",
    instruction?: string,
    timeoutMs: number = 120000
): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
    });

    const generationPromise = generateFromImage(imageBase64, mimeType, mode, instruction);

    return Promise.race([generationPromise, timeoutPromise]);
}

// Plan Selections Interface
export interface PlanSelections {
    colorStyle: string[];
    typography: string[];
    motion: string[];
    imageHandling: string[];
    fidelity: "exact" | "enhanced" | "production";
    extraInstructions: string;
}

/**
 * Build a dynamic prompt from plan selections
 */
function buildPromptFromPlan(selections: PlanSelections): string {
    const parts: string[] = [];

    parts.push(`You are a professional UI designer and frontend engineer.
Convert this sketch into a MODERN, POLISHED website using HTML with Tailwind CSS.

STRICT REQUIREMENTS:`);

    // Color & Style
    if (selections.colorStyle.length > 0) {
        parts.push("\nCOLOR & STYLE:");
        if (selections.colorStyle.includes("bw")) {
            parts.push("- Use ONLY black, white, and grayscale colors");
        }
        if (selections.colorStyle.includes("grayscale")) {
            parts.push("- Use grayscale palette with depth and shadows");
        }
        if (selections.colorStyle.includes("highcontrast")) {
            parts.push("- High contrast modern design with sharp edges");
        }
        if (selections.colorStyle.includes("glass")) {
            parts.push("- Soft glassmorphism with blur effects and transparency");
        }
        if (selections.colorStyle.includes("brutalist")) {
            parts.push("- Sharp brutalist design with bold typography");
        }
        if (selections.colorStyle.includes("saas")) {
            parts.push("- Minimal SaaS aesthetic with clean lines");
        }
        if (selections.colorStyle.includes("editorial")) {
            parts.push("- Editorial/dashboard style with data visualization emphasis");
        }
    }

    // Typography
    if (selections.typography.length > 0) {
        parts.push("\nTYPOGRAPHY:");
        if (selections.typography.includes("system")) {
            parts.push("- Use system UI fonts (font-family: system-ui)");
        }
        if (selections.typography.includes("inter")) {
            parts.push("- Use Inter font from Google Fonts");
        }
        if (selections.typography.includes("geometric")) {
            parts.push("- Use geometric sans-serif fonts (Poppins, Outfit)");
        }
        if (selections.typography.includes("editorial")) {
            parts.push("- Mix serif headings with sans-serif body text");
        }
        if (selections.typography.includes("mono")) {
            parts.push("- Add monospace accents for code/data elements");
        }
    }

    // Motion & Interactions
    if (selections.motion.length > 0) {
        parts.push("\nMOTION & INTERACTIONS:");
        if (selections.motion.includes("hover")) {
            parts.push("- Add elevation/scale on hover (transform: translateY(-2px))");
        }
        if (selections.motion.includes("microInteractions")) {
            parts.push("- Include button micro-interactions and click feedback");
        }
        if (selections.motion.includes("cardLift")) {
            parts.push("- Cards should lift with shadow on hover");
        }
        if (selections.motion.includes("pageTransitions")) {
            parts.push("- Add smooth CSS transitions (0.2s ease)");
        }
        if (selections.motion.includes("skeletons")) {
            parts.push("- Include loading skeleton placeholders");
        }
        if (selections.motion.includes("scrollReveal")) {
            parts.push("- Add scroll-based reveal animations using CSS");
        }
    }

    // Image Handling
    if (selections.imageHandling.length > 0) {
        parts.push("\nIMAGE HANDLING:");
        if (selections.imageHandling.includes("placeholders")) {
            parts.push("- Use realistic placeholder images from https://picsum.photos");
        }
        if (selections.imageHandling.includes("icons")) {
            parts.push("- Generate appropriate SVG icons based on sketch meaning");
        }
        if (selections.imageHandling.includes("grayscaleIllustrations")) {
            parts.push("- Use grayscale illustrations and images");
        }
        if (selections.imageHandling.includes("svgConvert")) {
            parts.push("- Convert drawn icons into clean inline SVG");
        }
    }

    // Fidelity
    parts.push(`\nFIDELITY MODE: ${selections.fidelity.toUpperCase()}`);
    if (selections.fidelity === "exact") {
        parts.push("- Preserve EXACT layout from sketch, no redesign");
    } else if (selections.fidelity === "enhanced") {
        parts.push("- Modernize while keeping structure intact");
    } else {
        parts.push("- Create fully interactive production-ready code with JavaScript");
    }

    // Extra instructions
    if (selections.extraInstructions) {
        parts.push(`\nADDITIONAL REQUIREMENTS:\n${selections.extraInstructions}`);
    }

    parts.push(`\nOUTPUT:
- ONLY HTML with Tailwind CSS (and inline CSS/JS if needed)
- MAKE IT LOOK PREMIUM AND PROFESSIONAL
- No explanations, markdown, or code fences
- Must be complete and functional`);

    return parts.join("\n");
}

/**
 * Generate UI code from image with plan selections
 */
export async function generateFromImageWithPlan(
    imageBase64: string,
    mimeType: string,
    selections: PlanSelections,
    timeoutMs: number = 120000
): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: VISION_MODEL_NAME });

    const prompt = buildPromptFromPlan(selections);

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
    });

    const generationPromise = (async () => {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = result.response;
        const text = response.text();

        return cleanGeneratedCode(text);
    })();

    return Promise.race([generationPromise, timeoutPromise]);
}

// Full Generation Config from PlanChat
export interface GenerationConfig {
    pageType: "dashboard" | "landing" | "auth" | "admin" | "ecommerce" | "portfolio";
    layoutComplexity: "simple" | "medium" | "advanced";
    colorScheme: "bw" | "grayscale" | "highcontrast" | "minimal";
    interactions: "static" | "micro" | "full";
    navType: "sidebar" | "topnav" | "bottomnav" | "none";
    fidelity: "exact" | "enhanced";
    typography: "system" | "inter" | "geometric" | "editorial";
    features: string[];
}

interface PageInfo {
    name: string;
    role: string;
}

/**
 * Build a STRICT prompt that ENFORCES user config options.
 * This is the core of making checkboxes affect output.
 */
function buildStrictPrompt(config: GenerationConfig, pages: PageInfo[]): string {
    const rules: string[] = [];

    // Base instruction
    rules.push(`You are an expert UI developer. Convert this sketch into a complete, functional HTML with Tailwind CSS.`);

    // ===== COLOR SCHEME (STRICTEST ENFORCEMENT) =====
    if (config.colorScheme === "bw") {
        rules.push(`
CRITICAL COLOR RULE - PURE BLACK & WHITE ONLY:
- Use ONLY these colors: #000000, #FFFFFF, #111111, #222222, #333333, #666666, #999999, #CCCCCC, #EEEEEE
- NO other colors allowed. Not even subtle tints.
- Background: black or white only
- Text: black or white contrast
- Borders: grayscale only
- Buttons: black with white text, or white with black text
- Links: use underlines for emphasis, not color
- VIOLATION OF THIS RULE IS A CRITICAL FAILURE`);
    } else if (config.colorScheme === "grayscale") {
        rules.push(`
COLOR: Grayscale with depth
- Use rich grayscale palette with varying depths
- Add shadows and gradients using black/white
- Create visual hierarchy through shade variation
- No colored accents`);
    } else if (config.colorScheme === "highcontrast") {
        rules.push(`
COLOR: High-contrast modern
- Sharp black and white with occasional single accent color
- Maximum contrast between elements
- Bold, striking visual differences`);
    } else if (config.colorScheme === "minimal") {
        rules.push(`
COLOR: Minimal SaaS aesthetic
- Very subtle grayscale palette
- Light backgrounds (#FAFAFA, #F5F5F5)
- Soft shadows and borders
- Single subtle accent color if needed`);
    }

    // ===== FIDELITY MODE =====
    if (config.fidelity === "exact") {
        rules.push(`
LAYOUT FIDELITY: EXACT - PIXEL-FAITHFUL
- Match the sketch EXACTLY
- Preserve every element position, size, spacing
- Do NOT add or remove visual elements
- Do NOT "improve" or "enhance" the design
- Treat the sketch as a blueprint to replicate`);
    } else {
        rules.push(`
LAYOUT FIDELITY: ENHANCED
- Preserve the layout structure and hierarchy
- Upgrade to production-quality UI
- Improve spacing, typography, and visual polish
- Add professional hover states and transitions`);
    }

    // ===== INTERACTIONS =====
    if (config.interactions === "static") {
        rules.push(`
INTERACTIONS: Static only
- No hover effects
- No animations
- No JavaScript
- Pure HTML/CSS layout`);
    } else if (config.interactions === "micro") {
        rules.push(`
INTERACTIONS: Micro-interactions REQUIRED
- Add hover:translate-y-[-2px] on buttons and cards
- Add hover:shadow-lg elevation effects
- Add transition-all duration-200 ease-out on ALL interactive elements
- Add hover:bg-opacity changes on buttons
- Add focus:ring on inputs
- Every button MUST have a visible hover state`);
    } else if (config.interactions === "full") {
        rules.push(`
INTERACTIONS: Full interactive prototype
- Add all micro-interactions
- Include JavaScript for click handlers
- Buttons show loading states on click
- Forms validate on input
- Add scroll-based animations
- Include toast notifications on actions
- Modals should open/close
- MAKE IT FEEL ALIVE`);
    }

    // ===== NAVIGATION =====
    if (config.navType === "sidebar") {
        rules.push(`
NAVIGATION: Sidebar layout
- Fixed left sidebar (w-64 or w-72)
- Main content in remaining space
- Sidebar: dark background with light text
- Include sidebar menu items with icons`);
    } else if (config.navType === "topnav") {
        rules.push(`
NAVIGATION: Top navbar
- Fixed top navigation bar
- Content below with proper padding
- Navigation items horizontal
- Include logo on left, actions on right`);
    } else if (config.navType === "bottomnav") {
        rules.push(`
NAVIGATION: Mobile bottom nav
- Fixed bottom navigation bar
- Icon-based navigation (4-5 items)
- Main content above with proper padding`);
    }

    // ===== TYPOGRAPHY =====
    if (config.typography === "inter") {
        rules.push(`TYPOGRAPHY: Use Inter font. Add: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`);
    } else if (config.typography === "geometric") {
        rules.push(`TYPOGRAPHY: Use geometric sans-serif (Outfit). Add: <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">`);
    } else if (config.typography === "editorial") {
        rules.push(`TYPOGRAPHY: Editorial style. Use serif for headings (Playfair Display), sans-serif for body (Inter).`);
    } else {
        rules.push(`TYPOGRAPHY: Use system-ui font stack: font-family: system-ui, -apple-system, sans-serif`);
    }

    // ===== FEATURES =====
    if (config.features.includes("forms")) {
        rules.push(`FEATURE: Form validation - Add input validation with visual feedback (red borders on error, green on success)`);
    }
    if (config.features.includes("modals")) {
        rules.push(`FEATURE: Modal dialogs - Include a working modal that opens/closes via JavaScript`);
    }
    if (config.features.includes("toasts")) {
        rules.push(`FEATURE: Toast notifications - Add toast function that shows success/error messages`);
    }
    if (config.features.includes("loading")) {
        rules.push(`FEATURE: Loading states - Buttons show spinner/loading text on click`);
    }
    if (config.features.includes("darkmode")) {
        rules.push(`FEATURE: Dark mode toggle - Include a working dark/light mode switch`);
    }
    if (config.features.includes("animations")) {
        rules.push(`FEATURE: Scroll animations - Elements fade in on scroll using IntersectionObserver`);
    }

    // ===== MULTI-PAGE ROUTING =====
    if (pages.length > 1) {
        const pageNames = pages.map(p => p.name.toLowerCase().replace(/\s+/g, '-'));
        rules.push(`
MULTI-PAGE ROUTING:
- This app has ${pages.length} pages: ${pageNames.join(', ')}
- Create internal navigation between pages
- Use data-navigate="pagename" attribute on navigation links/buttons
- Include virtual router script that handles page switching
- NO external navigation - all links stay inside the app
- Wire menu items to correct pages`);
    }

    // ===== OUTPUT REQUIREMENTS =====
    rules.push(`
OUTPUT REQUIREMENTS:
- Complete standalone HTML with embedded CSS and JS
- Use Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- NO external dependencies except fonts
- ALL buttons and links must work (navigate internally or show mock feedback)
- NO placeholder "click me" buttons - every button has a purpose
- NO purple/violet colors
- NO emojis anywhere in the UI
- Use SVG icons only (inline SVG, no icon libraries)
- Output ONLY the HTML code, no markdown fences or explanations`);

    return rules.join('\n\n');
}

/**
 * Generate from image with full config options.
 * This is the main function that makes checkboxes affect output.
 */
export async function generateFromConfigWithPages(
    imageBase64: string,
    mimeType: string,
    config: GenerationConfig,
    pages: PageInfo[],
    timeoutMs: number = 120000
): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: VISION_MODEL_NAME });

    const prompt = buildStrictPrompt(config, pages);

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
    });

    const generationPromise = (async () => {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = result.response;
        const text = response.text();

        return cleanGeneratedCode(text);
    })();

    return Promise.race([generationPromise, timeoutPromise]);
}

// ============================================
// NEW: Generation Config V2 from SuggestionsPanel
// ============================================

interface ColorPaletteInfo {
    id: string;
    name: string;
    colors: string[];
}

export interface GenerationConfigV2 {
    pageType: string;
    navType: "topnav" | "sidebar" | "bottomnav" | "none";
    detectedSections: string[];
    palette: ColorPaletteInfo | null;
    framework: "nextjs" | "react" | "html";
    styling: "tailwind" | "cssmodules" | "vanilla";
    outputLevel: "ui" | "uimock" | "interactive";
    interactions: "static" | "micro" | "full";
}

/**
 * Build strict prompt from SuggestionsPanel config V2
 * CRITICAL: Always outputs valid HTML for iframe preview
 */
function buildPromptFromConfigV2(config: GenerationConfigV2, pages: PageInfo[]): string {
    const rules: string[] = [];

    // ALWAYS output HTML for preview - framework choice only affects style
    rules.push(`You are an expert UI developer. Convert this sketch into a COMPLETE, STANDALONE HTML document.

CRITICAL OUTPUT FORMAT:
- Output a COMPLETE HTML document starting with <!DOCTYPE html>
- Include <html>, <head>, and <body> tags
- Embed ALL CSS in <style> tags in the head
- Embed ALL JavaScript in <script> tags before </body>
- Use Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>
- DO NOT output React, JSX, or any framework-specific code
- The output MUST render directly in a browser without any build step`);

    // Styling
    if (config.styling === "tailwind") {
        rules.push(`STYLING: Use Tailwind CSS utility classes exclusively.`);
    } else if (config.styling === "vanilla") {
        rules.push(`STYLING: Use vanilla CSS in an embedded <style> tag.`);
    }

    // Color Palette (CRITICAL)
    if (config.palette) {
        const colors = config.palette.colors;
        if (config.palette.id === "bw") {
            rules.push(`
CRITICAL COLOR RULE - PURE BLACK & WHITE ONLY:
- Use ONLY: #000000, #FFFFFF, #111111, #222222, #333333, #666666, #999999, #CCCCCC, #EEEEEE
- NO other colors. VIOLATION IS FAILURE.
- Black backgrounds with white text, or white backgrounds with black text.`);
        } else {
            rules.push(`
COLOR PALETTE - USE THESE COLORS ONLY:
Primary: ${colors[0]}
Secondary: ${colors[1]}
Tertiary: ${colors[2]}
Light: ${colors[3]}
Background: ${colors[4]}
- Derive all UI colors from this palette.
- Maintain consistency throughout the design.
- NO purple, violet, or off-palette colors.`);
        }
    }

    // Navigation
    if (config.navType === "sidebar") {
        rules.push(`NAVIGATION: Fixed left sidebar (w-64), dark background. Main content to the right.`);
    } else if (config.navType === "topnav") {
        rules.push(`NAVIGATION: Fixed top navbar with logo left, links center, actions right.`);
    } else if (config.navType === "bottomnav") {
        rules.push(`NAVIGATION: Fixed mobile bottom nav with 4-5 icon buttons.`);
    }

    // Interactions
    if (config.interactions === "static") {
        rules.push(`INTERACTIONS: Static only. No hover effects, no animations, no JavaScript.`);
    } else if (config.interactions === "micro") {
        rules.push(`
INTERACTIONS: Micro-interactions REQUIRED
- hover:translate-y-[-2px] on buttons and cards
- hover:shadow-lg elevation
- transition-all duration-200 ease-out on ALL interactive elements
- focus:ring on inputs`);
    } else if (config.interactions === "full") {
        rules.push(`
INTERACTIONS: Full interactive prototype
- All micro-interactions
- Click handlers with loading states
- Form validation
- Toast notifications
- Working modals if applicable`);
    }

    // Output Level
    if (config.outputLevel === "ui") {
        rules.push(`OUTPUT LEVEL: UI only. Static layout, no mock data.`);
    } else if (config.outputLevel === "uimock") {
        rules.push(`OUTPUT LEVEL: UI + Mock Logic. Include realistic fake data, mock API responses.`);
    } else if (config.outputLevel === "interactive") {
        rules.push(`OUTPUT LEVEL: Interactive Prototype. Full state management, working forms, navigation.`);
    }

    // Multi-page
    if (pages.length > 1) {
        const pageNames = pages.map(p => p.name.toLowerCase().replace(/\s+/g, '-'));
        rules.push(`
MULTI-PAGE: ${pages.length} pages: ${pageNames.join(', ')}
- Use data-navigate="pagename" on links/buttons
- Include virtual router script in <script>
- NO external navigation`);
    }

    // Final output rules - EMPHASIS on HTML output
    rules.push(`
FINAL OUTPUT RULES:
- Output ONLY a complete HTML document (<!DOCTYPE html>...</html>)
- NEVER output React/JSX/components - ONLY plain HTML
- NO emojis
- NO purple/violet colors
- Monochrome SVG icons only (inline SVG)
- ALL buttons must work (use onclick handlers)
- NO markdown code fences
- NO explanations - ONLY the HTML code`);

    return rules.join('\n\n');
}

/**
 * Generate from image with SuggestionsPanel config V2
 */
export async function generateFromConfigV2(
    imageBase64: string,
    mimeType: string,
    config: GenerationConfigV2,
    pages: PageInfo[],
    timeoutMs: number = 120000
): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: VISION_MODEL_NAME });

    const prompt = buildPromptFromConfigV2(config, pages);

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
    });

    const generationPromise = (async () => {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = result.response;
        const text = response.text();

        return cleanGeneratedCode(text);
    })();

    return Promise.race([generationPromise, timeoutPromise]);
}

// ============================================
// NEW: StudioConfig from Restructured Studio
// ============================================

export interface StudioConfig {
    techStack: "nextjs" | "react" | "html" | "vue" | "svelte";
    styling: "tailwind" | "cssmodules" | "vanilla";
    designSystem: "minimal" | "brutalist" | "editorial" | "midnight" | "highcontrast";
    colorPalette: {
        id: string;
        name: string;
        colors: string[];
    };
    interactionLevel: "static" | "micro" | "full";
    features: string[];
    pageType: string;
    navType: "topnav" | "sidebar" | "bottomnav" | "none";
    detectedSections: string[];
}

// Design system color mappings
const DESIGN_SYSTEM_COLORS: Record<string, string[]> = {
    minimal: ["#F5F5F5", "#E0E0E0", "#333333", "#000000", "#FFFFFF"],
    brutalist: ["#000000", "#333333", "#FF0000", "#FFFF00", "#FFFFFF"],
    editorial: ["#1A1A2E", "#16213E", "#0F3460", "#E94560", "#FFFFFF"],
    midnight: ["#0D1117", "#161B22", "#21262D", "#58A6FF", "#C9D1D9"],
    highcontrast: ["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF"],
};

/**
 * Get framework-specific output instructions based on techStack
 */
function getFrameworkOutputInstructions(techStack: string): string {
    switch (techStack) {
        case "html":
            return `CRITICAL OUTPUT FORMAT - HTML:
- Output a COMPLETE HTML document
- MUST start with: <!DOCTYPE html>
- MUST include <html>, <head>, and <body> tags
- Embed ALL CSS in <style> tags inside <head>
- Embed ALL JavaScript in <script> tags before </body>
- Add Tailwind CDN in head: <script src="https://cdn.tailwindcss.com"></script>
- The output MUST be valid HTML that renders directly in a browser

EXAMPLE STRUCTURE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Page Title</title>
</head>
<body>
  <!-- Your UI code here -->
</body>
</html>

DO NOT output just text or links without HTML tags.
DO NOT omit the DOCTYPE, html, head, or body elements.`;

        case "react":
            return `CRITICAL OUTPUT FORMAT - REACT TSX:
- Output a React functional component using TypeScript/TSX syntax
- Start with: export default function App() { return ( ... ); }
- Use Tailwind CSS classes for all styling
- Include useState/useEffect hooks if interactivity is needed
- Use proper JSX syntax (className instead of class, onClick instead of onclick)
- DO NOT include import statements (they will be added by the build system)
- DO NOT wrap in HTML document - just the component code
- Use inline event handlers for interactivity`;

        case "nextjs":
            return `CRITICAL OUTPUT FORMAT - NEXT.JS APP ROUTER:
- Output a Next.js page component using TypeScript/TSX syntax
- If using hooks or event handlers, start with: "use client";
- Then: export default function Page() { return ( ... ); }
- Use Tailwind CSS classes for all styling
- Use proper JSX syntax (className instead of class)
- For images, use standard img tags (not Next.js Image component)
- For links, use standard anchor tags
- DO NOT include import statements
- DO NOT wrap in HTML document - just the component code`;

        case "vue":
            return `CRITICAL OUTPUT FORMAT - VUE 3 SFC:
- Output a Vue 3 Single File Component format
- Structure as: <script setup lang="ts">...</script> <template>...</template> <style scoped>...</style>
- Use Composition API with <script setup>
- Use Tailwind CSS classes for styling
- Include reactive state with ref() or reactive() if needed
- Use @click instead of onclick, :class for dynamic classes
- The <template> section contains the HTML markup`;

        case "svelte":
            return `CRITICAL OUTPUT FORMAT - SVELTE:
- Output a Svelte component format
- Structure as: <script lang="ts">...</script> (HTML markup) <style>...</style>
- Use Tailwind CSS classes for styling
- Include reactive state with let declarations
- Use on:click instead of onclick
- Use {#if} and {#each} for conditionals and loops
- Use $ prefixed variables for reactive declarations`;

        default:
            return `OUTPUT FORMAT: Complete HTML document with Tailwind CSS`;
    }
}

/**
 * Build prompt from StudioConfig (new restructured format)
 * Now generates framework-specific code based on techStack
 */
function buildPromptFromStudioConfig(config: StudioConfig, pages: PageInfo[]): string {
    const rules: string[] = [];

    // Get colors from design system or palette
    const colors = config.colorPalette?.colors || DESIGN_SYSTEM_COLORS[config.designSystem] || DESIGN_SYSTEM_COLORS.minimal;

    // Framework-specific output instructions (THE KEY CHANGE)
    rules.push(`You are an expert UI developer. Convert this sketch into production-ready code.

${getFrameworkOutputInstructions(config.techStack)}`);

    // Color Palette
    if (config.colorPalette?.id === "bw") {
        rules.push(`
CRITICAL COLOR RULE - PURE BLACK & WHITE ONLY:
- Use ONLY: #000000, #FFFFFF, #111111, #222222, #333333, #666666, #999999, #CCCCCC, #EEEEEE
- NO other colors. VIOLATION IS FAILURE.`);
    } else {
        rules.push(`
COLOR PALETTE - USE THESE COLORS:
Primary: ${colors[0]}
Secondary: ${colors[1]}
Accent: ${colors[2]}
Light: ${colors[3]}
Background: ${colors[4]}
- Derive all UI colors from this palette.
- NO purple, violet, or off-palette colors.`);
    }

    // Design System
    if (config.designSystem === "brutalist") {
        rules.push(`DESIGN STYLE: Brutalist - Bold typography, raw aesthetic, high contrast, sharp edges, minimal ornamentation.`);
    } else if (config.designSystem === "minimal") {
        rules.push(`DESIGN STYLE: Minimal SaaS - Clean lines, ample whitespace, subtle shadows, professional and polished.`);
    } else if (config.designSystem === "editorial") {
        rules.push(`DESIGN STYLE: Editorial - Magazine-like layouts, strong typography hierarchy, dramatic imagery.`);
    } else if (config.designSystem === "midnight") {
        rules.push(`DESIGN STYLE: Midnight Dark - Deep dark backgrounds, soft glows, subtle gradients, futuristic feel.`);
    } else if (config.designSystem === "highcontrast") {
        rules.push(`DESIGN STYLE: High Contrast - Maximum contrast between elements, bold color pops, striking visual differences.`);
    }

    // Navigation
    if (config.navType === "sidebar") {
        rules.push(`NAVIGATION: Fixed left sidebar (w-64), dark background. Main content in remaining space.`);
    } else if (config.navType === "topnav") {
        rules.push(`NAVIGATION: Fixed top navbar with logo left, links center, actions right.`);
    } else if (config.navType === "bottomnav") {
        rules.push(`NAVIGATION: Fixed mobile bottom nav with 4-5 icon buttons.`);
    }

    // Interactions
    if (config.interactionLevel === "static") {
        rules.push(`INTERACTIONS: Static only. No hover effects, no animations, no JavaScript/reactivity.`);
    } else if (config.interactionLevel === "micro") {
        rules.push(`
INTERACTIONS: Micro-interactions REQUIRED
- hover:translate-y-[-2px] on buttons and cards
- hover:shadow-lg elevation
- transition-all duration-200 ease-out on ALL interactive elements
- focus:ring on inputs`);
    } else if (config.interactionLevel === "full") {
        rules.push(`
INTERACTIONS: Full interactive prototype
- All micro-interactions
- Click handlers with loading states
- Form validation with visual feedback
- Toast notifications on actions
- Working modals if applicable`);
    }

    // Features
    if (config.features.includes("formValidation")) {
        rules.push(`FEATURE: Form validation with visual feedback (red borders on error, green on success)`);
    }
    if (config.features.includes("toasts")) {
        rules.push(`FEATURE: Toast notification function that shows success/error messages`);
    }
    if (config.features.includes("loading")) {
        rules.push(`FEATURE: Buttons show spinner/loading text on click`);
    }
    if (config.features.includes("modals")) {
        rules.push(`FEATURE: Working modal dialogs that open/close`);
    }
    if (config.features.includes("scrollAnimations")) {
        rules.push(`FEATURE: Elements fade in on scroll`);
    }
    if (config.features.includes("darkMode")) {
        rules.push(`FEATURE: Working dark/light mode toggle`);
    }

    // Multi-page
    if (pages.length > 1) {
        const pageNames = pages.map(p => p.name.toLowerCase().replace(/\s+/g, '-'));
        rules.push(`
MULTI-PAGE: ${pages.length} pages: ${pageNames.join(', ')}
- Include navigation between pages
- NO external navigation`);
    }

    // Final output rules - framework-specific
    const frameworkSpecificRules = config.techStack === "html"
        ? `- Output ONLY a complete HTML document (<!DOCTYPE html>...</html>)
- ALL buttons must work (use onclick handlers)`
        : `- Output ONLY the component code (no HTML document wrapper)
- Use appropriate event handlers for the framework`;

    rules.push(`
FINAL OUTPUT RULES:
${frameworkSpecificRules}
- NO emojis
- NO purple/violet colors
- Monochrome SVG icons only (inline SVG)
- NO markdown code fences
- NO explanations - ONLY the code`);

    return rules.join('\n\n');
}

/**
 * Generate from image with StudioConfig (new restructured format)
 */
export async function generateFromStudioConfig(
    imageBase64: string,
    mimeType: string,
    config: StudioConfig,
    pages: PageInfo[],
    timeoutMs: number = 180000
): Promise<string> {
    const client = getClient();
    const model = client.getGenerativeModel({ model: VISION_MODEL_NAME });

    const prompt = buildPromptFromStudioConfig(config, pages);

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
    });

    const generationPromise = (async () => {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = result.response;
        const text = response.text();

        return cleanGeneratedCode(text);
    })();

    return Promise.race([generationPromise, timeoutPromise]);
}
