import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, title, children, onClose, footer, closeOnBackdrop = true }: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode; closeOnBackdrop?: boolean }) {
    const panel = useRef<HTMLDivElement>(null);
    const previous = useRef<HTMLElement | null>(null);
    useEffect(() => {
        if (!open) return;
        previous.current = document.activeElement as HTMLElement;
        const handle = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key !== 'Tab' || !panel.current) return;
            const items = [...panel.current.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')].filter(item => !item.hasAttribute('disabled'));
            if (!items.length) return;
            const first = items[0]; const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', handle);
        requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('button,input,textarea,select')?.focus());
        return () => { document.removeEventListener('keydown', handle); previous.current?.focus(); };
    }, [open, onClose]);
    if (!open) return null;
    return <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button type="button" aria-label="Close dialog" className="modal-backdrop" onClick={closeOnBackdrop ? onClose : undefined} />
        <div ref={panel} className="modal-panel">
            <div className="modal-header"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={18}/></button></div>
            <div className="modal-body">{children}</div>{footer && <div className="modal-footer">{footer}</div>}
        </div>
    </div>;
}

export function PageHeader({ title, detail, action, parent = 'LMS Demo' }: { title: string; detail: string; action?: ReactNode; parent?: string }) {
    return <header className="page-header"><div><p className="breadcrumb">{parent} <span>/</span> {title}</p><h1>{title}</h1><p>{detail}</p></div>{action && <div className="page-actions">{action}</div>}</header>;
}

export function Tabs({ value, onChange, items }: { value: string; onChange: (value: string) => void; items: Array<{ value: string; label: string; count?: number }> }) {
    return <div className="tabs" role="tablist">{items.map(item => <button key={item.value} role="tab" aria-selected={value === item.value} className={value === item.value ? 'active' : ''} onClick={() => onChange(item.value)}>{item.label}{item.count !== undefined && <span>{item.count}</span>}</button>)}</div>;
}

export const Badge = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) => <span className={`badge badge-${tone}`}>{children}</span>;
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;
