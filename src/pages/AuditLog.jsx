import React, { useCallback, useEffect, useState } from 'react';
import { ScrollText, Trash2, RefreshCw } from 'lucide-react';
import { fetchAuditLog, deleteAuditLog, deleteAuditLogAll } from '../lib/api.js';
import { dateTime } from '../lib/format.js';
import { useToast } from '../components/Toast.jsx';

function actionColor(a) {
  const v = (a || '').toLowerCase();
  if (v === 'delete') return { bg: '#FEE2E2', fg: '#991B1B' };
  if (v === 'create') return { bg: '#D1FAE5', fg: '#065F46' };
  if (v === 'update') return { bg: '#DBEAFE', fg: '#1E40AF' };
  return { bg: '#FEF3C7', fg: '#92400E' };
}

export default function AuditLog() {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { items, error } = await fetchAuditLog({ limit: 500 });
    if (error) show?.(error.message, 'error');
    setItems(Array.isArray(items) ? items : []);
    setLoading(false);
  }, [show]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const remove = async (row) => {
    if (!confirm('Delete this audit entry?')) return;
    const { error } = await deleteAuditLog(row.id);
    if (error) return show?.(error.message, 'error');
    show?.('Deleted', 'success');
    load();
  };

  const clearAll = async () => {
    if (!confirm('Delete ALL audit logs? This cannot be undone.')) return;
    if (!confirm('Are you REALLY sure?')) return;
    const { error } = await deleteAuditLogAll();
    if (error) return show?.(error.message, 'error');
    show?.('All logs cleared', 'success');
    load();
  };

  return (
    <div className="page-enter" style={{ padding: 16, paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Audit log</h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {loading ? 'Loading…' : `${items.length} entries`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} className="neu-btn" style={{ padding: 10, borderRadius: 10 }} title="Refresh">
            <RefreshCw size={14} style={{ color: '#6366F1' }} />
          </button>
          <button onClick={clearAll} className="neu-btn" style={{ padding: 10, borderRadius: 10, color: '#DC2626' }} title="Clear all">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="neu-card muted" style={{ padding: 30, textAlign: 'center' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div className="neu-card" style={{ padding: 30, textAlign: 'center' }}>
          <ScrollText size={30} style={{ color: '#97A0B5', marginBottom: 8 }} />
          <div className="muted">No audit entries yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((r) => {
            const c = actionColor(r.action);
            return (
              <div key={r.id} className="neu-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="neu-badge" style={{ background: c.bg, color: c.fg }}>
                        {(r.action || '—').toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{r.actor || 'admin'}</span>
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>
                      {dateTime(r.created_at)}
                    </div>
                  </div>
                  <button onClick={() => remove(r)} className="neu-btn"
                    style={{ padding: 8, color: '#DC2626' }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
                  <Cell label="Table" value={r.table_name} />
                  <Cell label="Record" value={String(r.record_id || '').slice(0, 12)} mono />
                </div>

                {r.before_data && (
                  <div className="neu-card-inset" style={{ padding: 10, marginTop: 8 }}>
                    <div className="muted" style={{ fontSize: 9.5, fontWeight: 800, marginBottom: 3 }}>BEFORE</div>
                    <div style={{ fontSize: 10.5, fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
                      {JSON.stringify(r.before_data).slice(0, 200)}
                    </div>
                  </div>
                )}
                {r.after_data && (
                  <div className="neu-card-inset" style={{ padding: 10, marginTop: 6 }}>
                    <div className="muted" style={{ fontSize: 9.5, fontWeight: 800, marginBottom: 3 }}>AFTER</div>
                    <div style={{ fontSize: 10.5, fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>
                      {JSON.stringify(r.after_data).slice(0, 200)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <div className="muted" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: .4, marginBottom: 2 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 11.5, fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value}
      </div>
    </div>
  );
}
