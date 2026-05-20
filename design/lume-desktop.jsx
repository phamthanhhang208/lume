// lume-desktop.jsx — Desktop/tablet view of the Lume dashboard

function LumeDesktop({ width = 1280, height = 820 }) {
  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      <PaperBg variant="cream" grid={true} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px',
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(40,35,28,.08)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <LumeMark size={36} />
          <div style={{ display: 'flex', gap: 18 }}>
            {['Today', 'Collection', 'Verdict', 'Looks', 'Skin'].map((n, i) =>
            <div key={n} style={{
              fontFamily: 'Courier Prime, monospace', fontSize: 11.5,
              color: i === 0 ? LUME.terracottaDeep : LUME.inkSoft, letterSpacing: 1.2, textTransform: 'uppercase',
              fontWeight: i === 0 ? 700 : 400, cursor: 'pointer',
              paddingBottom: 4,
              borderBottom: i === 0 ? `2px solid ${LUME.terracottaDeep}` : 'none'
            }}>{n}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            padding: '6px 12px', borderRadius: 999, background: 'rgba(168,184,156,.2)',
            fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.sageDeep, letterSpacing: .8, textTransform: 'uppercase', fontWeight: 700
          }}>PWA · v0.4</div>
          <button style={{
            padding: '8px 18px', borderRadius: 999, border: 'none',
            background: LUME.terracottaDeep, color: '#fff', cursor: 'pointer',
            fontFamily: 'Courier Prime, monospace', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6
          }}>+ add product</button>
          <SelfiePlaceholder size={36} style={{ borderRadius: 999, overflow: 'hidden', border: '2px solid #fff' }} />
        </div>
      </div>

      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, padding: '24px 32px', overflowY: 'auto' }}>
        {/* Hero row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 56, fontWeight: 700, color: LUME.ink, lineHeight: 1, letterSpacing: '-0.01em' }}>
              good morning, jen
            </div>
            <Underline width={120} color={LUME.terracotta} strokeWidth={3} style={{ marginTop: 4, marginLeft: 4 }} />
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 13, color: LUME.inkSoft, letterSpacing: .6, marginTop: 4 }}>SUN · MAR 29 2026 · BARRIER FEELS CALM TODAY</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
            { label: 'skin age', val: '27', d: '↓ 2', color: LUME.sageDeep },
            { label: 'overall', val: '74', d: '+ 4', color: LUME.sageDeep },
            { label: 'works', val: '5/8', d: '63%', color: LUME.ink }].
            map((c, i) =>
            <div key={c.label} style={{
              padding: '14px 18px', minWidth: 120,
              background: LUME.paper, borderRadius: 14,
              border: '1px solid rgba(40,35,28,.10)',
              boxShadow: '0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.05)',
              transform: `rotate(${(i - 1) * 0.4}deg)`
            }}>
                <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontFamily: 'Caveat, cursive', fontSize: 40, fontWeight: 700, color: LUME.ink, lineHeight: 1 }}>{c.val}</div>
                  <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 11, color: c.color, fontWeight: 700 }}>{c.d}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22 }}>
          {/* LEFT — Collection pinboard */}
          <div style={{
            background: LUME.paper, borderRadius: 16,
            border: '1px solid rgba(40,35,28,.10)',
            padding: 22, position: 'relative',
            boxShadow: '0 1px 3px rgba(20,18,14,.05), 0 4px 20px rgba(20,18,14,.05)',
            minHeight: 460
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: 'Caveat, cursive', fontSize: 30, fontWeight: 700, color: LUME.ink, lineHeight: 1 }}>your collection</div>
                <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: .8, marginTop: 4 }}>8 PRODUCTS · 5 ACTIVELY USED</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['ALL', 'SKINCARE', 'MAKEUP'].map((t, i) =>
                <div key={t} style={{
                  padding: '5px 10px', borderRadius: 999,
                  background: i === 0 ? LUME.ink : 'transparent',
                  color: i === 0 ? LUME.cream : LUME.inkSoft,
                  border: i === 0 ? 'none' : '1px solid rgba(60,40,20,.2)',
                  fontFamily: 'Courier Prime, monospace', fontSize: 9.5, letterSpacing: .8,
                  cursor: 'pointer'
                }}>{t}</div>
                )}
              </div>
            </div>

            {/* Clean 4-up grid of product cards */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14
            }} data-comment-anchor="a96ffa9f90-div-109-13">
              {[
              { p: PRODUCTS[0], badge: 'works' },
              { p: PRODUCTS[1], badge: 'works' },
              { p: PRODUCTS[2], badge: 'works' },
              { p: PRODUCTS[3], badge: 'neutral' },
              { p: PRODUCTS[4], badge: 'skip' },
              { p: PRODUCTS[5], badge: 'works' },
              { p: PRODUCTS[6], badge: 'neutral' },
              { p: PRODUCTS[7], badge: 'works' }].
              map(({ p, badge }) => {
                const Svg = PRODUCT_SVGS[p.kind];
                return (
                  <div key={p.id} style={{
                    background: '#FFFFFF', borderRadius: 12,
                    border: '1px solid rgba(40,35,28,.10)',
                    padding: '14px 14px 12px',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 1px 2px rgba(20,18,14,.04)',
                    cursor: 'pointer'
                  }}>
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      <VerdictTag verdict={badge} style="chip" />
                    </div>
                    <div style={{
                      height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#fff', borderRadius: 8, border: '1px solid rgba(40,35,28,.07)',
                      marginBottom: 10
                    }}>
                      <Svg size={84} hue={p.hue} />
                    </div>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .6, textTransform: 'uppercase' }}>{p.brand}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: LUME.ink, lineHeight: 1.2, marginTop: 2 }}>{p.name}</div>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .4, marginTop: 4, textTransform: 'uppercase' }}>{p.category} · {p.subcat}</div>
                  </div>);

              })}
            </div>
          </div>

          {/* RIGHT — Stack: skin / verdict / look */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Skin scan card */}
            <div style={{
              background: LUME.paper, borderRadius: 16,
              border: '1px solid rgba(40,35,28,.10)',
              padding: 18, position: 'relative',
              boxShadow: '0 1px 3px rgba(20,18,14,.05), 0 4px 20px rgba(20,18,14,.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <SelfiePlaceholder size={72} style={{ borderRadius: 999, overflow: 'hidden', border: '3px solid #fff' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>latest scan</div>
                  <div style={{ fontFamily: 'Caveat, cursive', fontSize: 24, fontWeight: 700, color: LUME.ink, lineHeight: 1 }}>4 days ago · skin age 27</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: LUME.inkSoft, marginTop: 4 }}>moisture up, pores still flagged</div>
                </div>
                <button style={{
                  padding: '7px 12px', borderRadius: 999, border: 'none',
                  background: LUME.sageDeep, color: '#fff', cursor: 'pointer',
                  fontFamily: 'Courier Prime, monospace', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700
                }}>scan</button>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 12 }}>
                {SKIN_METRICS.slice(0, 7).map((m) =>
                <div key={m.id} style={{ flex: 1 }}>
                    <div style={{ height: 4, borderRadius: 999, background: 'rgba(20,18,14,.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${m.score}%`, height: '100%', background: m.color }} />
                    </div>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 7.5, color: LUME.inkSoft, letterSpacing: .2, marginTop: 3, textAlign: 'center', textTransform: 'uppercase' }}>{m.label.slice(0, 6)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Verdict summary */}
            <div style={{
              background: LUME.ink, color: LUME.cream, borderRadius: 16,
              padding: 18, position: 'relative',
              boxShadow: '0 4px 20px rgba(60,40,20,.2)',
              transform: 'rotate(-.4deg)'
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, opacity: .7, letterSpacing: 1, textTransform: 'uppercase' }}>today's verdict</div>
                  <div style={{ fontFamily: 'Caveat, cursive', fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>5 / 8 working</div>
                </div>
                <Sparkle size={26} color={LUME.ochre} />
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                {[
                { count: 5, label: 'works', color: '#A8B89C' },
                { count: 2, label: 'neutral', color: '#D9A45B' },
                { count: 1, label: 'skip', color: '#C9886A' }].
                map((s) =>
                <div key={s.label} style={{ flex: s.count, padding: '6px 10px', borderRadius: 6, background: s.color, color: LUME.ink, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Caveat, cursive', fontWeight: 700, fontSize: 22, lineHeight: 1 }}>{s.count}</div>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, letterSpacing: .6, textTransform: 'uppercase', marginTop: 1 }}>{s.label}</div>
                  </div>
                )}
              </div>
              <button style={{
                marginTop: 12, width: '100%', padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(244,237,224,.3)',
                background: 'transparent', color: LUME.cream, cursor: 'pointer',
                fontFamily: 'Courier Prime, monospace', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700
              }}>see full report →</button>
            </div>

            {/* Build a look CTA */}
            <div style={{
              background: LUME.paper, borderRadius: 16,
              border: '1px solid rgba(40,35,28,.10)',
              padding: 14, position: 'relative',
              boxShadow: '0 1px 3px rgba(20,18,14,.05), 0 4px 20px rgba(20,18,14,.05)',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 12,
                background: LUME.terracottaDeep, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: 'rotate(-4deg)',
                boxShadow: '0 4px 14px rgba(178,107,74,.4)'
              }}>
                <Sparkle size={28} color={LUME.ochre} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 700, color: LUME.ink, lineHeight: 1 }}>build me a look</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: LUME.inkSoft, marginTop: 2 }}>type a vibe → ai casts your products → vto render</div>
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={LUME.ink} strokeWidth="2" strokeLinecap="round"><path d="M6 4l8 6-8 6" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>);

}

Object.assign(window, { LumeDesktop });