// Progressive Pipeline Types

export interface LayoutAnalysis {
    pages: PageStructure[];
    sections: SectionStructure[];
    components: ComponentStructure[];
    routes: string[];
}

export interface PageStructure {
    name: string;
    role: string;
    sections: string[];
}

export interface SectionStructure {
    id: string;
    type: 'hero' | 'nav' | 'features' | 'pricing' | 'cta' | 'footer' | 'form' | 'cards' | 'content';
    content: string;
}

export interface ComponentStructure {
    id: string;
    type: string;
    props: Record<string, unknown>;
}

export interface PipelineStage {
    stage: 'analyzing' | 'scaffold' | 'styling' | 'complete';
    progress: number; // 0-100
    code?: string;
    files?: GeneratedFile[];
    previewHtml?: string;
    error?: string;
}

export interface GeneratedFile {
    path: string;
    content: string;
    language: string;
}

export interface PipelineConfig {
    techStack: 'html' | 'react' | 'nextjs' | 'vue' | 'svelte';
    colorPalette: {
        id: string;
        name: string;
        colors: string[];
    };
    designSystem: string;
    interactionLevel: 'static' | 'micro' | 'full';
    features: string[];
    pageType: string;
    navType: string;
    pageFlowInstructions?: string;
    pages?: { name: string; role: string }[];
    textPrompt?: string; // For text-to-website generation without an image
}

export type PipelineCallback = (stage: PipelineStage) => void;
