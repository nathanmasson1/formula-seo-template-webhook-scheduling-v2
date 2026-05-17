import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, Search, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { githubApi } from '../../lib/adminApi';
import { triggerToast } from './CmsToaster';

type Author = { id?: string; slug?: string; name: string };
type Category = { slug: string; name: string };
type TopicItem = { raw: string; keyword: string; title?: string };
type GeneratedPost = {
    title: string;
    slug: string;
    description: string;
    tags: string[];
    content: string;
    faqs: { q: string; a: string }[];
};
type Job = {
    id: string;
    topic: TopicItem;
    status: 'pending' | 'generating' | 'saving' | 'done' | 'error';
    message: string;
    post?: GeneratedPost;
    path?: string;
};

const inputClass = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm';
const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90);
}

function parseTopics(text: string): TopicItem[] {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(raw => {
            const [keyword, ...titleParts] = raw.split('|').map(part => part.trim());
            return { raw, keyword, title: titleParts.join(' | ') || undefined };
        })
        .filter(item => item.keyword);
}

function escapeYaml(value: string): string {
    return (value || '').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
    const seen = new Set<string>();
    return items.filter(item => {
        const key = getKey(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function buildMarkdown(post: GeneratedPost, meta: { category: string; author: string; draft: boolean; image: string }) {
    const faqYaml = post.faqs?.length
        ? `faqs:\n${post.faqs.map(f => `  - q: "${escapeYaml(f.q)}"\n    a: "${escapeYaml(f.a)}"`).join('\n')}`
        : '';
    const tagsYaml = post.tags?.length
        ? `tags:\n${post.tags.map(tag => `  - "${escapeYaml(tag)}"`).join('\n')}`
        : '';

    return [
        '---',
        `title: "${escapeYaml(post.title)}"`,
        `description: "${escapeYaml(post.description)}"`,
        `pubDate: "${new Date().toISOString().split('T')[0]}"`,
        meta.image && `image: "${escapeYaml(meta.image)}"`,
        `category: "${escapeYaml(meta.category)}"`,
        `author: "${escapeYaml(meta.author)}"`,
        tagsYaml,
        faqYaml,
        'showToc: true',
        `draft: ${meta.draft}`,
        '---',
        '',
        post.content || '',
    ].filter(Boolean).join('\n');
}

export default function BulkSeoBlogEditor() {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
    const [topicsText, setTopicsText] = useState('como melhorar o SEO de um site\nbacklinks de qualidade | Como conseguir backlinks de qualidade\nseo local para pequenas empresas');
    const [author, setAuthor] = useState('');
    const [category, setCategory] = useState('');
    const [draft, setDraft] = useState(false);
    const [words, setWords] = useState(1200);
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState('didático, direto e profissional');
    const [searchIntent, setSearchIntent] = useState('informacional');
    const [image, setImage] = useState('');
    const [extraInstructions, setExtraInstructions] = useState('Inclua exemplos práticos, subtítulos claros, listas acionáveis e uma seção de FAQ.');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState('');

    const topics = useMemo(() => parseTopics(topicsText), [topicsText]);
    const doneCount = jobs.filter(j => j.status === 'done').length;
    const hasRunningJob = jobs.some(j => j.status === 'generating' || j.status === 'saving');

    useEffect(() => {
        const load = async () => {
            try {
                const [authRes, catRes, configRes] = await Promise.allSettled([
                    githubApi('read', 'src/data/authors.json'),
                    githubApi('read', 'src/data/categories.json'),
                    githubApi('read', 'src/data/siteConfig.json'),
                ]);
                if (authRes.status === 'fulfilled') {
                    const parsed = JSON.parse(authRes.value?.content || '[]');
                    if (Array.isArray(parsed)) {
                        const uniqueAuthors = uniqueBy(parsed, a => a.id || a.slug || a.name);
                        setAuthors(uniqueAuthors);
                        setAuthor(uniqueAuthors[0]?.id || uniqueAuthors[0]?.slug || uniqueAuthors[0]?.name || '');
                    }
                }
                if (catRes.status === 'fulfilled') {
                    const parsed = JSON.parse(catRes.value?.content || '[]');
                    if (Array.isArray(parsed)) {
                        const uniqueCategories = uniqueBy(parsed, c => c.slug);
                        setCategories(uniqueCategories);
                        setCategory(uniqueCategories[0]?.slug || '');
                    }
                }
                if (configRes.status === 'fulfilled') {
                    const cfg = JSON.parse(configRes.value?.content || '{}');
                    setAiConfigured(!!(cfg.ai?.openaiKey && cfg.ai.openaiKey.length > 10));
                } else {
                    setAiConfigured(false);
                }
            } catch (err: any) {
                setError(err.message || 'Erro ao carregar configurações.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const updateJob = (id: string, patch: Partial<Job>) => {
        setJobs(prev => prev.map(job => job.id === id ? { ...job, ...patch } : job));
    };

    const ensureUniqueSlug = async (baseSlug: string) => {
        const base = slugify(baseSlug) || `artigo-${Date.now()}`;
        for (let i = 0; i < 50; i++) {
            const candidate = i === 0 ? base : `${base}-${i + 1}`;
            try {
                await githubApi('read', `src/content/blog/${candidate}.md`);
            } catch {
                return candidate;
            }
        }
        return `${base}-${Date.now()}`;
    };

    const generatePost = async (topic: TopicItem): Promise<GeneratedPost> => {
        const res = await fetch('/api/admin/seo-blog-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keyword: topic.keyword,
                title: topic.title,
                audience,
                tone,
                searchIntent,
                words,
                extraInstructions,
            }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
            throw new Error(json.error || 'Erro ao gerar artigo.');
        }
        return json.data;
    };

    const runBulkGeneration = async () => {
        if (topics.length === 0) {
            setError('Adicione pelo menos um tema ou palavra-chave.');
            return;
        }
        if (!author || !category) {
            setError('Selecione autor e categoria.');
            return;
        }
        setError('');
        setRunning(true);
        const initialJobs: Job[] = topics.map((topic, index) => ({
            id: `${Date.now()}-${index}`,
            topic,
            status: 'pending',
            message: 'Na fila',
        }));
        setJobs(initialJobs);

        for (const job of initialJobs) {
            updateJob(job.id, { status: 'generating', message: 'Gerando artigo SEO com IA...' });
            try {
                const post = await generatePost(job.topic);
                const uniqueSlug = await ensureUniqueSlug(post.slug || post.title || job.topic.keyword);
                const postToSave = { ...post, slug: uniqueSlug };
                const path = `src/content/blog/${uniqueSlug}.md`;
                updateJob(job.id, { status: 'saving', message: 'Salvando no blog...', post: postToSave });
                const markdown = buildMarkdown(postToSave, { author, category, draft, image });
                await githubApi('write', path, {
                    content: markdown,
                    message: `CMS: Artigo SEO em massa - ${postToSave.title}`,
                });
                updateJob(job.id, { status: 'done', message: 'Publicado', post: postToSave, path });
                triggerToast(`Artigo criado: ${postToSave.title}`, 'success', 100);
            } catch (err: any) {
                updateJob(job.id, { status: 'error', message: err.message || 'Erro ao gerar artigo' });
                triggerToast(`Erro em "${job.topic.keyword}": ${err.message}`, 'error');
            }
        }

        setRunning(false);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
            <p className="font-medium animate-pulse">Carregando gerador...</p>
        </div>
    );

    return (
        <div className="max-w-6xl pb-32 space-y-6">
            <div className="flex flex-col gap-4 bg-white p-5 px-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <a href="/admin/posts" className="text-slate-400 hover:text-violet-600 transition-colors p-1.5 rounded-lg hover:bg-violet-50">
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-violet-600" /> Gerador SEO em Massa
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">Crie vários artigos de blog otimizados para busca a partir de temas e palavras-chave.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={runBulkGeneration}
                        disabled={running || !author || !category || topics.length === 0}
                        className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-violet-600/20"
                    >
                        {running ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4" /> Gerar {topics.length || ''} Artigos</>}
                    </button>
                </div>

                {aiConfigured === false && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>OpenAI API Key não configurada. Configure em <a href="/admin/config#ai" className="font-bold underline">Configurações</a> antes de gerar artigos.</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium rounded-r-xl flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-6 items-start">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div>
                        <label className={labelClass}>Temas / palavras-chave</label>
                        <textarea
                            className={`${inputClass} font-mono text-xs min-h-[260px]`}
                            value={topicsText}
                            onChange={e => setTopicsText(e.target.value)}
                            disabled={running}
                            placeholder={`uma palavra-chave por linha\npalavra-chave | título opcional do artigo`}
                        />
                        <p className="text-xs text-slate-400 mt-2 ml-1">Formato: uma linha por artigo. Use <code className="bg-slate-100 px-1 rounded">keyword | título opcional</code> quando quiser controlar o título.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fila de geração</p>
                        {topics.length === 0 ? (
                            <p className="text-sm text-slate-400">Nenhum artigo na fila.</p>
                        ) : (
                            <div className="space-y-2">
                                {topics.map((topic, index) => (
                                    <div key={`${topic.raw}-${index}`} className="flex items-start gap-3 text-sm bg-white border border-slate-200 rounded-lg p-3">
                                        <span className="w-6 h-6 rounded-full bg-violet-50 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</span>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800">{topic.title || topic.keyword}</p>
                                            {topic.title && <p className="text-xs text-slate-500">Keyword: {topic.keyword}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className={labelClass}>Autor</label>
                                <select className={inputClass} value={author} onChange={e => setAuthor(e.target.value)} disabled={running}>
                                    <option value="">Selecione</option>
                                    {authors.map(a => {
                                        const value = a.id || a.slug || a.name;
                                        return <option key={value} value={value}>{a.name}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Categoria</label>
                                <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)} disabled={running}>
                                    <option value="">Selecione</option>
                                    {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Intenção de busca</label>
                                <select className={inputClass} value={searchIntent} onChange={e => setSearchIntent(e.target.value)} disabled={running}>
                                    <option value="informacional">Informacional</option>
                                    <option value="comercial">Comercial investigativa</option>
                                    <option value="local">Local</option>
                                    <option value="tutorial">Tutorial / passo a passo</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Palavras por artigo</label>
                                <input className={inputClass} type="number" min={700} max={3500} step={100} value={words} onChange={e => setWords(Number(e.target.value) || 1200)} disabled={running} />
                            </div>
                            <div>
                                <label className={labelClass}>Público-alvo</label>
                                <input className={inputClass} value={audience} onChange={e => setAudience(e.target.value)} disabled={running} placeholder="ex: donos de pequenas empresas" />
                            </div>
                            <div>
                                <label className={labelClass}>Tom de voz</label>
                                <input className={inputClass} value={tone} onChange={e => setTone(e.target.value)} disabled={running} />
                            </div>
                            <div>
                                <label className={labelClass}>Imagem padrão opcional</label>
                                <input className={inputClass} value={image} onChange={e => setImage(e.target.value)} disabled={running} placeholder="/images/blog/seo.jpg" />
                            </div>
                            <div>
                                <label className={labelClass}>Instruções adicionais</label>
                                <textarea className={`${inputClass} min-h-[110px]`} value={extraInstructions} onChange={e => setExtraInstructions(e.target.value)} disabled={running} />
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl hover:bg-violet-50 transition-colors">
                                <input type="checkbox" checked={draft} onChange={e => setDraft(e.target.checked)} disabled={running} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                                <span className="text-sm font-medium text-slate-700">Salvar como rascunho</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {jobs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-slate-800">Resultado</h3>
                            <p className="text-xs text-slate-400">{doneCount} de {jobs.length} artigos concluídos</p>
                        </div>
                        {!hasRunningJob && (
                            <button onClick={() => setJobs([])} className="text-sm font-bold text-slate-400 hover:text-red-600 flex items-center gap-1">
                                <Trash2 className="w-4 h-4" /> Limpar
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {jobs.map(job => (
                            <div key={job.id} className="border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">
                                    {job.status === 'done' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                                    {job.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                                    {(job.status === 'generating' || job.status === 'saving') && <Loader2 className="w-5 h-5 animate-spin text-violet-600" />}
                                    {job.status === 'pending' && <FileText className="w-5 h-5 text-slate-300" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800">{job.post?.title || job.topic.title || job.topic.keyword}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{job.message}</p>
                                    {job.path && <p className="text-xs font-mono text-violet-600 mt-1">{job.path}</p>}
                                </div>
                                {job.status === 'done' && job.post && (
                                    <a href={`/admin/posts/edit?file=${encodeURIComponent(job.path || '')}`} className="text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-lg flex items-center gap-1">
                                        <Search className="w-3 h-3" /> Editar
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
