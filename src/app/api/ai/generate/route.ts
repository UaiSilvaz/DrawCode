import { NextRequest, NextResponse } from 'next/server';
import { generateDrawCodeAI } from '@/lib/ai/agent';
import { aiGenerateRequestSchema } from '@/lib/ai/preview-generator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = aiGenerateRequestSchema.safeParse(body);

        if (!parsed.success) {
            const message =
                parsed.error.flatten().formErrors[0]
                ?? Object.values(parsed.error.flatten().fieldErrors).flat()[0]
                ?? 'Dados invalidos para gerar o preview.';
            return NextResponse.json({ error: message }, { status: 400 });
        }

        return NextResponse.json({
            output: await generateDrawCodeAI(parsed.data),
        });
    } catch (error) {
        console.error('[AI_GENERATE]', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro interno ao gerar preview.' },
            { status: 500 },
        );
    }
}
