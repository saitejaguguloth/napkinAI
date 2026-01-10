import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const { command, currentCode, techStack } = await req.json();

        if (!command) {
            return NextResponse.json({ error: "No command provided" }, { status: 400 });
        }

        if (!currentCode) {
            return NextResponse.json({ error: "No current code provided" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `You are an AI assistant that modifies UI code based on natural language commands.

TECH STACK: ${techStack || 'react'}

USER COMMAND: "${command}"

CURRENT CODE:
\`\`\`
${currentCode}
\`\`\`

INSTRUCTIONS:
1. Understand what the user wants to change
2. Modify the code accordingly
3. Keep the same structure and style
4. Only change what's necessary to fulfill the command
5. Use Tailwind CSS for styling changes
6. Return ONLY the modified code, no explanations

Common commands and their actions:
- "Make buttons blue" → Change button background to blue colors
- "Add header" → Add a header/navigation component
- "Make it modern" → Add gradients, shadows, rounded corners
- "Add animation" → Add Tailwind animation classes or CSS transitions
- "Increase spacing" → Increase padding and margins
- "Make it dark mode" → Use dark color scheme

Return the complete modified code:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let modifiedCode = response.text();

        // Clean up the response
        modifiedCode = modifiedCode
            .replace(/```[\w]*\n?/g, '')
            .replace(/```$/g, '')
            .trim();

        return NextResponse.json({
            success: true,
            modifiedCode,
            command
        });

    } catch (error) {
        console.error("Voice command error:", error);
        return NextResponse.json(
            { error: "Failed to process voice command" },
            { status: 500 }
        );
    }
}
