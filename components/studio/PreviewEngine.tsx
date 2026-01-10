"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

type TechStack = "html" | "react" | "nextjs" | "vue" | "svelte";

interface PreviewEngineProps {
  techStack: TechStack;
  files: GeneratedFile[];
  previewHtml?: string;
  generatedCode?: string;
  isGenerating?: boolean;
}

interface RuntimeState {
  status: "idle" | "loading" | "ready" | "error";
  message: string;
  error: string | null;
}

export default function PreviewEngine({
  techStack,
  files,
  previewHtml,
  generatedCode,
  isGenerating,
}: PreviewEngineProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    status: "idle",
    message: "Waiting for code...",
    error: null,
  });
  const [staticHtml, setStaticHtml] = useState<string>("");

  const getMainCode = useCallback(() => {
    if (generatedCode) return generatedCode;
    if (previewHtml) return previewHtml;
    const mainFile = files.find(
      (f) =>
        f.path.includes("index") ||
        f.path.includes("page") ||
        f.path.includes("App") ||
        f.path.includes("main")
    );
    return mainFile?.content || files[0]?.content || "";
  }, [generatedCode, previewHtml, files]);

  const cleanForBrowser = useCallback((code: string): string => {
    if (!code) return "";
    let cleaned = code;
    cleaned = cleaned
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
      .replace(/<[A-Z]\w*(\s*,\s*[A-Z]\w*)*>/g, "")
      .replace(/(\([\w\s,]*)\s*:\s*[\w<>\[\]|&\s]+(?=[,\)])/g, "$1")
      .replace(/\)\s*:\s*[\w<>\[\]|&\s]+\s*(?=[{=>])/g, ") ")
      .replace(/\s+as\s+[\w<>\[\]|&\s]+/g, "")
      .replace(/\s+as\s+const/g, "");
    cleaned = cleaned.replace(
      /import\s+type\s+.*?from\s+['"][^'"]+['"];?\n?/g,
      ""
    );
    return cleaned;
  }, []);

  const buildStaticPreview = useCallback(
    (code: string) => {
      if (!code) {
        setStaticHtml(
          '<!DOCTYPE html><html><head><style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-align:center;}</style></head><body><div><h2>Waiting for code...</h2><p>Generate some code to see the preview</p></div></body></html>'
        );
        return;
      }

      setRuntimeState({
        status: "loading",
        message: "Building " + techStack + " preview...",
        error: null,
      });

      try {
        let html = "";

        if (techStack === "html") {
          if (code.includes("<!DOCTYPE") || code.includes("<html")) {
            html = code;
          } else {
            html =
              '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><\/script><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:system-ui,-apple-system,sans-serif;}</style></head><body>' +
              code +
              "</body></html>";
          }
        } else if (techStack === "react" || techStack === "nextjs") {
          html = buildReactPreview(code);
        } else if (techStack === "vue") {
          html = buildVuePreview(code);
        } else if (techStack === "svelte") {
          html = buildSveltePreview(code);
        }

        html = injectVirtualRouter(html);
        setStaticHtml(html);
        setRuntimeState({ status: "ready", message: "Preview ready", error: null });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        setRuntimeState({
          status: "error",
          message: "Failed to build preview",
          error: errMsg,
        });
        setStaticHtml(buildErrorHtml(errMsg));
      }
    },
    [techStack]
  );

  const buildReactPreview = (code: string): string => {
    const cleanedCode = cleanForBrowser(code);
    return (
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>React Preview</title><script src="https://cdn.tailwindcss.com"><\/script><script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script><script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script><script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Inter",system-ui,sans-serif;}</style></head><body><div id="root"></div><script type="text/babel" data-presets="react">' +
      "const motion={div:({children,...props})=>React.createElement('div',props,children),section:({children,...props})=>React.createElement('section',props,children),button:({children,...props})=>React.createElement('button',props,children),span:({children,...props})=>React.createElement('span',props,children),p:({children,...props})=>React.createElement('p',props,children),h1:({children,...props})=>React.createElement('h1',props,children),h2:({children,...props})=>React.createElement('h2',props,children),h3:({children,...props})=>React.createElement('h3',props,children),nav:({children,...props})=>React.createElement('nav',props,children),header:({children,...props})=>React.createElement('header',props,children),footer:({children,...props})=>React.createElement('footer',props,children),main:({children,...props})=>React.createElement('main',props,children),ul:({children,...props})=>React.createElement('ul',props,children),li:({children,...props})=>React.createElement('li',props,children),a:({children,...props})=>React.createElement('a',props,children),img:(props)=>React.createElement('img',props),input:(props)=>React.createElement('input',props),form:({children,...props})=>React.createElement('form',props,children),article:({children,...props})=>React.createElement('article',props,children)};" +
      "const Link=({href,children,...props})=>React.createElement('a',{href,...props},children);const Image=({src,alt,width,height,...props})=>React.createElement('img',{src,alt,style:{width,height},...props});const Head=({children})=>null;const useRouter=()=>({push:(url)=>console.log('Navigate to:',url),pathname:'/',query:{}});" +
      "const createIcon=(name)=>(props)=>React.createElement('span',{...props,style:{display:'inline-block',width:'1em',height:'1em',...(props?.style||{})}},'\\u2B21');const Menu=createIcon('Menu');const X=createIcon('X');const ChevronDown=createIcon('ChevronDown');const ChevronRight=createIcon('ChevronRight');const ArrowRight=createIcon('ArrowRight');const Check=createIcon('Check');const Star=createIcon('Star');const Heart=createIcon('Heart');const Search=createIcon('Search');const User=createIcon('User');const Mail=createIcon('Mail');const Phone=createIcon('Phone');const MapPin=createIcon('MapPin');const Calendar=createIcon('Calendar');const Clock=createIcon('Clock');const Settings=createIcon('Settings');const Home=createIcon('Home');const ShoppingCart=createIcon('ShoppingCart');const Plus=createIcon('Plus');const Minus=createIcon('Minus');const Edit=createIcon('Edit');const Trash=createIcon('Trash');const Upload=createIcon('Upload');const Download=createIcon('Download');const Share=createIcon('Share');const Copy=createIcon('Copy');const ExternalLink=createIcon('ExternalLink');const Github=createIcon('Github');const Twitter=createIcon('Twitter');const Linkedin=createIcon('Linkedin');const Facebook=createIcon('Facebook');const Instagram=createIcon('Instagram');const Youtube=createIcon('Youtube');" +
      "const AnimatePresence=({children})=>children;const cn=(...classes)=>classes.filter(Boolean).join(' ');const clsx=cn;" +
      "try{" +
      cleanedCode +
      ";const components=[typeof App!=='undefined'?App:null,typeof Home!=='undefined'&&typeof Home==='function'&&Home.toString().includes('return')?Home:null,typeof Page!=='undefined'?Page:null,typeof Main!=='undefined'?Main:null,typeof Index!=='undefined'?Index:null].filter(Boolean);const MainComponent=components[0];if(MainComponent){ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(MainComponent));}else{document.getElementById('root').innerHTML='<div style=\"padding:20px;text-align:center;\"><h2>Preview Ready</h2><p>Component rendered</p></div>';}}catch(error){console.error('React render error:',error);document.getElementById('root').innerHTML='<div style=\"padding:20px;color:#ef4444;\"><h3>Render Error</h3><pre>'+error.message+'</pre></div>';}" +
      "<\/script></body></html>"
    );
  };

  const buildVuePreview = (code: string): string => {
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const template = templateMatch
      ? templateMatch[1].trim()
      : "<div>{{ message }}</div>";
    const style = styleMatch ? styleMatch[1].trim() : "";

    return (
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Vue Preview</title><script src="https://cdn.tailwindcss.com"><\/script><script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Inter",system-ui,sans-serif;}' +
      style +
      "</style></head><body><div id=\"app\">" +
      template +
      '</div><script>try{const{createApp,ref,reactive,computed,onMounted,watch}=Vue;const app=createApp({data(){return{message:"Hello Vue!",count:0,items:[],loading:false,menuOpen:false}},methods:{increment(){this.count++},decrement(){this.count--},toggleMenu(){this.menuOpen=!this.menuOpen}},template:`' +
      template.replace(/`/g, "\\`").replace(/\$/g, "\\$") +
      '`});app.mount("#app");}catch(error){console.error("Vue render error:",error);document.getElementById("app").innerHTML="<div style=\\"padding:20px;color:#ef4444;\\"><h3>Vue Error</h3><pre>"+error.message+"</pre></div>";}<\/script></body></html>'
    );
  };

  const buildSveltePreview = (code: string): string => {
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    let template = code
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
      .trim();
    const style = styleMatch ? styleMatch[1].trim() : "";

    template = template
      .replace(/{#if\s+[^}]+}/g, "")
      .replace(/{:else}/g, "")
      .replace(/{\/if}/g, "")
      .replace(/{#each\s+[^}]+}/g, "")
      .replace(/{\/each}/g, "")
      .replace(/{@html\s+[^}]+}/g, "")
      .replace(/{[^}]+}/g, "");

    return (
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Svelte Preview</title><script src="https://cdn.tailwindcss.com"><\/script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Inter",system-ui,sans-serif;}' +
      style +
      "</style></head><body>" +
      (template ||
        '<div style="padding:40px;text-align:center;"><h1>Svelte Preview</h1><p>Static preview mode</p></div>') +
      '<script>document.querySelectorAll("button").forEach(btn=>{btn.addEventListener("click",()=>{console.log("Button clicked:",btn.textContent);});});<\/script></body></html>'
    );
  };

  const injectVirtualRouter = (html: string): string => {
    const routerScript =
      '<script>(function(){document.addEventListener("click",function(e){const link=e.target.closest("a");if(link&&link.href){e.preventDefault();console.log("Navigation intercepted:",link.href);}});document.addEventListener("submit",function(e){e.preventDefault();console.log("Form submission intercepted");});})();<\/script>';
    if (html.includes("</body>")) {
      return html.replace("</body>", routerScript + "</body>");
    }
    return html + routerScript;
  };

  const buildErrorHtml = (errorMessage: string): string => {
    return (
      '<!DOCTYPE html><html><head><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);color:white;}.error-container{text-align:center;padding:40px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;max-width:500px;}h2{color:#ef4444;margin-bottom:16px;}pre{background:rgba(0,0,0,0.3);padding:16px;border-radius:8px;overflow-x:auto;text-align:left;font-size:12px;}</style></head><body><div class="error-container"><h2>Preview Error</h2><pre>' +
      errorMessage +
      "</pre><p style=\"margin-top:16px;opacity:0.7;\">Try regenerating the code or check the console for details.</p></div></body></html>"
    );
  };

  useEffect(() => {
    if (isGenerating) {
      setRuntimeState({
        status: "loading",
        message: "Generating code...",
        error: null,
      });
      return;
    }
    const code = getMainCode();
    if (code) {
      buildStaticPreview(code);
    }
  }, [techStack, files, previewHtml, generatedCode, isGenerating, getMainCode, buildStaticPreview]);

  useEffect(() => {
    if (staticHtml && iframeRef.current) {
      try {
        iframeRef.current.srcdoc = staticHtml;
      } catch (error) {
        console.error("Error writing to iframe:", error);
      }
    }
  }, [staticHtml]);

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div
            className={
              "w-2 h-2 rounded-full " +
              (runtimeState.status === "ready"
                ? "bg-green-500"
                : runtimeState.status === "loading"
                ? "bg-yellow-500 animate-pulse"
                : runtimeState.status === "error"
                ? "bg-red-500"
                : "bg-gray-500")
            }
          />
          <span className="text-sm text-gray-400">{runtimeState.message}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 capitalize">
            {techStack}
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-white">
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
            />
          </div>
        ) : null}

        <iframe
          ref={iframeRef}
          title="Preview"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
