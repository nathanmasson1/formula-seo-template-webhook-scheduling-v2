import React, { useEffect, useState } from 'react';
import {
    AlertCircle, ChevronDown, ChevronUp, HelpCircle, Layers, Link as LinkIcon,
    Image as ImageIcon, ListChecks, Loader2, MessageCircle, Plus, Save, Search, Sparkles, Target, Trash2, Upload,
} from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

type CTA = { text: string; href: string };
type Stat = { number: string; label: string };
type VisualItem = { number: string; label: string };
type TextItem = { title: string; text: string };
type Plan = {
    name: string;
    oldPrice: string;
    price: string;
    discount: string;
    featured: boolean;
    features: string[];
    ctaText: string;
    ctaHref: string;
};
type FaqItem = { q: string; a: string };
type PersonItem = { name: string; role: string; image: string };
type TestimonialItem = { name: string; role: string; image: string; avatar?: string; alt: string; text: string };

type BacklinksConfig = {
    seo: { title: string; description: string; image: string };
    hero: {
        eyebrow: string;
        title: string;
        subtitle: string;
        primaryCta: CTA;
        secondaryCta: CTA;
        stats: Stat[];
        visual: { label: string; title: string; text: string; items: VisualItem[] };
    };
    problem: { label: string; title: string; text: string; image: string; points: string[] };
    plans: { label: string; title: string; subtitle: string; items: Plan[] };
    differentials: { label: string; title: string; ctaText: string; ctaHref: string; items: TextItem[] };
    recommendation: { label: string; title: string; text: string; image: string; ctaText: string; ctaHref: string };
    testimonials: { label: string; title: string; subtitle: string; items: TestimonialItem[] };
    niches: { label: string; title: string; subtitle: string; image: string; ctaText: string; ctaHref: string; items: string[] };
    support: { label: string; title: string; text: string; image: string; bullets: string[]; ctaText: string; ctaHref: string };
    team: { label: string; title: string; items: PersonItem[] };
    faq: { label: string; title: string; subtitle: string; items: FaqItem[] };
    cta: { title: string; text: string; primaryCta: CTA; secondaryCta: CTA };
};

const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm";
const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5";
const TESTIMONIAL_TARGET_COUNT = 12;
const defaultHeroVisual = {
    label: 'Operação de autoridade',
    title: 'Autoridade',
    text: 'Links reais apontando para páginas estratégicas',
    items: [
        { number: '01', label: 'Conteúdo publicado' },
        { number: '02', label: 'Contexto do nicho' },
        { number: '03', label: 'Mais força no Google' },
    ],
};

function createEmptyTestimonial(index: number): TestimonialItem {
    return {
        name: `Depoimento ${index + 1}`,
        role: '',
        image: '',
        alt: `Print de WhatsApp com depoimento ${index + 1}`,
        text: '',
    };
}

function SectionCard({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                </div>
                {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            {open && <div className="px-6 pb-6 border-t border-slate-100 pt-4">{children}</div>}
        </div>
    );
}

function TextField({ label, value, onChange, textarea = false, rows = 2, placeholder = '' }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    textarea?: boolean;
    rows?: number;
    placeholder?: string;
}) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            {textarea ? (
                <textarea className={inputClass} rows={rows} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
            ) : (
                <input className={inputClass} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
            )}
        </div>
    );
}

function ImageUploadField({ label, value, pending, onSelect, onClear, hint = 'Enviar imagem' }: {
    label: string;
    value: string;
    pending?: File;
    onSelect: (file: File) => void;
    onClear?: () => void;
    hint?: string;
}) {
    const hasImage = Boolean(value);
    return (
        <div className="max-w-sm">
            <label className={labelClass}>{label}</label>
            <label className="group relative aspect-[16/10] w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center overflow-hidden">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        onSelect(file);
                        e.target.value = '';
                    }}
                />
                {hasImage ? (
                    <>
                        <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-55 transition-opacity" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-sm">
                            <Upload className="w-7 h-7 text-slate-800" />
                            <span className="text-xs font-bold text-slate-900 mt-1">Trocar imagem</span>
                        </div>
                    </>
                ) : (
                    <div className="px-4 py-5 flex flex-col items-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <ImageIcon className="w-7 h-7 mb-2" />
                        <span className="text-xs font-bold">{hint}</span>
                    </div>
                )}
            </label>
            <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[10px] text-slate-400" title={pending ? `Upload pendente: ${pending.name}` : (value || 'Nenhuma imagem selecionada')}>
                    {pending ? `Upload pendente: ${pending.name}` : (value || 'Nenhuma imagem selecionada')}
                </span>
                {hasImage && onClear && (
                    <button type="button" onClick={onClear} className="shrink-0 text-[10px] font-bold text-red-500 hover:text-red-700">
                        Remover
                    </button>
                )}
            </div>
        </div>
    );
}

export default function BacklinksEditor() {
    const [config, setConfig] = useState<BacklinksConfig | null>(null);
    const [fileSha, setFileSha] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});

    useEffect(() => {
        githubApi('read', 'src/data/backlinks.json')
            .then(data => {
                const parsed = JSON.parse(data?.content || '{}');
                setConfig({
                    ...parsed,
                    hero: {
                        ...parsed.hero,
                        visual: {
                            ...defaultHeroVisual,
                            ...(parsed.hero?.visual || {}),
                            items: parsed.hero?.visual?.items || defaultHeroVisual.items,
                        },
                    },
                });
                setFileSha(data.sha);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const setPathOnObject = (target: any, path: string, value: any) => {
        const keys = path.split('.');
        let obj = target;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = value;
    };

    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });

    const uploadImage = async (fieldPath: string, file: File) => {
        const base64Content = await fileToBase64(file);
        const originalName = file.name.replace(/\.[^/.]+$/, '');
        const safeName = originalName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 60) || 'imagem';
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const fieldSlug = fieldPath.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        const ghPath = `public/images/backlinks-${fieldSlug}-${Date.now()}-${safeName}.${ext}`;
        await githubApi('write', ghPath, {
            content: base64Content,
            isBase64: true,
            message: `Upload imagem backlinks ${ghPath}`,
        });
        return ghPath.replace('public', '');
    };

    const handleImageSelect = (path: string, file: File) => {
        setPendingUploads(prev => ({ ...prev, [path]: file }));
        set(path, URL.createObjectURL(file));
    };

    const clearImage = (path: string) => {
        setPendingUploads(prev => {
            const next = { ...prev };
            delete next[path];
            return next;
        });
        set(path, '');
    };

    const save = async () => {
        if (!config) return;
        setSaving(true);
        setError('');
        triggerToast('Salvando página Backlinks...', 'progress', 20);
        try {
            const configToSave = JSON.parse(JSON.stringify(config));
            const uploads = Object.entries(pendingUploads);
            for (let i = 0; i < uploads.length; i++) {
                const [fieldPath, file] = uploads[i];
                triggerToast(`Enviando imagem ${i + 1}/${uploads.length}...`, 'progress', Math.min(80, 20 + i * 10));
                const uploadedPath = await uploadImage(fieldPath, file);
                setPathOnObject(configToSave, fieldPath, uploadedPath);
            }
            const data = await githubApi('write', 'src/data/backlinks.json', {
                content: JSON.stringify(configToSave, null, 2),
                sha: fileSha || undefined,
                message: 'CMS: Update backlinks.json',
            });
            setFileSha(data.sha);
            setConfig(configToSave);
            setPendingUploads({});
            triggerToast('Página Backlinks atualizada!', 'success', 100);
        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const set = (path: string, value: any) => {
        setConfig(prev => {
            if (!prev) return prev;
            const clone = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let obj: any = clone;
            for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
            obj[keys[keys.length - 1]] = value;
            return clone;
        });
    };

    const updateStringArray = (path: string, index: number, value: string) => {
        const arr = get(path) as string[];
        const next = [...arr];
        next[index] = value;
        set(path, next);
    };

    const addString = (path: string) => set(path, [...((get(path) as string[]) || []), '']);
    const removeString = (path: string, index: number) => set(path, ((get(path) as string[]) || []).filter((_, i) => i !== index));

    const get = (path: string): any => {
        if (!config) return undefined;
        return path.split('.').reduce((obj: any, key) => obj?.[key], config);
    };

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    if (!config) return <div className="p-8 text-red-600">Erro ao carregar backlinks.json</div>;

    return (
        <div className="space-y-6 pb-32">
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl p-5 px-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-0 z-40">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Editor da Página Backlinks</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Edite todos os campos exibidos em /backlinks</p>
                </div>
                <button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl font-bold"><AlertCircle className="w-4 h-4 inline mr-2" />{error}</div>}

            <SectionCard title="Hero" icon={<Sparkles className="w-5 h-5 text-amber-500" />} defaultOpen>
                <div className="space-y-4">
                    <TextField label="Etiqueta" value={config.hero.eyebrow} onChange={v => set('hero.eyebrow', v)} />
                    <TextField label="Título" value={config.hero.title} onChange={v => set('hero.title', v)} />
                    <TextField label="Subtítulo" textarea rows={3} value={config.hero.subtitle} onChange={v => set('hero.subtitle', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="CTA primário - texto" value={config.hero.primaryCta.text} onChange={v => set('hero.primaryCta.text', v)} />
                        <TextField label="CTA primário - link" value={config.hero.primaryCta.href} onChange={v => set('hero.primaryCta.href', v)} />
                        <TextField label="CTA secundário - texto" value={config.hero.secondaryCta.text} onChange={v => set('hero.secondaryCta.text', v)} />
                        <TextField label="CTA secundário - link" value={config.hero.secondaryCta.href} onChange={v => set('hero.secondaryCta.href', v)} />
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Painel visual da Hero</h4>
                            <p className="text-xs text-slate-500 mt-1">Textos dos cards exibidos no lado direito da hero.</p>
                        </div>
                        <TextField label="Etiqueta do painel" value={config.hero.visual.label} onChange={v => set('hero.visual.label', v)} />
                        <TextField label="Título do card principal" value={config.hero.visual.title} onChange={v => set('hero.visual.title', v)} />
                        <TextField label="Texto do card principal" value={config.hero.visual.text} onChange={v => set('hero.visual.text', v)} />
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelClass}>Cards do fluxo</label>
                                <button onClick={() => set('hero.visual.items', [...config.hero.visual.items, { number: '', label: '' }])} className="text-xs flex items-center gap-1 text-indigo-600 font-bold"><Plus className="w-3 h-3" /> Adicionar</button>
                            </div>
                            <div className="space-y-2">
                                {config.hero.visual.items.map((item, i) => (
                                    <div key={i} className="grid grid-cols-[84px_1fr_auto] gap-2">
                                        <input className={inputClass} value={item.number} onChange={e => { const arr = [...config.hero.visual.items]; arr[i] = { ...arr[i], number: e.target.value }; set('hero.visual.items', arr); }} placeholder="01" />
                                        <input className={inputClass} value={item.label} onChange={e => { const arr = [...config.hero.visual.items]; arr[i] = { ...arr[i], label: e.target.value }; set('hero.visual.items', arr); }} placeholder="Conteúdo publicado" />
                                        <button onClick={() => set('hero.visual.items', config.hero.visual.items.filter((_, j) => j !== i))} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className={labelClass}>Métricas do Hero</label>
                            <button onClick={() => set('hero.stats', [...config.hero.stats, { number: '', label: '' }])} className="text-xs flex items-center gap-1 text-indigo-600 font-bold"><Plus className="w-3 h-3" /> Adicionar</button>
                        </div>
                        <div className="space-y-2">
                            {config.hero.stats.map((stat, i) => (
                                <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                                    <input className={inputClass} value={stat.number} onChange={e => { const arr = [...config.hero.stats]; arr[i] = { ...arr[i], number: e.target.value }; set('hero.stats', arr); }} placeholder="500+" />
                                    <input className={inputClass} value={stat.label} onChange={e => { const arr = [...config.hero.stats]; arr[i] = { ...arr[i], label: e.target.value }; set('hero.stats', arr); }} placeholder="Clientes atendidos" />
                                    <button onClick={() => set('hero.stats', config.hero.stats.filter((_, j) => j !== i))} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Diagnóstico" icon={<Target className="w-5 h-5 text-rose-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.problem.label} onChange={v => set('problem.label', v)} />
                    <TextField label="Título" value={config.problem.title} onChange={v => set('problem.title', v)} />
                    <TextField label="Texto" textarea rows={3} value={config.problem.text} onChange={v => set('problem.text', v)} />
                    <ImageUploadField
                        label="Imagem"
                        value={config.problem.image}
                        pending={pendingUploads['problem.image']}
                        onSelect={file => handleImageSelect('problem.image', file)}
                        onClear={() => clearImage('problem.image')}
                    />
                    <ArrayOfStrings title="Pontos" items={config.problem.points} onAdd={() => addString('problem.points')} onRemove={i => removeString('problem.points', i)} onChange={(i, v) => updateStringArray('problem.points', i, v)} />
                </div>
            </SectionCard>

            <SectionCard title="Planos e preços" icon={<LinkIcon className="w-5 h-5 text-emerald-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.plans.label} onChange={v => set('plans.label', v)} />
                    <TextField label="Título" value={config.plans.title} onChange={v => set('plans.title', v)} />
                    <TextField label="Subtítulo" textarea value={config.plans.subtitle} onChange={v => set('plans.subtitle', v)} />
                    <div className="flex justify-end">
                        <button onClick={() => set('plans.items', [...config.plans.items, { name: '', oldPrice: '', price: '', discount: '', featured: false, features: [], ctaText: 'Comprar agora', ctaHref: '' }])} className="text-xs flex items-center gap-1 text-indigo-600 font-bold"><Plus className="w-3 h-3" /> Adicionar plano</button>
                    </div>
                    {config.plans.items.map((plan, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Plano #{i + 1}</span>
                                <button onClick={() => set('plans.items', config.plans.items.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <TextField label="Nome" value={plan.name} onChange={v => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], name: v }; set('plans.items', arr); }} />
                                <TextField label="Desconto" value={plan.discount} onChange={v => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], discount: v }; set('plans.items', arr); }} />
                                <TextField label="Preço antigo" value={plan.oldPrice} onChange={v => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], oldPrice: v }; set('plans.items', arr); }} />
                                <TextField label="Preço atual" value={plan.price} onChange={v => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], price: v }; set('plans.items', arr); }} />
                                <TextField label="CTA texto" value={plan.ctaText} onChange={v => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], ctaText: v }; set('plans.items', arr); }} />
                                <TextField label="CTA link" value={plan.ctaHref} onChange={v => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], ctaHref: v }; set('plans.items', arr); }} />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <input type="checkbox" checked={!!plan.featured} onChange={e => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], featured: e.target.checked }; set('plans.items', arr); }} />
                                Destacar plano
                            </label>
                            <ArrayOfStrings
                                title="Benefícios do plano"
                                items={plan.features || []}
                                onAdd={() => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], features: [...(arr[i].features || []), ''] }; set('plans.items', arr); }}
                                onRemove={(featureIndex) => { const arr = [...config.plans.items]; arr[i] = { ...arr[i], features: arr[i].features.filter((_, j) => j !== featureIndex) }; set('plans.items', arr); }}
                                onChange={(featureIndex, value) => { const arr = [...config.plans.items]; const features = [...arr[i].features]; features[featureIndex] = value; arr[i] = { ...arr[i], features }; set('plans.items', arr); }}
                            />
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Diferenciais" icon={<Layers className="w-5 h-5 text-blue-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.differentials.label} onChange={v => set('differentials.label', v)} />
                    <TextField label="Título" value={config.differentials.title} onChange={v => set('differentials.title', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="CTA texto" value={config.differentials.ctaText} onChange={v => set('differentials.ctaText', v)} />
                        <TextField label="CTA link" value={config.differentials.ctaHref} onChange={v => set('differentials.ctaHref', v)} />
                    </div>
                    <TextItems
                        labelPath="differentials.label"
                        titlePath="differentials.title"
                        items={config.differentials.items}
                        label={config.differentials.label}
                        title={config.differentials.title}
                        set={set}
                        hideHeadingFields
                        onAdd={() => set('differentials.items', [...config.differentials.items, { title: '', text: '' }])}
                        onRemove={i => set('differentials.items', config.differentials.items.filter((_, j) => j !== i))}
                        onChange={(i, field, value) => { const arr = [...config.differentials.items]; arr[i] = { ...arr[i], [field]: value }; set('differentials.items', arr); }}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Recomendação / Prova Social" icon={<Sparkles className="w-5 h-5 text-amber-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.recommendation.label} onChange={v => set('recommendation.label', v)} />
                    <TextField label="Título" value={config.recommendation.title} onChange={v => set('recommendation.title', v)} />
                    <TextField label="Texto" textarea rows={3} value={config.recommendation.text} onChange={v => set('recommendation.text', v)} />
                    <ImageUploadField
                        label="Imagem"
                        value={config.recommendation.image}
                        pending={pendingUploads['recommendation.image']}
                        onSelect={file => handleImageSelect('recommendation.image', file)}
                        onClear={() => clearImage('recommendation.image')}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="CTA texto" value={config.recommendation.ctaText} onChange={v => set('recommendation.ctaText', v)} />
                        <TextField label="CTA link" value={config.recommendation.ctaHref} onChange={v => set('recommendation.ctaHref', v)} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Depoimentos" icon={<MessageCircle className="w-5 h-5 text-pink-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.testimonials.label} onChange={v => set('testimonials.label', v)} />
                    <TextField label="Título" value={config.testimonials.title} onChange={v => set('testimonials.title', v)} />
                    <TextField label="Subtítulo" textarea value={config.testimonials.subtitle} onChange={v => set('testimonials.subtitle', v)} />
                    <PeopleLikeItems
                        kind="testimonial"
                        items={config.testimonials.items}
                        basePath="testimonials.items"
                        pendingUploads={pendingUploads}
                        onImageSelect={handleImageSelect}
                        onImageClear={clearImage}
                        targetCount={TESTIMONIAL_TARGET_COUNT}
                        onFillToCount={() => {
                            const current = config.testimonials.items || [];
                            const next = [...current];
                            while (next.length < TESTIMONIAL_TARGET_COUNT) next.push(createEmptyTestimonial(next.length));
                            set('testimonials.items', next);
                        }}
                        onAdd={() => set('testimonials.items', [...config.testimonials.items, createEmptyTestimonial(config.testimonials.items.length)])}
                        onRemove={i => set('testimonials.items', config.testimonials.items.filter((_, j) => j !== i))}
                        onChange={(i, field, value) => { const arr = [...config.testimonials.items]; arr[i] = { ...arr[i], [field]: value }; set('testimonials.items', arr); }}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Nichos" icon={<ListChecks className="w-5 h-5 text-violet-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.niches.label} onChange={v => set('niches.label', v)} />
                    <TextField label="Título" value={config.niches.title} onChange={v => set('niches.title', v)} />
                    <TextField label="Subtítulo" textarea value={config.niches.subtitle} onChange={v => set('niches.subtitle', v)} />
                    <ImageUploadField
                        label="Imagem"
                        value={config.niches.image}
                        pending={pendingUploads['niches.image']}
                        onSelect={file => handleImageSelect('niches.image', file)}
                        onClear={() => clearImage('niches.image')}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="CTA texto" value={config.niches.ctaText} onChange={v => set('niches.ctaText', v)} />
                        <TextField label="CTA link" value={config.niches.ctaHref} onChange={v => set('niches.ctaHref', v)} />
                    </div>
                    <ArrayOfStrings title="Lista de nichos" items={config.niches.items} onAdd={() => addString('niches.items')} onRemove={i => removeString('niches.items', i)} onChange={(i, v) => updateStringArray('niches.items', i, v)} />
                </div>
            </SectionCard>

            <SectionCard title="Suporte WhatsApp" icon={<MessageCircle className="w-5 h-5 text-green-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.support.label} onChange={v => set('support.label', v)} />
                    <TextField label="Título" value={config.support.title} onChange={v => set('support.title', v)} />
                    <TextField label="Texto" textarea rows={3} value={config.support.text} onChange={v => set('support.text', v)} />
                    <ImageUploadField
                        label="Imagem"
                        value={config.support.image}
                        pending={pendingUploads['support.image']}
                        onSelect={file => handleImageSelect('support.image', file)}
                        onClear={() => clearImage('support.image')}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="CTA texto" value={config.support.ctaText} onChange={v => set('support.ctaText', v)} />
                        <TextField label="CTA link" value={config.support.ctaHref} onChange={v => set('support.ctaHref', v)} />
                    </div>
                    <ArrayOfStrings title="Bullets" items={config.support.bullets} onAdd={() => addString('support.bullets')} onRemove={i => removeString('support.bullets', i)} onChange={(i, v) => updateStringArray('support.bullets', i, v)} />
                </div>
            </SectionCard>

            <SectionCard title="Time" icon={<ListChecks className="w-5 h-5 text-cyan-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.team.label} onChange={v => set('team.label', v)} />
                    <TextField label="Título" value={config.team.title} onChange={v => set('team.title', v)} />
                    <PeopleLikeItems
                        kind="person"
                        items={config.team.items}
                        basePath="team.items"
                        pendingUploads={pendingUploads}
                        onImageSelect={handleImageSelect}
                        onImageClear={clearImage}
                        onAdd={() => set('team.items', [...config.team.items, { name: '', role: '', image: '' }])}
                        onRemove={i => set('team.items', config.team.items.filter((_, j) => j !== i))}
                        onChange={(i, field, value) => { const arr = [...config.team.items]; arr[i] = { ...arr[i], [field]: value }; set('team.items', arr); }}
                    />
                </div>
            </SectionCard>

            <SectionCard title="FAQ" icon={<HelpCircle className="w-5 h-5 text-purple-500" />}>
                <div className="space-y-4">
                    <TextField label="Label" value={config.faq.label} onChange={v => set('faq.label', v)} />
                    <TextField label="Título" value={config.faq.title} onChange={v => set('faq.title', v)} />
                    <TextField label="Subtítulo" textarea value={config.faq.subtitle} onChange={v => set('faq.subtitle', v)} />
                    <div className="flex justify-end">
                        <button onClick={() => set('faq.items', [...config.faq.items, { q: '', a: '' }])} className="text-xs flex items-center gap-1 text-indigo-600 font-bold"><Plus className="w-3 h-3" /> Adicionar pergunta</button>
                    </div>
                    {config.faq.items.map((item, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Pergunta #{i + 1}</span>
                                <button onClick={() => set('faq.items', config.faq.items.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <TextField label="Pergunta" value={item.q} onChange={v => { const arr = [...config.faq.items]; arr[i] = { ...arr[i], q: v }; set('faq.items', arr); }} />
                            <TextField label="Resposta" textarea rows={3} value={item.a} onChange={v => { const arr = [...config.faq.items]; arr[i] = { ...arr[i], a: v }; set('faq.items', arr); }} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="CTA Final" icon={<Target className="w-5 h-5 text-amber-500" />}>
                <div className="space-y-4">
                    <TextField label="Título" value={config.cta.title} onChange={v => set('cta.title', v)} />
                    <TextField label="Texto" textarea value={config.cta.text} onChange={v => set('cta.text', v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="CTA primário - texto" value={config.cta.primaryCta.text} onChange={v => set('cta.primaryCta.text', v)} />
                        <TextField label="CTA primário - link" value={config.cta.primaryCta.href} onChange={v => set('cta.primaryCta.href', v)} />
                        <TextField label="CTA secundário - texto" value={config.cta.secondaryCta.text} onChange={v => set('cta.secondaryCta.text', v)} />
                        <TextField label="CTA secundário - link" value={config.cta.secondaryCta.href} onChange={v => set('cta.secondaryCta.href', v)} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="SEO" icon={<Search className="w-5 h-5 text-slate-500" />}>
                <div className="space-y-4">
                    <TextField label="Título SEO" value={config.seo.title} onChange={v => set('seo.title', v)} />
                    <TextField label="Meta descrição" textarea rows={3} value={config.seo.description} onChange={v => set('seo.description', v)} />
                    <ImageUploadField
                        label="Imagem Open Graph"
                        value={config.seo.image}
                        pending={pendingUploads['seo.image']}
                        onSelect={file => handleImageSelect('seo.image', file)}
                        onClear={() => clearImage('seo.image')}
                    />
                </div>
            </SectionCard>
        </div>
    );
}

function ArrayOfStrings({ title, items, onAdd, onRemove, onChange }: {
    title: string;
    items: string[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    onChange: (index: number, value: string) => void;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>{title}</label>
                <button onClick={onAdd} className="text-xs flex items-center gap-1 text-indigo-600 font-bold"><Plus className="w-3 h-3" /> Adicionar</button>
            </div>
            <div className="space-y-2">
                {(items || []).map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-2">
                        <input className={inputClass} value={item} onChange={e => onChange(i, e.target.value)} />
                        <button onClick={() => onRemove(i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TextItems({ labelPath, titlePath, label, title, items, set, onAdd, onRemove, onChange, hideHeadingFields = false }: {
    labelPath: string;
    titlePath: string;
    label: string;
    title: string;
    items: TextItem[];
    set: (path: string, value: any) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onChange: (index: number, field: keyof TextItem, value: string) => void;
    hideHeadingFields?: boolean;
}) {
    return (
        <div className="space-y-4">
            {!hideHeadingFields && (
                <>
                    <TextField label="Label" value={label} onChange={v => set(labelPath, v)} />
                    <TextField label="Título" value={title} onChange={v => set(titlePath, v)} />
                </>
            )}
            <div className="flex justify-end">
                <button onClick={onAdd} className="text-xs flex items-center gap-1 text-indigo-600 font-bold"><Plus className="w-3 h-3" /> Adicionar item</button>
            </div>
            {(items || []).map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Item #{i + 1}</span>
                        <button onClick={() => onRemove(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <TextField label="Título" value={item.title} onChange={v => onChange(i, 'title', v)} />
                    <TextField label="Texto" textarea rows={3} value={item.text} onChange={v => onChange(i, 'text', v)} />
                </div>
            ))}
        </div>
    );
}

function PeopleLikeItems({ kind, items, basePath, pendingUploads, onImageSelect, onImageClear, onAdd, onRemove, onChange, targetCount, onFillToCount }: {
    kind: 'person' | 'testimonial';
    items: Array<any>;
    basePath: string;
    pendingUploads: Record<string, File>;
    onImageSelect: (path: string, file: File) => void;
    onImageClear: (path: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onChange: (index: number, field: string, value: string) => void;
    targetCount?: number;
    onFillToCount?: () => void;
}) {
    const imageField = 'image';
    const count = (items || []).length;
    const reachedTarget = Boolean(targetCount && count >= targetCount);
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {targetCount ? (
                    <span className="text-xs font-bold text-slate-500">
                        {count}/{targetCount} imagens configuradas
                    </span>
                ) : <span />}
                <div className="flex items-center gap-3">
                    {targetCount && onFillToCount && count < targetCount && (
                        <button onClick={onFillToCount} className="text-xs flex items-center gap-1 text-emerald-600 font-bold">
                            <Plus className="w-3 h-3" /> Completar {targetCount}
                        </button>
                    )}
                    <button
                        onClick={onAdd}
                        disabled={reachedTarget}
                        className="text-xs flex items-center gap-1 text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed font-bold"
                    >
                        <Plus className="w-3 h-3" /> {kind === 'testimonial' ? 'Adicionar imagem' : 'Adicionar'}
                    </button>
                </div>
            </div>
            {(items || []).map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Item #{i + 1}</span>
                        <button onClick={() => onRemove(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <TextField label="Nome" value={item.name || ''} onChange={v => onChange(i, 'name', v)} />
                        <TextField label="Cargo / descrição" value={item.role || ''} onChange={v => onChange(i, 'role', v)} />
                    </div>
                    <ImageUploadField
                        label={kind === 'testimonial' ? 'Imagem do print WhatsApp' : 'Imagem'}
                        value={item[imageField] || item.avatar || ''}
                        pending={pendingUploads[`${basePath}.${i}.${imageField}`]}
                        onSelect={file => onImageSelect(`${basePath}.${i}.${imageField}`, file)}
                        onClear={() => onImageClear(`${basePath}.${i}.${imageField}`)}
                        hint={kind === 'testimonial' ? 'Enviar print do WhatsApp' : 'Enviar foto'}
                    />
                    {kind === 'testimonial' && (
                        <>
                            <TextField label="Texto alternativo da imagem" value={item.alt || ''} onChange={v => onChange(i, 'alt', v)} placeholder="Print de WhatsApp com depoimento de cliente" />
                            <TextField label="Legenda curta" textarea rows={2} value={item.text || ''} onChange={v => onChange(i, 'text', v)} />
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
