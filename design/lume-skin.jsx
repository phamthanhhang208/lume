// lume-skin.jsx — Skin Analysis flow

function SkinAnalysisScreen({ onNavigate, step: initialStep = 0 }) {
  const [step, setStep] = React.useState(initialStep);

  const Header = ({ title, subtitle, closeTo = 'home' }) => (
    <div style={{ paddingTop: 56, paddingBottom: 10, paddingLeft: 22, paddingRight: 22, position: 'relative' }}>
      <button onClick={() => onNavigate(closeTo)} style={{
        position: 'absolute', top: 56, right: 18,
        width: 32, height: 32, borderRadius: 999, border: 'none',
        background: 'rgba(60,40,20,.7)', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
      </button>
      <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>
        skin check · today
      </div>
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 32, color: LUME.ink, fontWeight: 600, lineHeight: 1.1, marginTop: 2 }}>{title}</div>
      <Underline width={56} color={LUME.sageDeep} style={{ marginTop: 2 }} />
      {subtitle && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: LUME.inkSoft, marginTop: 6, lineHeight: 1.4 }}>{subtitle}</div>}
    </div>
  );

  // ───── Step 0: capture ─────
  if (step === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Header title="hold still" subtitle="natural light · no makeup · face the camera straight on." />
        <div style={{ padding: '4px 22px 22px' }}>
          <div style={{
            position: 'relative',
            background: '#1A1410',
            borderRadius: 18,
            aspectRatio: '3/4',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,.25)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 38%, #5C4938, #1A1410 70%)' }} />
            <div style={{
              position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
            }}>
              <SelfiePlaceholder size={210} />
            </div>
            {/* oval guide */}
            <div style={{
              position: 'absolute', top: '10%', left: '20%', right: '20%', bottom: '20%',
              border: '2px dashed rgba(244,237,224,.7)',
              borderRadius: '50%',
            }} />
            {/* corner brackets */}
            {[['T','L'],['T','R'],['B','L'],['B','R']].map(([v,h]) => (
              <div key={v+h} style={{
                position: 'absolute',
                [v === 'T' ? 'top' : 'bottom']: 18,
                [h === 'L' ? 'left' : 'right']: 18,
                width: 22, height: 22,
                borderTop: v === 'T' ? '2px solid #F4EDE0' : 'none',
                borderBottom: v === 'B' ? '2px solid #F4EDE0' : 'none',
                borderLeft: h === 'L' ? '2px solid #F4EDE0' : 'none',
                borderRight: h === 'R' ? '2px solid #F4EDE0' : 'none',
                borderRadius: 4,
              }} />
            ))}
            <div style={{
              position: 'absolute', bottom: 16, left: 16, right: 16,
              padding: '8px 12px',
              background: 'rgba(244,237,224,.92)',
              borderRadius: 10,
              fontFamily: 'Caveat, cursive', fontSize: 16, color: LUME.ink,
              textAlign: 'center', lineHeight: 1.1,
            }}>perfect corp will read 14 metrics ✨</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 22 }}>
            <button onClick={() => onNavigate('home')} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'Courier Prime, monospace', fontSize: 11,
              color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase',
            }}>use saved selfie</button>
            <button onClick={() => setStep(1)} style={{
              width: 72, height: 72, borderRadius: 999,
              border: '4px solid #FFFFFF', background: LUME.sageDeep,
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(124,145,112,.5)',
            }} />
            <div style={{ width: 60 }} />
          </div>
        </div>
      </div>
    );
  }

  // ───── Step 1: analyzing ─────
  if (step === 1) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Header title="reading…" subtitle="14 metrics · pores · texture · firmness · radiance · …" />
        <div style={{ padding: '8px 22px 22px' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '14px 0' }}>
            <div style={{
              position: 'relative',
              width: 220, height: 280,
              background: LUME.paper, borderRadius: 12,
              boxShadow: '0 4px 18px rgba(20,18,14,.16)',
              border: '1px solid rgba(40,35,28,.10)',
              padding: 12,
              transform: 'rotate(-1.5deg)',
              overflow: 'hidden',
            }}>
              <SelfiePlaceholder size={200} style={{ borderRadius: 8, overflow: 'hidden', margin: '0 auto' }} />
              {/* analysis pins */}
              {[
                { top: 38, left: 36, label: 'redness', val: 'mild' },
                { top: 64, left: 152, label: 'pores', val: '58' },
                { top: 138, left: 24, label: 'moisture', val: '78' },
                { top: 168, left: 158, label: 'wrinkles', val: '88' },
                { top: 218, left: 70, label: 'evenness', val: '76' },
              ].map((p, i) => (
                <React.Fragment key={i}>
                  <div style={{
                    position: 'absolute', top: p.top, left: p.left,
                    width: 8, height: 8, borderRadius: 999,
                    background: LUME.terracotta,
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 0 0 2px rgba(201,136,106,.3)',
                    animation: `lumePulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: p.top - 4,
                    left: p.left + 14,
                    fontFamily: 'Courier Prime, monospace', fontSize: 8,
                    color: LUME.ink, background: 'rgba(244,237,224,.85)',
                    padding: '1.5px 4px', borderRadius: 3, letterSpacing: .3,
                  }}>{p.label}</div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* progress strip */}
          <div style={{ margin: '18px 8px 12px' }}>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1, marginBottom: 6 }}>
              ANALYZING · 11 of 14 metrics
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(20,18,14,.08)', overflow: 'hidden' }}>
              <div style={{ width: '78%', height: '100%', background: LUME.sageDeep, borderRadius: 999 }} />
            </div>
          </div>

          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 12, border: '1px solid rgba(40,35,28,.08)' }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 18, color: LUME.ink, fontWeight: 600, lineHeight: 1 }}>
              while we work…
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: LUME.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
              we'll save this scan and run a verdict on all 8 products in your shelf.
            </div>
          </div>

          <button onClick={() => setStep(2)} style={{
            marginTop: 20, width: '100%', padding: '12px 22px', borderRadius: 999, border: 'none',
            background: LUME.terracottaDeep, color: '#fff', cursor: 'pointer',
            fontFamily: 'Courier Prime, monospace', fontSize: 12,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
            boxShadow: '0 4px 14px rgba(178,107,74,.4)',
          }}>skip to results →</button>
        </div>

        <style>{`@keyframes lumePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: .4; }
        }`}</style>
      </div>
    );
  }

  // ───── Step 2: results ─────
  const groups = [
    { title: 'glow', metrics: ['radiance', 'evenness', 'moisture'] },
    { title: 'texture', metrics: ['pores', 'wrinkles', 'firmness', 'texture'] },
    { title: 'tone', metrics: ['redness', 'dark_spots', 'oiliness', 'acne'] },
    { title: 'eyes', metrics: ['dark_circles', 'eye_bags', 'eye_radiance'] },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
      <Header title="here's the read" closeTo="home" />
      <div style={{ padding: '4px 18px 22px' }}>
        {/* skin age hero */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          <div style={{
            width: 280, padding: '16px 18px',
            background: LUME.paper, borderRadius: 14,
            boxShadow: '0 4px 18px rgba(20,18,14,.12)',
            border: '1px solid rgba(40,35,28,.10)',
            display: 'flex', alignItems: 'center', gap: 14,
            transform: 'rotate(-1deg)',
          }}>
            <SelfiePlaceholder size={70} style={{ borderRadius: 999, overflow: 'hidden' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>
                skin age
              </div>
              <div style={{ fontFamily: 'Caveat, cursive', fontSize: 48, fontWeight: 700, color: LUME.ink, lineHeight: 1, marginTop: -2 }}>
                27 <span style={{ fontSize: 18, color: LUME.sageDeep, verticalAlign: 'middle' }}>↓2</span>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10.5, color: LUME.inkSoft, marginTop: 4, lineHeight: 1.3 }}>
                overall score <strong style={{ color: LUME.ink }}>74</strong> · trending up
              </div>
            </div>
          </div>
        </div>

        {/* grouped metric stickers */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map((g, gi) => (
            <div key={g.title} style={{ position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                marginLeft: 6, marginBottom: 4,
              }}>
                <div style={{ fontFamily: 'Caveat, cursive', fontSize: 20, fontWeight: 600, color: LUME.ink }}>{g.title}</div>
                <div style={{ flex: 1, borderTop: '1px dashed rgba(40,35,28,.16)', marginBottom: 4 }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {g.metrics.map((mid, mi) => {
                  const m = SKIN_METRICS.find((s) => s.id === mid);
                  if (!m) return null;
                  const rotate = ((gi + mi) % 3) - 1;
                  return (
                    <div key={mid} style={{
                      padding: '7px 10px 8px',
                      background: '#FFFFFF',
                      borderRadius: 8,
                      border: `1px solid rgba(40,35,28,.12)`,
                      borderLeft: `4px solid ${m.color}`,
                      transform: `rotate(${rotate * 0.5}deg)`,
                      boxShadow: '0 1px 3px rgba(20,18,14,.06)',
                    }}>
                      <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8.5, color: LUME.inkSoft, letterSpacing: .5, textTransform: 'uppercase' }}>{m.label}</div>
                      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 700, color: LUME.ink, lineHeight: 1 }}>{m.score}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => onNavigate('verdict')} style={{
          marginTop: 18, width: '100%', padding: '14px 22px', borderRadius: 14,
          background: LUME.ink, color: '#F4EDE0', cursor: 'pointer', border: 'none',
          fontFamily: 'Courier Prime, monospace', fontSize: 12, fontWeight: 700,
          letterSpacing: 1.6, textTransform: 'uppercase',
          boxShadow: '0 4px 14px rgba(20,18,14,.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Sparkle size={16} color={LUME.ochre} /> run verdict on 8 products
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { SkinAnalysisScreen });
