import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSession } from '../../../lib/auth';

export const prerender = false;

const PROJECT_ROOT = nodePath.resolve(fileURLToPath(import.meta.url), '../../../../../');

async function getOpenAIConfig(): Promise<{ apiKey: string; model: string }> {
    const envKey = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    let apiKey = envKey || '';
    let model = 'gpt-4o-mini';

    try {
        const raw = await fs.readFile(nodePath.join(PROJECT_ROOT, 'src/data/siteConfig.json'), 'utf-8');
        const cfg = JSON.parse(raw);
        if (!apiKey && cfg.ai?.openaiKey) apiKey = cfg.ai.openaiKey;
        if (cfg.ai?.model) model = cfg.ai.model;
    } catch { }

    return { apiKey, model };
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90);
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => {
                const [k, ...v] = c.trim().split('=');
                return [k, decodeURIComponent(v.join('='))];
            })
        );
        if (!await validateSession(cookies.admin_session)) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
        }

        const {
            keyword,
            title,
            audience = '',
            tone = 'didático, direto e profissional',
            searchIntent = 'informacional',
            words = 1200,
            language = 'pt-BR',
            extraInstructions = '',
        } = await request.json();

        const topic = String(title || keyword || '').trim();
        if (!topic) {
            return new Response(JSON.stringify({ error: 'Tema ou palavra-chave obrigatório.' }), { status: 400 });
        }

        const { apiKey, model } = await getOpenAIConfig();
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'OpenAI API Key não configurada. Configure em /admin/config.' }), { status: 500 });
        }

        const safeWords = Math.max(700, Math.min(3500, Number(words) || 1200));
        const systemPrompt = `Você é um redator SEO senior para blogs em ${language}.

Crie artigos informativos, úteis e prontos para publicação.

Regras obrigatórias:
- Não escreva review de produto, ranking de produtos ou texto afiliado, a menos que o tema peça explicitamente.
- Foque em responder a intenção de busca: ${searchIntent}.
- Use tom ${tone}.
- Nunca use primeira pessoa.
- Parágrafos curtos, com no máximo 3 linhas.
- Use Markdown no corpo: ##, ###, listas e tabelas quando fizer sentido.
- Inclua uma introdução sem heading, seções H2/H3, conclusão e FAQ.
- Otimize naturalmente para SEO sem keyword stuffing.
- Meta description com 145-160 caracteres.
- Título com até 70 caracteres.
- Conteúdo com aproximadamente ${safeWords} palavras.

Retorne SOMENTE JSON válido neste schema:
{
  "title": "Título SEO do artigo",
  "slug": "slug-url",
  "description": "meta description 145-160 caracteres",
  "tags": ["tag 1", "tag 2", "tag 3"],
  "content": "corpo completo em Markdown, sem frontmatter",
  "faqs": [
    {"q": "Pergunta?", "a": "Resposta objetiva"}
  ]
}`;

        const userPrompt = `Tema/palavra-chave principal: ${topic}
${keyword && title ? `Palavra-chave alvo: ${keyword}` : ''}
${audience ? `Público-alvo: ${audience}` : ''}
${extraInstructions ? `Instruções adicionais: ${extraInstructions}` : ''}

Gere um artigo de blog SEO completo, informativo e pronto para publicar.`;

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                response_format: { type: 'json_object' },
                temperature: 0.72,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            return new Response(JSON.stringify({ error: `OpenAI API: ${res.status} - ${errText.slice(0, 300)}` }), { status: 500 });
        }

        const json: any = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (!content) {
            return new Response(JSON.stringify({ error: 'Resposta vazia do OpenAI.' }), { status: 500 });
        }

        let parsed: any;
        try {
            parsed = JSON.parse(content);
        } catch {
            return new Response(JSON.stringify({ error: 'Resposta da IA não é JSON válido.' }), { status: 500 });
        }

        const generatedTitle = String(parsed.title || topic).trim();
        const generatedSlug = slugify(parsed.slug || generatedTitle || topic);
        const result = {
            title: generatedTitle,
            slug: generatedSlug || slugify(topic),
            description: String(parsed.description || generatedTitle).trim().slice(0, 180),
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
            content: String(parsed.content || '').trim(),
            faqs: Array.isArray(parsed.faqs) ? parsed.faqs.slice(0, 6) : [],
            usage: json.usage,
            model,
        };

        return new Response(JSON.stringify({ ok: true, data: result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Erro desconhecido' }), { status: 500 });
    }
};
