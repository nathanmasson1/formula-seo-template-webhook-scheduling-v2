import React, { useEffect, useState } from 'react';
import {
    AlertCircle, BriefcaseBusiness, ChevronDown, ChevronUp, HelpCircle, Image as ImageIcon,
    Layers, ListChecks, Loader2, MonitorSmartphone, Plus, Save, Search, Sparkles, Trash2, Upload,
} from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

type CTA = { text: string; href: string };
type Stat = { number: string; label: string };
type TextItem = { title: string; text: string; image?: string; imageSize?: string; imagePosition?: string; link?: string };
type StepItem = { step: string; title: string; text: string };
type FaqItem = { q: string; a: string };

type CriacaoSitesConfig = {
    seo: { title: string; description: string; image: string };
    hero: {
        label: string; title: string; titleAccent: string; subtitle: string; image: string;
        primaryCta: CTA; secondaryCta: CTA; stats: Stat[];
    };
    intro: { label: string; title: string; text: string; image: string; cta: CTA };
    pricingBanner: { title: string; text: string; priceLabel: string; price: string; cta: CTA };
    benefits: { label: string; title: string; subtitle: string; items: TextItem[] };
    services: { label: string; title: string; subtitle: string; items: TextItem[] };
    package: { label: string; title: string; text: string; image: string; bullets: string[] };
    process: { label: string; title: string; items: StepItem[] };
    presence: { label: string; title: string; subtitle: string; heading: string; highlight: string; text: string; image: string; cta: CTA };
    faq: { label: string; title: string; subtitle: string; items: FaqItem[] };
    cta: { title: string; text: string; primaryCta: CTA; secondaryCta: CTA };
};

const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm";
const labelClass = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5";

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

function ImageUploadField({ label, value, pending, onSelect, onClear }: {
    label: string;
    value: string;
    pending?: File;
    onSelect: (file: File) => void;
    onClear: () => void;
}) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <label className="group relative border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center overflow-hidden min-h-[150px]">
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
                {value ? (
                    <>
                        <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-55 transition-opacity" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 backdrop-blur-sm">
                            <Upload className="w-8 h-8 text-slate-800" />
                            <span className="text-xs font-bold text-slate-900 mt-1">Trocar imagem</span>
                        </div>
                    </>
                ) : (
                    <div className="py-6 flex flex-col items-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <ImageIcon className="w-8 h-8 mb-2" />
                        <span className="text-xs font-bold">Enviar imagem</span>
                    </div>
                )}
            </label>
            <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 break-all">
                    {pending ? `Upload pendente: ${pending.name}` : (value || 'Nenhuma imagem selecionada')}
                </span>
                {value && (
                    <button type="button" onClick={onClear} className="text-[10px] font-bold text-red-500 hover:text-red-700">
                        Remover
                    </button>
                )}
            </div>
        </div>
    );
}

export default function CriacaoSitesEditor() {
    const [config, setConfig] = useState<CriacaoSitesConfig | null>(null);
    const [fileSha, setFileSha] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});

    useEffect(() => {
        githubApi('read', 'src/data/criacaoSites.json')
            .then(data => {
                setConfig(JSON.parse(data?.content || '{}'));
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

    const set = (path: string, value: any) => {
        setConfig(prev => {
            if (!prev) return prev;
            const clone = JSON.parse(JSON.stringify(prev));
            setPathOnObject(clone, path, value);
            return clone;
        });
    };

    const addItem = (path: string, item: any) => {
        setConfig(prev => {
            if (!prev) return prev;
            const clone = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let obj: any = clone;
            for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
            obj[keys[keys.length - 1]] = [...(obj[keys[keys.length - 1]] || []), item];
            return clone;
        });
    };

    const removeItem = (path: string, index: number) => {
        setConfig(prev => {
            if (!prev) return prev;
            const clone = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let obj: any = clone;
            for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
            obj[keys[keys.length - 1]] = (obj[keys[keys.length - 1]] || []).filter((_: any, i: number) => i !== index);
            return clone;
        });
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
        const ghPath = `public/images/criacao-sites-${fieldSlug}-${Date.now()}-${safeName}.${ext}`;
        await githubApi('write', ghPath, {
            content: base64Content,
            isBase64: true,
            message: `Upload imagem criação de sites ${ghPath}`,
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
        triggerToast('Salvando página Criação de Sites...', 'progress', 20);
        try {
            const configToSave = JSON.parse(JSON.stringify(config));
            const uploads = Object.entries(pendingUploads);
            for (let i = 0; i < uploads.length; i++) {
                const [fieldPath, file] = uploads[i];
                triggerToast(`Enviando imagem ${i + 1}/${uploads.length}...`, 'progress', Math.min(80, 20 + i * 10));
                const uploadedPath = await uploadImage(fieldPath, file);
                setPathOnObject(configToSave, fieldPath, uploadedPath);
            }
            const data = await githubApi('write', 'src/data/criacaoSites.json', {
                content: JSON.stringify(configToSave, null, 2),
                sha: fileSha || undefined,
                message: 'CMS: Update criacaoSites.json',
            });
            setFileSha(data.sha);
            setConfig(configToSave);
            setPendingUploads({});
            triggerToast('Página Criação de Sites atualizada!', 'success', 100);
        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    if (!config) return <div className="p-8 text-red-600">Erro ao carregar criacaoSites.json</div>;

    const renderTextItems = (path: 'benefits.items' | 'services.items', items: TextItem[]) => (
        <div className="space-y-3">
            {(items || []).map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Item #{i + 1}</span>
                        <button onClick={() => removeItem(path, i)} className="text-red-500 hover:bg-red-50 rounded p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <TextField label="Título" value={item.title} onChange={value => {
                        const arr = [...items]; arr[i] = { ...arr[i], title: value }; set(path, arr);
                    }} />
                    <TextField label="Texto" value={item.text} textarea rows={3} onChange={value => {
                        const arr = [...items]; arr[i] = { ...arr[i], text: value }; set(path, arr);
                    }} />
                </div>
            ))}
        </div>
    );

    const renderPortfolioItems = (items: TextItem[]) => (
        <div className="space-y-4">
            {(items || []).map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Projeto #{i + 1}</span>
                        <button onClick={() => removeItem('services.items', i)} className="text-red-500 hover:bg-red-50 rounded p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    <div className="grid grid-cols-[220px_1fr] gap-4 items-start">
                        <ImageUploadField
                            label="Foto do projeto"
                            value={item.image || ''}
                            pending={pendingUploads[`services.items.${i}.image`]}
                            onSelect={file => handleImageSelect(`services.items.${i}.image`, file)}
                            onClear={() => clearImage(`services.items.${i}.image`)}
                        />
                        <div className="space-y-3">
                            <TextField label="Título" value={item.title} onChange={value => {
                                const arr = [...items]; arr[i] = { ...arr[i], title: value }; set('services.items', arr);
                            }} />
                            <TextField label="Texto" value={item.text} textarea rows={2} onChange={value => {
                                const arr = [...items]; arr[i] = { ...arr[i], text: value }; set('services.items', arr);
                            }} />
                            <TextField label="Link do projeto" value={item.link || ''} placeholder="#" onChange={value => {
                                const arr = [...items]; arr[i] = { ...arr[i], link: value }; set('services.items', arr);
                            }} />
                            <div className="grid grid-cols-2 gap-3">
                                <TextField label="Tamanho da imagem" value={item.imageSize || 'cover'} placeholder="cover ou 400% 200%" onChange={value => {
                                    const arr = [...items]; arr[i] = { ...arr[i], imageSize: value }; set('services.items', arr);
                                }} />
                                <TextField label="Posição da imagem" value={item.imagePosition || 'center'} placeholder="center, 0% 0%, 100% 100%" onChange={value => {
                                    const arr = [...items]; arr[i] = { ...arr[i], imagePosition: value }; set('services.items', arr);
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 pb-32">
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl p-5 px-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-0 z-40">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Editor da Página Criação de Sites</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Edite textos, imagens e CTAs da página /criacao-de-sites</p>
                </div>
                <button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-700 rounded-xl font-bold"><AlertCircle className="w-4 h-4 inline mr-2" />{error}</div>}

            <SectionCard title="Hero" icon={<Sparkles className="w-5 h-5 text-amber-500" />} defaultOpen>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <TextField label="Etiqueta" value={config.hero.label} onChange={value => set('hero.label', value)} />
                        <TextField label="Título" value={config.hero.title} onChange={value => set('hero.title', value)} />
                        <TextField label="Título acento" value={config.hero.titleAccent} onChange={value => set('hero.titleAccent', value)} />
                        <TextField label="Subtítulo" value={config.hero.subtitle} textarea rows={4} onChange={value => set('hero.subtitle', value)} />
                    </div>
                    <ImageUploadField label="Imagem do hero" value={config.hero.image} pending={pendingUploads['hero.image']} onSelect={file => handleImageSelect('hero.image', file)} onClear={() => clearImage('hero.image')} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <TextField label="CTA principal - texto" value={config.hero.primaryCta.text} onChange={value => set('hero.primaryCta.text', value)} />
                    <TextField label="CTA principal - link" value={config.hero.primaryCta.href} onChange={value => set('hero.primaryCta.href', value)} />
                    <TextField label="CTA secundário - texto" value={config.hero.secondaryCta.text} onChange={value => set('hero.secondaryCta.text', value)} />
                    <TextField label="CTA secundário - link" value={config.hero.secondaryCta.href} onChange={value => set('hero.secondaryCta.href', value)} />
                </div>
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                        <label className={labelClass}>Estatísticas</label>
                        <button onClick={() => addItem('hero.stats', { number: '', label: '' })} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold">
                            <Plus className="w-3 h-3" /> Adicionar
                        </button>
                    </div>
                    <div className="space-y-2">
                        {(config.hero.stats || []).map((stat, i) => (
                            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                                <input className={inputClass} placeholder="Número" value={stat.number} onChange={e => {
                                    const arr = [...config.hero.stats]; arr[i] = { ...arr[i], number: e.target.value }; set('hero.stats', arr);
                                }} />
                                <input className={inputClass} placeholder="Legenda" value={stat.label} onChange={e => {
                                    const arr = [...config.hero.stats]; arr[i] = { ...arr[i], label: e.target.value }; set('hero.stats', arr);
                                }} />
                                <button onClick={() => removeItem('hero.stats', i)} className="text-red-500 hover:bg-red-50 rounded-lg px-2 py-3"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Bloco de Introdução" icon={<MonitorSmartphone className="w-5 h-5 text-blue-500" />}>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <TextField label="Etiqueta" value={config.intro.label} onChange={value => set('intro.label', value)} />
                        <TextField label="Título" value={config.intro.title} onChange={value => set('intro.title', value)} />
                        <TextField label="Texto" value={config.intro.text} textarea rows={5} onChange={value => set('intro.text', value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <TextField label="CTA texto" value={config.intro.cta.text} onChange={value => set('intro.cta.text', value)} />
                            <TextField label="CTA link" value={config.intro.cta.href} onChange={value => set('intro.cta.href', value)} />
                        </div>
                    </div>
                    <ImageUploadField label="Imagem da introdução" value={config.intro.image} pending={pendingUploads['intro.image']} onSelect={file => handleImageSelect('intro.image', file)} onClear={() => clearImage('intro.image')} />
                </div>
            </SectionCard>

            <SectionCard title="Faixa de Preço / Orçamento" icon={<Sparkles className="w-5 h-5 text-green-500" />} defaultOpen>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="Título esquerdo" value={config.pricingBanner?.title || ''} onChange={value => set('pricingBanner.title', value)} />
                        <TextField label="Label do preço" value={config.pricingBanner?.priceLabel || ''} onChange={value => set('pricingBanner.priceLabel', value)} />
                    </div>
                    <TextField label="Texto esquerdo" value={config.pricingBanner?.text || ''} textarea rows={3} onChange={value => set('pricingBanner.text', value)} />
                    <div className="grid grid-cols-3 gap-4">
                        <TextField label="Preço" value={config.pricingBanner?.price || ''} onChange={value => set('pricingBanner.price', value)} />
                        <TextField label="CTA texto" value={config.pricingBanner?.cta?.text || ''} onChange={value => set('pricingBanner.cta.text', value)} />
                        <TextField label="CTA link" value={config.pricingBanner?.cta?.href || ''} onChange={value => set('pricingBanner.cta.href', value)} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Pilares / Diferenciais" icon={<ListChecks className="w-5 h-5 text-emerald-500" />}>
                <div className="space-y-4">
                    <TextField label="Etiqueta" value={config.benefits.label} onChange={value => set('benefits.label', value)} />
                    <TextField label="Título" value={config.benefits.title} onChange={value => set('benefits.title', value)} />
                    <TextField label="Subtítulo" value={config.benefits.subtitle} textarea rows={3} onChange={value => set('benefits.subtitle', value)} />
                    <div className="flex justify-end">
                        <button onClick={() => addItem('benefits.items', { title: '', text: '' })} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold">
                            <Plus className="w-3 h-3" /> Adicionar pilar
                        </button>
                    </div>
                    {renderTextItems('benefits.items', config.benefits.items)}
                </div>
            </SectionCard>

            <SectionCard title="Vitrine de Portfólio" icon={<BriefcaseBusiness className="w-5 h-5 text-violet-500" />} defaultOpen>
                <div className="space-y-4">
                    <TextField label="Etiqueta" value={config.services.label} onChange={value => set('services.label', value)} />
                    <TextField label="Título" value={config.services.title} onChange={value => set('services.title', value)} />
                    <TextField label="Subtítulo" value={config.services.subtitle} textarea rows={3} onChange={value => set('services.subtitle', value)} />
                    <div className="flex justify-end">
                        <button onClick={() => addItem('services.items', { title: 'Novo projeto', text: 'Layout 100% personalizado e desenvolvido em WordPress', image: '', imageSize: 'cover', imagePosition: 'center', link: '#' })} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold">
                            <Plus className="w-3 h-3" /> Adicionar projeto
                        </button>
                    </div>
                    {renderPortfolioItems(config.services.items)}
                </div>
            </SectionCard>

            <SectionCard title="Pacote Incluso" icon={<Layers className="w-5 h-5 text-orange-500" />}>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <TextField label="Etiqueta" value={config.package.label} onChange={value => set('package.label', value)} />
                        <TextField label="Título" value={config.package.title} onChange={value => set('package.title', value)} />
                        <TextField label="Texto" value={config.package.text} textarea rows={4} onChange={value => set('package.text', value)} />
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelClass}>Bullets</label>
                                <button onClick={() => addItem('package.bullets', '')} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold">
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(config.package.bullets || []).map((item, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_auto] gap-2">
                                        <input className={inputClass} value={item} onChange={e => {
                                            const arr = [...config.package.bullets]; arr[i] = e.target.value; set('package.bullets', arr);
                                        }} />
                                        <button onClick={() => removeItem('package.bullets', i)} className="text-red-500 hover:bg-red-50 rounded-lg px-2"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <ImageUploadField label="Imagem do pacote" value={config.package.image} pending={pendingUploads['package.image']} onSelect={file => handleImageSelect('package.image', file)} onClear={() => clearImage('package.image')} />
                </div>
            </SectionCard>

            <SectionCard title="Processo" icon={<ListChecks className="w-5 h-5 text-cyan-500" />}>
                <div className="space-y-4">
                    <TextField label="Etiqueta" value={config.process.label} onChange={value => set('process.label', value)} />
                    <TextField label="Título" value={config.process.title} onChange={value => set('process.title', value)} />
                    <div className="flex justify-end">
                        <button onClick={() => addItem('process.items', { step: '', title: '', text: '' })} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold">
                            <Plus className="w-3 h-3" /> Adicionar etapa
                        </button>
                    </div>
                    {(config.process.items || []).map((item, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Etapa #{i + 1}</span>
                                <button onClick={() => removeItem('process.items', i)} className="text-red-500 hover:bg-red-50 rounded p-1"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            <div className="grid grid-cols-[0.4fr_1fr] gap-2">
                                <TextField label="Número" value={item.step} onChange={value => {
                                    const arr = [...config.process.items]; arr[i] = { ...arr[i], step: value }; set('process.items', arr);
                                }} />
                                <TextField label="Título" value={item.title} onChange={value => {
                                    const arr = [...config.process.items]; arr[i] = { ...arr[i], title: value }; set('process.items', arr);
                                }} />
                            </div>
                            <TextField label="Texto" value={item.text} textarea rows={3} onChange={value => {
                                const arr = [...config.process.items]; arr[i] = { ...arr[i], text: value }; set('process.items', arr);
                            }} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Presença Nacional / Mapa" icon={<MonitorSmartphone className="w-5 h-5 text-green-500" />} defaultOpen>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <TextField label="Etiqueta" value={config.presence?.label || ''} onChange={value => set('presence.label', value)} />
                        <TextField label="Título da seção" value={config.presence?.title || ''} onChange={value => set('presence.title', value)} />
                        <TextField label="Subtítulo da seção" value={config.presence?.subtitle || ''} textarea rows={2} onChange={value => set('presence.subtitle', value)} />
                        <TextField label="Título do texto lateral" value={config.presence?.heading || ''} onChange={value => set('presence.heading', value)} />
                        <TextField label="Trecho destacado em verde" value={config.presence?.highlight || ''} placeholder="50 cidades" onChange={value => set('presence.highlight', value)} />
                        <TextField label="Texto" value={config.presence?.text || ''} textarea rows={7} onChange={value => set('presence.text', value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <TextField label="CTA texto" value={config.presence?.cta?.text || ''} onChange={value => set('presence.cta.text', value)} />
                            <TextField label="CTA link" value={config.presence?.cta?.href || ''} onChange={value => set('presence.cta.href', value)} />
                        </div>
                    </div>
                    <ImageUploadField
                        label="Imagem do mapa"
                        value={config.presence?.image || ''}
                        pending={pendingUploads['presence.image']}
                        onSelect={file => handleImageSelect('presence.image', file)}
                        onClear={() => clearImage('presence.image')}
                    />
                </div>
            </SectionCard>

            <SectionCard title="FAQ" icon={<HelpCircle className="w-5 h-5 text-purple-500" />}>
                <div className="space-y-4">
                    <TextField label="Etiqueta" value={config.faq.label} onChange={value => set('faq.label', value)} />
                    <TextField label="Título" value={config.faq.title} onChange={value => set('faq.title', value)} />
                    <TextField label="Subtítulo" value={config.faq.subtitle} textarea rows={3} onChange={value => set('faq.subtitle', value)} />
                    <div className="flex justify-end">
                        <button onClick={() => addItem('faq.items', { q: '', a: '' })} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold">
                            <Plus className="w-3 h-3" /> Adicionar pergunta
                        </button>
                    </div>
                    {(config.faq.items || []).map((item, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Pergunta #{i + 1}</span>
                                <button onClick={() => removeItem('faq.items', i)} className="text-red-500 hover:bg-red-50 rounded p-1"><Trash2 className="w-3 h-3" /></button>
                            </div>
                            <TextField label="Pergunta" value={item.q} onChange={value => {
                                const arr = [...config.faq.items]; arr[i] = { ...arr[i], q: value }; set('faq.items', arr);
                            }} />
                            <TextField label="Resposta" value={item.a} textarea rows={3} onChange={value => {
                                const arr = [...config.faq.items]; arr[i] = { ...arr[i], a: value }; set('faq.items', arr);
                            }} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="CTA Final" icon={<Sparkles className="w-5 h-5 text-fuchsia-500" />}>
                <div className="space-y-4">
                    <TextField label="Título" value={config.cta.title} onChange={value => set('cta.title', value)} />
                    <TextField label="Texto" value={config.cta.text} textarea rows={3} onChange={value => set('cta.text', value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <TextField label="CTA principal - texto" value={config.cta.primaryCta.text} onChange={value => set('cta.primaryCta.text', value)} />
                        <TextField label="CTA principal - link" value={config.cta.primaryCta.href} onChange={value => set('cta.primaryCta.href', value)} />
                        <TextField label="CTA secundário - texto" value={config.cta.secondaryCta.text} onChange={value => set('cta.secondaryCta.text', value)} />
                        <TextField label="CTA secundário - link" value={config.cta.secondaryCta.href} onChange={value => set('cta.secondaryCta.href', value)} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="SEO" icon={<Search className="w-5 h-5 text-slate-500" />}>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <TextField label="Título SEO" value={config.seo.title} onChange={value => set('seo.title', value)} />
                        <TextField label="Meta descrição" value={config.seo.description} textarea rows={4} onChange={value => set('seo.description', value)} />
                        <TextField label="Imagem Open Graph (URL)" value={config.seo.image} onChange={value => set('seo.image', value)} />
                    </div>
                    <ImageUploadField label="Imagem SEO" value={config.seo.image} pending={pendingUploads['seo.image']} onSelect={file => handleImageSelect('seo.image', file)} onClear={() => clearImage('seo.image')} />
                </div>
            </SectionCard>
        </div>
    );
}
