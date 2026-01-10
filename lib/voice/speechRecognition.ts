/**
 * Speech Recognition Wrapper
 * Uses Web Speech API for browser-native voice transcription
 */

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

// SpeechRecognition interface for TypeScript
interface ISpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

interface ISpeechRecognitionConstructor {
    new(): ISpeechRecognition;
}

// Get the SpeechRecognition constructor (browser-specific)
const getSpeechRecognition = (): ISpeechRecognitionConstructor | null => {
    if (typeof window === 'undefined') return null;

    return (
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        null
    );
};


export interface VoiceRecognitionOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onResult?: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
}

export class VoiceRecognition {
    private recognition: ISpeechRecognition | null = null;
    private isListening = false;
    private options: VoiceRecognitionOptions;

    constructor(options: VoiceRecognitionOptions = {}) {
        this.options = {
            language: 'en-US',
            continuous: false,
            interimResults: true,
            ...options
        };

        this.initialize();
    }

    private initialize(): void {
        const SpeechRecognitionClass = getSpeechRecognition();

        if (!SpeechRecognitionClass) {
            console.warn('Speech Recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognitionClass();
        this.recognition.lang = this.options.language || 'en-US';
        this.recognition.continuous = this.options.continuous || false;
        this.recognition.interimResults = this.options.interimResults || true;

        // Handle results
        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.resultIndex];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            this.options.onResult?.(transcript, isFinal);
        };

        // Handle errors
        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            this.options.onError?.(event.error);
        };

        // Handle start
        this.recognition.onstart = () => {
            this.isListening = true;
            this.options.onStart?.();
        };

        // Handle end
        this.recognition.onend = () => {
            this.isListening = false;
            this.options.onEnd?.();
        };
    }

    /**
     * Start listening for voice input
     */
    start(): boolean {
        if (!this.recognition) {
            this.options.onError?.('Speech recognition not supported');
            return false;
        }

        if (this.isListening) {
            return true;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            this.options.onError?.('Failed to start recording');
            return false;
        }
    }

    /**
     * Stop listening
     */
    stop(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    /**
     * Abort listening (discards any pending results)
     */
    abort(): void {
        if (this.recognition) {
            this.recognition.abort();
        }
    }

    /**
     * Check if currently listening
     */
    getIsListening(): boolean {
        return this.isListening;
    }

    /**
     * Check if speech recognition is supported
     */
    static isSupported(): boolean {
        return getSpeechRecognition() !== null;
    }
}

/**
 * Hook-friendly function to create a voice recognition instance
 */
export function createVoiceRecognition(options: VoiceRecognitionOptions): VoiceRecognition {
    return new VoiceRecognition(options);
}

/**
 * Check browser support
 */
export function isSpeechRecognitionSupported(): boolean {
    return VoiceRecognition.isSupported();
}
