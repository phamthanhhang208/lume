// lume-look.jsx — Build Me a Look (magazine layout)

function LookScreen({ onNavigate, step: initialStep = 0 }) {
  const [step, setStep] = React.useState(initialStep);
  const [prompt, setPrompt] = React.useState('clean girl, soft glow, brunch ready');

  const Header = ({ title, sub }) => (
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
        build me a look · step {step + 1}/3
      </div>
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 32, color: LUME.ink, fontWeight: 700, lineHeight: 1.1, marginTop: 2 }}>{title}</div>
      <Underline width={70} color={LUME.terracotta} strokeWidth={2.6} style={{ marginTop: 2 }} />
      {sub && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: LUME.inkSoft, marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );

  // ───── Step 0: prompt ─────
  if (step === 0) {
    const suggestions = [
      'clean girl, soft glow',
      'soft glam, dinner date',
      'no-makeup makeup, errands',
      '90s mauve, with my brown lip',
      'sunburnt cheek, lit-from-within',
    ];
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Header title="what's the vibe?" sub="say it like you'd tell a friend. we'll cast products you already own." />
        <div style={{ padding: '8px 18px 22px' }}>
          {/* iMessage-style chat exchange */}
          <div style={{
            background: LUME.paper, borderRadius: 22,
            padding: '14px 14px 12px',
            border: '1px solid rgba(40,35,28,.08)',
            boxShadow: '0 1px 3px rgba(40,35,28,.05)',
          }}>
            <div style={{
              textAlign: 'center', marginBottom: 10,
              fontFamily: 'Inter, sans-serif', fontSize: 11, color: LUME.inkFaint, fontWeight: 600,
            }}>
              <span style={{ fontWeight: 700, color: LUME.inkSoft }}>Lume</span>
              <div style={{ marginTop: 1, fontWeight: 400 }}>Today 11:11 am</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ChatBubble side="received">What do you want to look like today?</ChatBubble>
              <ChatBubble side="received">use anything in your shelf · I'll cast it</ChatBubble>
              {prompt && <ChatBubble side="sent">{prompt}</ChatBubble>}
            </div>

            {/* Input row — iMessage style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999,
                background: LUME.creamDeep,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: LUME.inkSoft, flexShrink: 0,
                cursor: 'pointer',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
              </div>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Umm, let me think…"
                style={{
                  flex: 1, height: 32, padding: '0 14px',
                  border: '1.5px solid rgba(40,35,28,.18)',
                  borderRadius: 999,
                  background: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif', fontSize: 14, color: LUME.ink,
                  outline: 'none', minWidth: 0,
                }}
              />
              <button onClick={() => setStep(1)} style={{
                width: 32, height: 32, borderRadius: 999, border: 'none',
                background: prompt.length > 1 ? LUME.terracottaDeep : LUME.creamDeep,
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'background .15s ease',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 12V2M2 7l5-5 5 5"/></svg>
              </button>
            </div>
          </div>

          <div style={{
            fontFamily: 'Courier Prime, monospace', fontSize: 10,
            color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase',
            marginTop: 18, marginBottom: 8, marginLeft: 4,
          }}>or try a vibe</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => setPrompt(s)} style={{
                padding: '6px 12px', borderRadius: 999,
                background: prompt === s ? LUME.rose : LUME.paper,
                color: prompt === s ? '#7A3E48' : LUME.ink,
                border: `1px solid ${prompt === s ? LUME.roseDeep : 'rgba(40,35,28,.12)'}`,
                fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>

          {/* shelf preview snippet */}
          <div style={{ marginTop: 18, padding: 12, background: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(40,35,28,.10)' }}>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              using your shelf · 8 products
            </div>
            <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
              {PRODUCTS.slice(0, 6).map((p) => {
                const Svg = PRODUCT_SVGS[p.kind];
                return (
                  <div key={p.id} style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: '#fff', border: '1px solid rgba(40,35,28,.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Svg size={26} />
                  </div>
                );
              })}
              <div style={{
                width: 36, height: 36, borderRadius: 6,
                background: 'rgba(20,18,14,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft,
              }}>+2</div>
            </div>
          </div>

          <button onClick={() => setStep(1)} style={{
            marginTop: 18, width: '100%', padding: '14px 22px', borderRadius: 999, border: 'none',
            background: LUME.terracottaDeep, color: '#fff', cursor: 'pointer',
            fontFamily: 'Courier Prime, monospace', fontSize: 12, fontWeight: 700,
            letterSpacing: 1.6, textTransform: 'uppercase',
            boxShadow: '0 4px 14px rgba(178,107,74,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Sparkle size={14} color={LUME.ochre} /> cast products
          </button>
        </div>
      </div>
    );
  }

  // ───── Step 1: products cast ─────
  if (step === 1) {
    const cast = [
      { slot: 'BASE', p: PRODUCTS[0] },     // glow drops
      { slot: 'CHEEK', p: PRODUCTS[2] },    // blush
      { slot: 'LIP', p: PRODUCTS[3] },      // lipstick
      { slot: 'LASH', p: PRODUCTS[5] },     // mascara
      { slot: 'FINISH', p: PRODUCTS[6] },   // mist
    ];
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Header title="the cast" sub={`"${prompt}"`} />
        <div style={{ padding: '4px 22px 22px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cast.map((c, i) => {
              const Svg = PRODUCT_SVGS[c.p.kind];
              return (
                <div key={c.slot} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px',
                  background: '#FFFFFF', borderRadius: 12,
                  border: '1px solid rgba(40,35,28,.10)',
                  boxShadow: '0 1px 3px rgba(20,18,14,.05)',
                  transform: `rotate(${((i % 3) - 1) * 0.4}deg)`,
                }}>
                  <div style={{
                    width: 30, fontFamily: 'Courier Prime, monospace', fontSize: 10,
                    fontWeight: 700, color: LUME.terracottaDeep, letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}>{c.slot}</div>
                  <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: LUME.inkFaint }}>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M1 5h12M9 1l4 4-4 4"/></svg>
                  </div>
                  <div style={{
                    width: 44, height: 50,
                    background: '#fff', border: '1px solid rgba(40,35,28,.10)', borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: 'rotate(-2deg)',
                  }}>
                    <Svg size={34} hue={c.p.hue} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .5, textTransform: 'uppercase' }}>{c.p.brand}</div>
                    <div style={{ fontFamily: 'Caveat, cursive', fontSize: 18, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>{c.p.name}</div>
                  </div>
                  <VerdictTag verdict="works" style="chip" />
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 14, padding: '10px 12px',
            background: 'rgba(168,184,156,.18)', border: '1px solid rgba(124,145,112,.4)',
            borderRadius: 10,
          }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 17, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>
              all 5 are in your works pile ✓
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: LUME.inkSoft, marginTop: 3 }}>
              gemini cross-checked verdicts before casting. nothing in your skip pile.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(0)} style={{
              padding: '12px 18px', borderRadius: 999,
              background: 'transparent', color: LUME.ink, cursor: 'pointer',
              border: '1.5px solid rgba(60,40,20,.3)',
              fontFamily: 'Courier Prime, monospace', fontSize: 11,
              letterSpacing: 1.4, textTransform: 'uppercase',
            }}>← retry</button>
            <button onClick={() => setStep(2)} style={{
              flex: 1, padding: '12px 18px', borderRadius: 999, border: 'none',
              background: LUME.terracottaDeep, color: '#fff', cursor: 'pointer',
              fontFamily: 'Courier Prime, monospace', fontSize: 11, fontWeight: 700,
              letterSpacing: 1.4, textTransform: 'uppercase',
              boxShadow: '0 4px 14px rgba(178,107,74,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Sparkle size={12} color={LUME.ochre} /> render on me
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ───── Step 2: magazine page ─────
  // selfie center, annotated arrows pointing to product callouts
  const callouts = [
    { side: 'L', top: 26, label: 'glow drops', sub: 'BASE · luminize', p: PRODUCTS[0], anchor: { x: 60, y: 36 } },
    { side: 'L', top: 110, label: 'cream blush', sub: 'CHEEK · "sundown"', p: PRODUCTS[2], anchor: { x: 70, y: 56 } },
    { side: 'R', top: 50, label: 'lash vol.', sub: 'LASH · 1 coat', p: PRODUCTS[5], anchor: { x: 56, y: 46 } },
    { side: 'R', top: 138, label: 'brick lip', sub: 'LIP · pressed in', p: PRODUCTS[3], anchor: { x: 60, y: 72 } },
    { side: 'R', top: 222, label: 'rose mist', sub: 'FINISH · set + dew', p: PRODUCTS[6], anchor: { x: 56, y: 86 } },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
      <Header title="the look" sub={`"${prompt}"`} />
      <div style={{ padding: '0 14px 22px' }}>

        {/* Magazine spread */}
        <div style={{
          position: 'relative',
          background: LUME.paper, borderRadius: 14,
          boxShadow: '0 2px 6px rgba(20,18,14,.08), 0 12px 28px rgba(60,40,20,.14)',
          border: '1px solid rgba(40,35,28,.10)',
          padding: '14px 12px 16px',
          overflow: 'hidden',
        }}>
          {/* magazine masthead */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px' }}>
            <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, fontStyle: 'italic', color: LUME.ink, letterSpacing: -0.4, lineHeight: 1 }}>The Lume</div>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>issue 04 · mar 26</div>
          </div>
          <div style={{ borderTop: '1.5px solid rgba(60,40,20,.4)', borderBottom: '0.5px solid rgba(60,40,20,.4)', height: 4, marginBottom: 10 }} />

          {/* selfie + callouts */}
          <div style={{ position: 'relative', height: 320, margin: '0 -2px' }}>
            {/* central selfie (vto preview) */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%) rotate(-1.5deg)',
              width: 130, padding: 8,
              background: '#fff', borderRadius: 4,
              boxShadow: '0 4px 12px rgba(20,18,14,.16)',
            }}>
              <SelfiePlaceholder size={114} style={{ borderRadius: 2, overflow: 'hidden' }} />
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 7, color: LUME.inkSoft, textAlign: 'center', marginTop: 4, letterSpacing: .4 }}>VTO PREVIEW</div>
            </div>

            {/* callouts and arrows */}
            {callouts.map((c, i) => {
              const Svg = PRODUCT_SVGS[c.p.kind];
              const left = c.side === 'L' ? 0 : 'auto';
              const right = c.side === 'R' ? 0 : 'auto';
              return (
                <div key={c.label} style={{ position: 'absolute', top: c.top, left, right, width: 86, textAlign: c.side === 'L' ? 'right' : 'left' }}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-end',
                    flexDirection: c.side === 'L' ? 'row' : 'row-reverse',
                    gap: 6,
                  }}>
                    <div style={{
                      width: 36, height: 40,
                      background: '#fff', border: '1px solid rgba(40,35,28,.10)', borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: `rotate(${c.side === 'L' ? -3 : 3}deg)`,
                      flexShrink: 0,
                      boxShadow: '0 1px 3px rgba(20,18,14,.08)',
                    }}>
                      <Svg size={28} hue={c.p.hue} />
                    </div>
                    <div style={{ flex: 1, paddingBottom: 2 }}>
                      <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 7.5, color: LUME.terracottaDeep, letterSpacing: .6, fontWeight: 700 }}>
                        {c.sub}
                      </div>
                      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 16, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>
                        {c.label}
                      </div>
                    </div>
                  </div>
                  {/* arrow pointing toward selfie */}
                  <svg
                    width="80" height="20" viewBox="0 0 80 20"
                    style={{
                      position: 'absolute',
                      top: 18, [c.side === 'L' ? 'right' : 'left']: -54,
                      transform: c.side === 'R' ? 'scaleX(-1)' : 'none',
                      pointerEvents: 'none',
                    }}
                  >
                    <path d="M2,10 Q30,4 60,12 L74,10" fill="none" stroke={LUME.inkSoft} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 2.5"/>
                    <path d="M68,5 L75,10 L68,15" fill="none" stroke={LUME.inkSoft} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              );
            })}
          </div>

          {/* footer line */}
          <div style={{ borderTop: '0.5px solid rgba(60,40,20,.4)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 16, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>
              <span style={{ fontStyle: 'italic' }}>the cast</span> · 5 of yours
            </div>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, color: LUME.inkSoft, letterSpacing: .5 }}>
              perfect corp · makeup vto v2
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => setStep(0)} style={{
            padding: '12px 14px', borderRadius: 999,
            background: 'transparent', color: LUME.ink, cursor: 'pointer',
            border: '1.5px solid rgba(60,40,20,.3)',
            fontFamily: 'Courier Prime, monospace', fontSize: 11,
            letterSpacing: 1.2, textTransform: 'uppercase',
          }}>new vibe</button>
          <button style={{
            flex: 1, padding: '12px 14px', borderRadius: 999, border: 'none',
            background: LUME.ink, color: LUME.cream, cursor: 'pointer',
            fontFamily: 'Courier Prime, monospace', fontSize: 11, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase',
            boxShadow: '0 4px 14px rgba(20,18,14,.16)',
          }}>save to journal</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LookScreen });
