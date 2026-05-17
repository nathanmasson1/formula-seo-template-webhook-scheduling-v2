import type { APIRoute } from 'astro';
import { validateSession } from '../../../../../lib/auth';
import { readPluginsConfig } from '../../../../../plugins/_server';
import { parseServiceAccountJson, requestUrlIndexing } from '../../../../../plugins/search-console/gsc-api';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const cookieHeader = request.headers.get('cookie') || '';
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => {
                const [k, ...v] = c.trim().split('=');
                return [k, decodeURIComponent(v.join('='))];
            })
        );
        if (!await validateSession(cookies['admin_session'])) {
            return new Response(JSON.stringify({ success: false, message: 'Nao autorizado.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { url } = await request.json();
        if (!url?.trim()) {
            return new Response(JSON.stringify({ success: false, message: 'URL nao informada.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url.trim());
        } catch {
            return new Response(JSON.stringify({ success: false, message: 'URL invalida.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return new Response(JSON.stringify({ success: false, message: 'A URL precisa usar http ou https.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const config = readPluginsConfig();
        const serviceAccountJson = config?.searchConsole?.serviceAccountJson || '';
        if (!serviceAccountJson.trim()) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Search Console nao configurado. Adicione o JSON do Service Account antes de solicitar indexacao.',
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const credentials = parseServiceAccountJson(serviceAccountJson);
        const result = await requestUrlIndexing(parsedUrl.toString(), credentials);

        return new Response(JSON.stringify({
            success: true,
            message: 'Solicitacao de indexacao enviada ao Google.',
            result,
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({
            success: false,
            message: err.message || 'Erro ao solicitar indexacao.',
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
