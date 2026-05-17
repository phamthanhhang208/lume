// lume-verdict.jsx — Verdict screen, 2 variants

// Variant A: Sort tray — 3 columns (works / neutral / skip)
function VerdictSortTray({ onNavigate, tagStyle = 'chip' }) {
  const grouped = { works: [], neutral: [], skip: [] };
  PRODUCTS.forEach((p) => {
    const v = VERDICTS[p.id];
    if (!v) return;
    grouped[v.v].push({ p, v });
  });

  const columns = [
    { key: 'works', label: 'works', sub: 'keep these', color: LUME.sageDeep, bg: 'rgba(168,184,156,.18)' },
    { key: 'neutral', label: 'neutral', sub: 'optional', color: LUME.ochre, bg: 'rgba(217,164,91,.18)' },
    { key: 'skip', label: 'skip', sub: 'pause for now', color: LUME.terracottaDeep, bg: 'rgba(201,136,106,.18)' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: 20 }}>
      <div style={{ paddingTop: 56, padding: '56px 22px 8px', position: 'relative' }}>
        <button onClick={() => onNavigate('home')} style={{
          position: 'absolute', top: 56, right: 18,
          width: 32, height: 32, borderRadius: 999, border: 'none',
          background: 'rgba(60,40,20,.7)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
        </button>
        <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          your verdict · mar 29
        </div>
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 36, color: LUME.ink, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>
          what's working
        </div>
        <Underline width={120} color={LUME.terracotta} strokeWidth={3} style={{ marginTop: 2 }} />
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: LUME.inkSoft, marginTop: 8, lineHeight: 1.4 }}>
          we sorted your 8 products against your latest scan. tap any to see why.
        </div>
      </div>

      <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {columns.map((col) => (
          <div key={col.key} style={{ position: 'relative' }}>
            {/* Pile header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginLeft: 6, marginBottom: 4 }}>
              <div style={{
                fontFamily: 'Caveat, cursive', fontSize: 24, fontWeight: 700,
                color: col.color, lineHeight: 1,
              }}>{col.label}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: LUME.inkSoft }}>{col.sub}</div>
              <div style={{ flex: 1, borderTop: '1.5px dashed rgba(40,35,28,.16)', marginBottom: 4 }} />
              <div style={{
                fontFamily: 'Courier Prime, monospace', fontSize: 11, color: col.color, fontWeight: 700,
                background: col.bg, padding: '2px 8px', borderRadius: 999,
              }}>{grouped[col.key].length}</div>
            </div>
            {/* Tray */}
            <div style={{
              background: col.bg, border: `1.5px dashed ${col.color}`, borderRadius: 14,
              padding: '12px 10px', minHeight: 110, position: 'relative',
              display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap',
            }}>
              {grouped[col.key].map(({ p, v }, i) => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <ProductSticker
                    product={p}
                    rotate={((i % 3) - 1) * 3}
                    size={68}
                    onClick={() => onNavigate('product', p)}
                    badge={<VerdictTag verdict={v.v} style={tagStyle} />}
                  />
                </div>
              ))}
              {grouped[col.key].length === 0 && (
                <div style={{
                  flex: 1, textAlign: 'center', padding: '20px 0',
                  fontFamily: 'Caveat, cursive', fontSize: 16, color: LUME.inkFaint,
                }}>nothing here · nice</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI signature */}
      <div style={{
        margin: '0 22px 18px', padding: '12px 14px',
        background: LUME.ink, color: LUME.cream, borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Sparkle size={22} color={LUME.ochre} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 18, fontWeight: 600, lineHeight: 1 }}>
            gemini · skim'd your data
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10.5, opacity: .8, marginTop: 3 }}>
            14 scan metrics + 96 ingredients → 8 verdicts in 2.1s
          </div>
        </div>
        <button onClick={() => onNavigate('look')} style={{
          padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(244,237,224,.4)',
          background: 'transparent', color: LUME.cream, cursor: 'pointer',
          fontFamily: 'Courier Prime, monospace', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
        }}>look →</button>
      </div>
    </div>
  );
}

// Variant B: Report card — letter format, all on one journal page
function VerdictReportCard({ onNavigate, tagStyle = 'chip' }) {
  const cards = PRODUCTS.map((p) => ({ p, v: VERDICTS[p.id] })).filter((x) => x.v);

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: 20 }}>
      <div style={{ paddingTop: 56, padding: '56px 22px 8px', position: 'relative' }}>
        <button onClick={() => onNavigate('home')} style={{
          position: 'absolute', top: 56, right: 18,
          width: 32, height: 32, borderRadius: 999, border: 'none',
          background: 'rgba(60,40,20,.7)', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
        </button>
        <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          report card · mar 29
        </div>
        <div style={{ fontFamily: 'Caveat, cursive', fontSize: 36, color: LUME.ink, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>
          per-product read
        </div>
        <Underline width={120} color={LUME.terracotta} strokeWidth={3} style={{ marginTop: 2 }} />
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 16px 10px' }}>
        {[
          { count: 5, label: 'works', color: LUME.sageDeep, bg: 'rgba(168,184,156,.22)' },
          { count: 2, label: 'neutral', color: LUME.ochre, bg: 'rgba(217,164,91,.22)' },
          { count: 1, label: 'skip', color: LUME.terracottaDeep, bg: 'rgba(201,136,106,.22)' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: '10px 10px', borderRadius: 10,
            background: s.bg, border: `1px solid ${s.color}`,
            transform: `rotate(${(i - 1) * 0.5}deg)`,
          }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 30, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .8, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Card stack */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cards.map(({ p, v }, i) => {
          const Svg = PRODUCT_SVGS[p.kind];
          const rot = ((i % 3) - 1) * 0.6;
          return (
            <div key={p.id} onClick={() => onNavigate('product', p)} style={{
              position: 'relative',
              background: LUME.paper, borderRadius: 12,
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.06)',
              border: '1px solid rgba(40,35,28,.10)',
              transform: `rotate(${rot}deg)`,
              cursor: 'pointer',
            }}>
              {/* corner tape on top-right */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 56, height: 64, flexShrink: 0,
                  background: '#fff', border: '1px solid rgba(40,35,28,.10)', borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `rotate(${rot * -3}deg)`,
                }}>
                  <Svg size={44} hue={p.hue} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .6, textTransform: 'uppercase' }}>{p.brand}</div>
                      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>{p.name}</div>
                    </div>
                    <VerdictTag verdict={v.v} style={tagStyle} />
                  </div>
                  <div style={{
                    marginTop: 6,
                    fontFamily: 'Inter, sans-serif', fontSize: 12, color: LUME.ink,
                    lineHeight: 1.45,
                  }}>{v.reason}</div>
                  <div style={{
                    marginTop: 4, display: 'inline-block',
                    fontFamily: 'Courier Prime, monospace', fontSize: 9.5, color: LUME.inkSoft,
                    background: 'rgba(20,18,14,.04)', padding: '2px 6px', borderRadius: 4,
                    letterSpacing: .3,
                  }}>{v.delta}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '0 22px 14px' }}>
        <button onClick={() => onNavigate('look')} style={{
          width: '100%', padding: '14px 22px', borderRadius: 14,
          background: LUME.ink, color: '#F4EDE0', cursor: 'pointer', border: 'none',
          fontFamily: 'Courier Prime, monospace', fontSize: 12, fontWeight: 700,
          letterSpacing: 1.6, textTransform: 'uppercase',
          boxShadow: '0 4px 14px rgba(20,18,14,.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Sparkle size={16} color={LUME.ochre} /> build a look with the ✓ pile
        </button>
      </div>
    </div>
  );
}

function VerdictScreen({ variant = 'tray', ...props }) {
  if (variant === 'card') return <VerdictReportCard {...props} />;
  return <VerdictSortTray {...props} />;
}

Object.assign(window, { VerdictScreen, VerdictSortTray, VerdictReportCard });
