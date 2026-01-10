/**
 * ReactRuntime - Handles React app preview using WebContainer
 * Creates a real Vite dev server inside the browser
 */

import WebContainerManager from './WebContainerManager';
import { generateReactFileSystem } from './templates';
import type { WebContainer } from '@webcontainer/api';

export type RuntimeStatus =
    | 'idle'
    | 'booting'
    | 'mounting'
    | 'installing'
    | 'starting'
    | 'ready'
    | 'error';

export interface RuntimeState {
    status: RuntimeStatus;
    message: string;
    progress: number;
    serverUrl: string | null;
    error: string | null;
}

export type StatusCallback = (state: RuntimeState) => void;

/**
 * Run React preview using WebContainer
 */
export async function runReactPreview(
    appCode: string,
    onStatus: StatusCallback
): Promise<string> {
    try {
        // Phase 1: Boot WebContainer
        onStatus({
            status: 'booting',
            message: 'Booting WebContainer...',
            progress: 10,
            serverUrl: null,
            error: null
        });

        const container = await WebContainerManager.getInstance();

        // Phase 2: Mount file system
        onStatus({
            status: 'mounting',
            message: 'Mounting project files...',
            progress: 25,
            serverUrl: null,
            error: null
        });

        const files = generateReactFileSystem(appCode);
        await container.mount(files);
        WebContainerManager.setCurrentFiles(files);

        // Phase 3: Install dependencies
        onStatus({
            status: 'installing',
            message: 'Installing dependencies...',
            progress: 40,
            serverUrl: null,
            error: null
        });

        const installExitCode = await installDependencies(container, onStatus);
        if (installExitCode !== 0) {
            throw new Error('Failed to install dependencies');
        }

        // Phase 4: Start dev server
        onStatus({
            status: 'starting',
            message: 'Starting Vite dev server...',
            progress: 70,
            serverUrl: null,
            error: null
        });

        const serverUrl = await startDevServer(container, onStatus);

        WebContainerManager.setServerUrl(serverUrl);

        onStatus({
            status: 'ready',
            message: 'Preview ready!',
            progress: 100,
            serverUrl,
            error: null
        });

        return serverUrl;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onStatus({
            status: 'error',
            message: 'Preview failed',
            progress: 0,
            serverUrl: null,
            error: errorMessage
        });
        throw error;
    }
}

/**
 * Update only the App.tsx file (for hot reload)
 */
export async function updateAppCode(appCode: string): Promise<void> {
    const container = await WebContainerManager.getInstance();
    const files = generateReactFileSystem(appCode);

    // Only update the App.tsx file
    const appTsxContent = (files.src as any).directory['App.tsx'].file.contents;
    await container.fs.writeFile('/src/App.tsx', appTsxContent);
}

/**
 * Install npm dependencies
 */
async function installDependencies(
    container: WebContainer,
    onStatus: StatusCallback
): Promise<number> {
    const installProcess = await container.spawn('npm', ['install']);

    // Stream install output for progress
    installProcess.output.pipeTo(
        new WritableStream({
            write(data) {
                console.log('[npm install]', data);
                // Update progress based on output
                if (data.includes('added')) {
                    onStatus({
                        status: 'installing',
                        message: 'Dependencies installed!',
                        progress: 60,
                        serverUrl: null,
                        error: null
                    });
                }
            }
        })
    );

    return installProcess.exit;
}

/**
 * Start Vite dev server and return the URL
 */
async function startDevServer(
    container: WebContainer,
    onStatus: StatusCallback
): Promise<string> {
    const devProcess = await container.spawn('npm', ['run', 'dev']);

    // Stream dev server output
    devProcess.output.pipeTo(
        new WritableStream({
            write(data) {
                console.log('[vite]', data);
                if (data.includes('Local:')) {
                    onStatus({
                        status: 'starting',
                        message: 'Server starting...',
                        progress: 85,
                        serverUrl: null,
                        error: null
                    });
                }
            }
        })
    );

    // Wait for server to be ready
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Dev server startup timeout'));
        }, 60000); // 60 second timeout

        container.on('server-ready', (port, url) => {
            clearTimeout(timeout);
            console.log('[WebContainer] Server ready:', url);
            resolve(url);
        });

        container.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

/**
 * Check if WebContainer is already running with a server
 */
export function getExistingServerUrl(): string | null {
    return WebContainerManager.getServerUrl();
}

/**
 * Check if container is already booted
 */
export function isContainerReady(): boolean {
    return WebContainerManager.isBooted();
}
