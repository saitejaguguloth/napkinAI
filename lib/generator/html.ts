// HTML Generator - Single file output

import { GenerationResult, GeneratorConfig, GeneratedFile } from './types';

/**
 * Enhance HTML with essential interactive features
 */
function enhanceInteractivity(html: string): string {
    // Check if it already has scripts
    const hasScript = html.includes('<script');
    
    if (hasScript) {
        return html; // Already has interactivity
    }

    // Add common interactive utilities
    const interactivityScript = `
<script>
// Auto-enhance interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Add ripple effect to buttons
    document.querySelectorAll('button, .btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = \`
                position: absolute;
                width: \${size}px;
                height: \${size}px;
                left: \${x}px;
                top: \${y}px;
                background: rgba(255,255,255,0.5);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            \`;
            
            const style = document.createElement('style');
            if (!document.querySelector('#ripple-style')) {
                style.id = 'ripple-style';
                style.textContent = \`
                    @keyframes ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                \`;
                document.head.appendChild(style);
            }
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Form validation enhancement
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const inputs = this.querySelectorAll('input[required], textarea[required]');
            let valid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.classList.add('border-red-500', 'shake');
                    valid = false;
                    setTimeout(() => input.classList.remove('shake'), 500);
                } else {
                    input.classList.remove('border-red-500');
                }
            });
            
            if (valid) {
                alert('Form submitted successfully! (Demo mode)');
                this.reset();
            }
        });
    });
});
</script>`;

    // Inject before </body> or at end
    if (html.includes('</body>')) {
        return html.replace('</body>', interactivityScript + '\n</body>');
    } else {
        return html + interactivityScript;
    }
}

/**
 * Generate a single-file HTML project.
 * The raw code from Gemini is already complete HTML.
 */
export function generateHTMLProject(
    rawCode: string,
    config: GeneratorConfig
): GenerationResult {
    // Ensure the HTML has proper doctype and structure
    let htmlContent = rawCode.trim();

    // If it's not a complete document, wrap it
    if (!htmlContent.toLowerCase().startsWith('<!doctype')) {
        htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.pageType || 'Generated Page'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Smooth transitions for all interactive elements */
        * {
            transition-duration: 0.2s;
        }
        /* Shake animation for validation */
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        .shake {
            animation: shake 0.5s;
        }
    </style>
</head>
<body>
${rawCode}
</body>
</html>`;
    }

    // Enhance with interactive features
    htmlContent = enhanceInteractivity(htmlContent);

    const files: GeneratedFile[] = [
        {
            path: "index.html",
            content: htmlContent,
            language: "html"
        }
    ];

    return {
        files,
        previewEntry: "index.html",
        framework: "html",
        previewHtml: htmlContent
    };
}
