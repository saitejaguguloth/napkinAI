import { NextRequest } from "next/server";
import { runProgressivePipeline, runTextToWebsitePipeline, PipelineStage, PipelineConfig } from "@/lib/pipeline/progressivePipeline";

export const maxDuration = 120; // 2 minutes max
export const dynamic = 'force-dynamic';

interface StreamingRequest {
    imageBase64?: string;
    mimeType?: string;
    config: PipelineConfig;
}

/**
 * Streaming API for progressive generation
 * Returns Server-Sent Events with stage updates
 * Supports both image-based and text-based generation
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as StreamingRequest;

        // Check if we have either an image or a text prompt
        const hasImage = body.imageBase64 && body.imageBase64.length > 100;
        const hasTextPrompt = body.config?.textPrompt && body.config.textPrompt.trim().length > 10;

        if (!hasImage && !hasTextPrompt) {
            return new Response(JSON.stringify({ error: "Either image or text prompt required" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!body.config?.techStack) {
            return new Response(JSON.stringify({ error: "Tech stack required" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create readable stream for SSE
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (stage: PipelineStage) => {
                    const data = `data: ${JSON.stringify(stage)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                };

                try {
                    // Choose pipeline based on input type
                    if (hasImage) {
                        // Image-based generation
                        await runProgressivePipeline(
                            body.imageBase64!,
                            body.mimeType || 'image/png',
                            body.config,
                            sendEvent
                        );
                    } else {
                        // Text-based generation
                        await runTextToWebsitePipeline(
                            body.config,
                            sendEvent
                        );
                    }

                    // Send done event
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error("Pipeline error:", error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    
                    // Check for rate limit errors
                    let userFriendlyMessage = errorMessage;
                    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
                        userFriendlyMessage = '⚠️ API rate limit reached. Please wait a few minutes and try again, or upgrade your Gemini API key for higher limits.';
                    } else if (errorMessage.includes('RESOURCE_EXHAUSTED')) {
                        userFriendlyMessage = '⚠️ Daily API quota exceeded. Your Gemini API free tier allows 20 requests/day. Please wait 24 hours or upgrade your API key.';
                    }
                    
                    sendEvent({
                        stage: 'complete',
                        progress: 100,
                        error: userFriendlyMessage
                    });
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error("Streaming API Error:", error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error"
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
