/**
 * React Vite Project Templates
 * These files are mounted into WebContainer to create a working React app
 */

export const REACT_PACKAGE_JSON = `{
  "name": "napkin-preview",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}`;

export const REACT_VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})`;

export const REACT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NAPKIN Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

export const REACT_MAIN_TSX = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`;

export const REACT_INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}`;

export const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

export const POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

export const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;

export const TSCONFIG_NODE = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`;

/**
 * Generate the complete file system structure for React Vite project
 */
export function generateReactFileSystem(appCode: string) {
    // Clean up the app code for proper module usage
    let cleanAppCode = appCode;

    // Remove 'use client' directive (not needed in Vite)
    cleanAppCode = cleanAppCode.replace(/["']use client["'];?\s*/g, '');

    // Ensure proper imports exist
    if (!cleanAppCode.includes("import React")) {
        cleanAppCode = `import React from 'react';\n${cleanAppCode}`;
    }

    // Add useState/useEffect imports if used but not imported
    const hooks = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext'];
    const usedHooks = hooks.filter(hook =>
        cleanAppCode.includes(hook) && !cleanAppCode.includes(`import { ${hook}`)
    );

    if (usedHooks.length > 0 && !cleanAppCode.includes('{ useState')) {
        cleanAppCode = cleanAppCode.replace(
            /import React from ['"]react['"];?/,
            `import React, { ${usedHooks.join(', ')} } from 'react';`
        );
    }

    // Ensure default export exists
    if (!cleanAppCode.includes('export default')) {
        // Find the component name
        const funcMatch = cleanAppCode.match(/function\s+([A-Z]\w*)\s*\(/);
        const constMatch = cleanAppCode.match(/const\s+([A-Z]\w*)\s*=/);
        const componentName = funcMatch?.[1] || constMatch?.[1] || 'App';

        // Check if component is defined
        if (funcMatch || constMatch) {
            cleanAppCode += `\n\nexport default ${componentName};`;
        }
    }

    return {
        'package.json': {
            file: { contents: REACT_PACKAGE_JSON }
        },
        'vite.config.ts': {
            file: { contents: REACT_VITE_CONFIG }
        },
        'index.html': {
            file: { contents: REACT_INDEX_HTML }
        },
        'tailwind.config.js': {
            file: { contents: TAILWIND_CONFIG }
        },
        'postcss.config.js': {
            file: { contents: POSTCSS_CONFIG }
        },
        'tsconfig.json': {
            file: { contents: TSCONFIG }
        },
        'tsconfig.node.json': {
            file: { contents: TSCONFIG_NODE }
        },
        'src': {
            directory: {
                'main.tsx': {
                    file: { contents: REACT_MAIN_TSX }
                },
                'App.tsx': {
                    file: { contents: cleanAppCode }
                },
                'index.css': {
                    file: { contents: REACT_INDEX_CSS }
                }
            }
        }
    };
}
