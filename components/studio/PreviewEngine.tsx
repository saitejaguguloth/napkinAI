"use client";

import React from "react";

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

interface PreviewEngineProps {
  files: GeneratedFile[];
  techStack: string;
  previewHtml?: string;
  generatedCode?: string;
  isGenerating?: boolean;
}

export default function PreviewEngine({ 
  files, 
  techStack, 
  previewHtml, 
  generatedCode, 
  isGenerating 
}: PreviewEngineProps) {
  const html = generatePreviewHTML(files, techStack, previewHtml, generatedCode);

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden relative">
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <iframe
        title="Preview"
        className="w-full h-full border-none"
        srcDoc={html}
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  );
}

function generatePreviewHTML(
  files: GeneratedFile[], 
  techStack: string, 
  previewHtml?: string, 
  generatedCode?: string
): string {
  // Priority: previewHtml > generatedCode > files
  if (previewHtml) {
    return wrapWithTailwind(previewHtml);
  }

  if (generatedCode) {
    return wrapWithTailwind(generatedCode);
  }

  // Find HTML file in files array
  const htmlFile = files?.find(
    (f) => f.path?.includes("index.html") || f.path?.includes(".html")
  );

  if (htmlFile?.content) {
    return wrapWithTailwind(htmlFile.content);
  }

  // Find main component file for React/Vue/Svelte
  const mainFile = files?.find(
    (f) =>
      f.path?.includes("App") ||
      f.path?.includes("page") ||
      f.path?.includes("index")
  );

  if (mainFile?.content) {
    return wrapWithTailwind(mainFile.content);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
  </style>
</head>
<body>
  <div>
    <h2>No preview available</h2>
    <p>Generate some code to see the preview</p>
  </div>
</body>
</html>`;
}

function wrapWithTailwind(content: string): string {
  // If already has DOCTYPE or html tag, just ensure Tailwind is included
  if (content.includes("<!DOCTYPE") || content.includes("<html")) {
    if (!content.includes("tailwindcss")) {
      return content.replace(
        "<head>",
        '<head><script src="https://cdn.tailwindcss.com"></script>'
      );
    }
    return content;
  }

  // Wrap content in full HTML document
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}
