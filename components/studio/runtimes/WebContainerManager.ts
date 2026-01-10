/**
 * WebContainerManager - Singleton manager for WebContainer instance
 * Handles booting, caching, and lifecycle management
 */

import { WebContainer } from '@webcontainer/api';

class WebContainerManager {
    private static instance: WebContainer | null = null;
    private static bootPromise: Promise<WebContainer> | null = null;
    private static serverUrl: string | null = null;
    private static currentFiles: Record<string, any> = {};

    /**
     * Get or create WebContainer instance (singleton)
     */
    static async getInstance(): Promise<WebContainer> {
        // Return existing instance
        if (this.instance) {
            return this.instance;
        }

        // If booting, wait for it
        if (this.bootPromise) {
            return this.bootPromise;
        }

        // Boot new instance
        this.bootPromise = this.boot();
        this.instance = await this.bootPromise;
        this.bootPromise = null;

        return this.instance;
    }

    /**
     * Boot the WebContainer
     */
    private static async boot(): Promise<WebContainer> {
        console.log('[WebContainer] Booting...');
        const container = await WebContainer.boot();
        console.log('[WebContainer] Boot complete');
        return container;
    }

    /**
     * Get cached server URL if available
     */
    static getServerUrl(): string | null {
        return this.serverUrl;
    }

    /**
     * Set the server URL when dev server starts
     */
    static setServerUrl(url: string): void {
        this.serverUrl = url;
    }

    /**
     * Clear server URL (when server stops)
     */
    static clearServerUrl(): void {
        this.serverUrl = null;
    }

    /**
     * Check if container is already booted
     */
    static isBooted(): boolean {
        return this.instance !== null;
    }

    /**
     * Store current mounted files for diffing
     */
    static setCurrentFiles(files: Record<string, any>): void {
        this.currentFiles = files;
    }

    /**
     * Get current mounted files
     */
    static getCurrentFiles(): Record<string, any> {
        return this.currentFiles;
    }

    /**
     * Destroy container (for cleanup)
     */
    static async destroy(): Promise<void> {
        if (this.instance) {
            await this.instance.teardown();
            this.instance = null;
            this.serverUrl = null;
            this.currentFiles = {};
        }
    }
}

export default WebContainerManager;
