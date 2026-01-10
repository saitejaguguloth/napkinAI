import { NextRequest, NextResponse } from "next/server";
import { generateWithTimeout } from "@/lib/gemini";
import { EDIT_SYSTEM_PROMPT, buildEditPrompt } from "@/lib/prompt";
import type { EditRequest, EditResponse } from "@/types/generation";

const MAX_CODE_LENGTH = 50000;
const MAX_COMMAND_LENGTH = 1000;
const MIN_COMMAND_LENGTH = 3;

export async function POST(request: NextRequest): Promise<NextResponse<EditResponse>> {
    try {
        const body = await request.json() as EditRequest;

        if (!body.existingCode || typeof body.existingCode !== "string") {
            return NextResponse.json(
                { code: "", error: "Existing code is required" },
                { status: 400 }
            );
        }

        if (!body.command || typeof body.command !== "string") {
            return NextResponse.json(
                { code: "", error: "Edit command is required" },
                { status: 400 }
            );
        }

        const existingCode = body.existingCode.trim();
        const command = body.command.trim();

        if (command.length < MIN_COMMAND_LENGTH) {
            return NextResponse.json(
                { code: "", error: "Command is too short" },
                { status: 400 }
            );
        }

        if (command.length > MAX_COMMAND_LENGTH) {
            return NextResponse.json(
                { code: "", error: `Command exceeds maximum length of ${MAX_COMMAND_LENGTH} characters` },
                { status: 400 }
            );
        }

        if (existingCode.length > MAX_CODE_LENGTH) {
            return NextResponse.json(
                { code: "", error: "Existing code is too large" },
                { status: 400 }
            );
        }

        const userPrompt = buildEditPrompt(existingCode, command);
        const updatedCode = await generateWithTimeout(EDIT_SYSTEM_PROMPT, userPrompt, 55000);

        if (!updatedCode || updatedCode.length === 0) {
            return NextResponse.json(
                { code: existingCode, error: "Failed to apply edit" },
                { status: 500 }
            );
        }

        return NextResponse.json({ code: updatedCode });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";

        if (message.includes("timed out")) {
            return NextResponse.json(
                { code: "", error: "Edit timed out. Try a simpler command." },
                { status: 504 }
            );
        }

        if (message.includes("GEMINI_API_KEY")) {
            return NextResponse.json(
                { code: "", error: "AI service not configured" },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { code: "", error: "Failed to apply edit" },
            { status: 500 }
        );
    }
}
