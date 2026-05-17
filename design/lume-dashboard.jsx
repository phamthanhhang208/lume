// lume-dashboard.jsx — 3 dashboard variants for Lume

// Dashboard navigation pill at bottom — used by all variants
function DashNav({ onNavigate, active = 'home' }) {
  const items = [
  { id: 'home', label: 'Today', icon: 'home' },
  { id: 'add', label: 'Add', icon: 'plus', primary: true },
  { id: 'profile', label: 'Me', icon: 'me' }];

  const Icon = ({ name, color }) => {
    if (name === 'home') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-3v-7H8v7H5a2 2 0 0 1-2-2z" /></svg>;
    if (name === 'plus') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
    if (name === 'me') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 6-7 8-7s7 2 8 7" /></svg>;
    return null;
  };
  return (
    <div style={{
      position: 'absolute', bottom: 22, left: 16, right: 16,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 18px',
      background: '#FFFFFF',
      borderRadius: 999,
      boxShadow: '0 1px 3px rgba(20,18,14,.08), 0 6px 20px rgba(20,18,14,.08)',
      border: '1px solid rgba(40,35,28,.10)',
      zIndex: 30
    }}>
      {items.map((it) => {
        const isActive = active === it.id;
        if (it.primary) {
          return (
            <button key={it.id} onClick={() => onNavigate(it.id)} style={{
              width: 52, height: 52, borderRadius: 999, border: 'none',
              background: LUME.terracottaDeep, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(178,107,74,.45)',
              transform: 'translateY(-12px) rotate(-3deg)', cursor: 'pointer'
            }}>
              <Icon name={it.icon} color="#fff" />
            </button>);

        }
        return (
          <button key={it.id} onClick={() => onNavigate(it.id)} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 12px',
            color: isActive ? LUME.terracottaDeep : LUME.inkSoft
          }}>
            <Icon name={it.icon} color={isActive ? LUME.terracottaDeep : LUME.inkSoft} />
            <span style={{
              fontFamily: 'Courier Prime, monospace', fontSize: 9.5,
              textTransform: 'uppercase', letterSpacing: .8,
              fontWeight: isActive ? 700 : 400
            }}>{it.label}</span>
          </button>);

      })}
    </div>);

}

// Hero header used at the top of every dashboard
function DashHeader({ greeting = 'Today', date = 'Sun, Mar 29' }) {
  return (
    <div style={{ padding: '6px 22px 8px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <EditorialTitle size={48} style={{ fontWeight: 400 }}>
            {greeting === 'Today' ? <><span>To</span><i>day</i></> : greeting}
          </EditorialTitle>
          <div style={{
            fontFamily: 'Courier Prime, monospace', fontSize: 11,
            color: LUME.inkSoft, marginTop: 4, letterSpacing: 1
          }}>{date.toUpperCase()}</div>
        </div>
        <LumeMark size={32} />
      </div>
    </div>);

}

// ─────────────── Variant A · Vanity Shelf ───────────────
function DashboardShelf({ onNavigate, empty = false, intensity = 'medium' }) {
  const skincare = PRODUCTS.filter((p) => p.category === 'skincare');
  const makeup = PRODUCTS.filter((p) => p.category === 'makeup');

  const Shelf = ({ items, label, tilt = -1 }) =>
  <div style={{ marginBottom: 22, position: 'relative' }}>
      <div style={{
      fontFamily: 'Caveat, cursive', fontSize: 22, color: LUME.ink, fontWeight: 600,
      marginLeft: 22, marginBottom: -4, transform: `rotate(${tilt}deg)`,
      display: 'inline-block'
    }}>{label}</div>
      {/* shelf board */}
      <div style={{
      position: 'relative',
      margin: '8px 14px 0',
      padding: '0 6px'
    }}>
        <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 2, overflowX: 'auto', paddingBottom: 8
      }}>
          {items.map((p) =>
        <div key={p.id} style={{ transform: `translateY(${p.id.charCodeAt(1) % 3 - 1}px)` }}>
              <ProductSticker product={p} size={70} onClick={() => onNavigate('product', p)} />
            </div>
        )}
          {/* Add slot */}
          <div onClick={() => onNavigate('add')} style={{
          width: 78, height: 100, marginLeft: 4,
          border: '2px dashed #B59B7C', borderRadius: 8,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#8B7355', cursor: 'pointer', flex: '0 0 auto',
          transform: 'rotate(1.2deg)'
        }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span style={{ fontFamily: 'Caveat, cursive', fontSize: 14, marginTop: 2 }}>add</span>
          </div>
        </div>
        {/* shelf line */}
        <div style={{
        height: 6, background: '#C9A87E',
        borderRadius: 1,
        boxShadow: '0 2px 4px rgba(20,18,14,.16)',
        marginTop: -4
      }} />
        <div style={{ height: 12, background: 'linear-gradient(180deg, rgba(20,18,14,.05), transparent)' }} />
      </div>
    </div>;


  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 84, overflowY: 'auto' }}>
      <DashHeader />

      {/* Skin check CTA card */}
      <div style={{ margin: '6px 16px 18px', position: 'relative' }}>
        <div onClick={() => onNavigate('scan')} style={{
          background: '#FFFFFF', borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 1px 3px rgba(20,18,14,.08), 0 4px 14px rgba(20,18,14,.06)',
          border: '1px solid rgba(40,35,28,.08)',
          display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer'
        }}>
          <SelfiePlaceholder size={48} style={{ borderRadius: 999, overflow: 'hidden' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, color: LUME.ink, fontWeight: 600, lineHeight: 1 }}>
              Skin check
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: LUME.inkSoft, marginTop: 3 }}>
              last scan · 4 days ago · skin age 27
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 999, background: LUME.sageDeep, color: '#fff',
            fontFamily: 'Courier Prime, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1
          }}>scan</div>
        </div>
      </div>

      {empty ?
      <div style={{
        margin: '16px 24px', padding: '36px 22px',
        background: '#FFFFFF', border: '1.5px dashed #B59B7C', borderRadius: 16,
        textAlign: 'center', position: 'relative'
      }}>
          <Sparkle size={20} color={LUME.terracotta} style={{ position: 'absolute', top: -8, right: 18 }} />
          <Star size={18} color={LUME.ochre} filled={false} style={{ position: 'absolute', bottom: 16, left: 16 }} />
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 28, color: LUME.ink, fontWeight: 600, lineHeight: 1.1 }}>
            your shelf is empty<br />(but bright)
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: LUME.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
            Snap a product → we turn it into a sticker → AI tells you if it's actually pulling weight.
          </div>
          <button onClick={() => onNavigate('add')} style={{
          marginTop: 14, padding: '10px 22px', borderRadius: 999, border: 'none',
          background: LUME.terracottaDeep, color: '#fff', cursor: 'pointer',
          fontFamily: 'Courier Prime, monospace', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase',
          boxShadow: '0 4px 14px rgba(178,107,74,.4)'
        }}>+ add first product</button>
        </div> :

      <>
          <Shelf items={skincare} label="skincare" tilt={-2} />
          <Shelf items={makeup} label="makeup" tilt={1.5} />

          {/* Build me a look card */}
          <div onClick={() => onNavigate('look')} style={{
          margin: '8px 16px 16px', position: 'relative',
          background: '#3D2F26', color: '#F4EDE0',
          borderRadius: 14, padding: '14px 16px',
          boxShadow: '0 4px 14px rgba(20,18,14,.16)',
          cursor: 'pointer',
          transform: 'rotate(-.6deg)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Caveat, cursive', fontSize: 24, fontWeight: 600, lineHeight: 1 }}>
                  build me a look
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, opacity: .7, marginTop: 4 }}>
                  ai · uses what you already own
                </div>
              </div>
              <Sparkle size={28} color={LUME.ochre} />
            </div>
          </div>
        </>
      }

      <DashNav onNavigate={onNavigate} active="home" />
    </div>);

}

// ─────────────── Variant B · Tidy grid ───────────────
function DashboardPinboard({ onNavigate, empty = false, intensity = 'medium' }) {
  const cards = [
    { p: PRODUCTS[0], badge: 'works' },
    { p: PRODUCTS[1], badge: 'works' },
    { p: PRODUCTS[2], badge: 'works' },
    { p: PRODUCTS[3], badge: 'neutral' },
    { p: PRODUCTS[7], badge: 'works' },
    { p: PRODUCTS[5], badge: 'works' },
    { p: PRODUCTS[4], badge: 'skip' },
    { p: PRODUCTS[6], badge: 'neutral' },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 84, overflowY: 'auto' }}>
      <DashHeader />

      {/* Skin check pill */}
      <div onClick={() => onNavigate('scan')} style={{
        margin: '6px 22px 14px', display: 'flex', alignItems: 'center', gap: 10,
        background: 'transparent', cursor: 'pointer',
      }} data-comment-anchor="718112e2e9-div-264-9">
        <SelfiePlaceholder size={36} style={{ borderRadius: 999, overflow: 'hidden' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: .8 }}>
            SKIN · 4 DAYS AGO
          </div>
          <div style={{ marginTop: 2 }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 600, color: LUME.ink, lineHeight: 1.05, whiteSpace: 'nowrap' }}>
              skin age 27
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: LUME.sageDeep, fontWeight: 600, marginTop: 1 }}>
              ↓ 2 this month
            </div>
          </div>
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: 999, background: LUME.terracottaDeep, color: '#fff',
          fontFamily: 'Courier Prime, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1,
        }}>retake</div>
      </div>

      {/* Collection toolbar */}
      <div style={{ margin: '0 18px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 600, color: LUME.ink, lineHeight: 1, whiteSpace: 'nowrap' }}>my collection</div>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9.5, color: LUME.inkSoft, letterSpacing: .6, marginTop: 3, textTransform: 'uppercase' }}>8 products · 5 working</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'SKIN', 'MAKE'].map((t, i) => (
            <div key={t} style={{
              padding: '4px 9px', borderRadius: 999,
              background: i === 0 ? LUME.ink : 'transparent',
              color: i === 0 ? LUME.cream : LUME.inkSoft,
              border: i === 0 ? 'none' : '1px solid rgba(60,40,20,.2)',
              fontFamily: 'Courier Prime, monospace', fontSize: 8.5, letterSpacing: .6, fontWeight: 700,
              cursor: 'pointer',
            }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Tidy grid of product cards */}
      <div style={{ margin: '0 18px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {cards.map(({ p, badge }) => {
          const Svg = PRODUCT_SVGS[p.kind];
          return (
            <div key={p.id} onClick={() => onNavigate('product', p)} style={{
              background: LUME.paper, borderRadius: 12,
              border: '1px solid rgba(40,35,28,.10)',
              padding: '12px 12px 10px',
              position: 'relative',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 1px 2px rgba(20,18,14,.05)',
              cursor: 'pointer',
            }}>
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <VerdictTag verdict={badge} style="chip" />
              </div>
              <div style={{
                height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#fff', borderRadius: 8, border: '1px solid rgba(40,35,28,.07)',
                marginBottom: 8,
              }}>
                <Svg size={66} hue={p.hue} />
              </div>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8.5, color: LUME.inkSoft, letterSpacing: .5, textTransform: 'uppercase' }}>{p.brand}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600, color: LUME.ink, lineHeight: 1.2, marginTop: 1 }}>{p.name}</div>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, color: LUME.inkSoft, letterSpacing: .4, marginTop: 3, textTransform: 'uppercase' }}>{p.subcat}</div>
            </div>
          );
        })}
        {/* Add slot */}
        <div onClick={() => onNavigate('add')} style={{
          borderRadius: 12, border: '1.5px dashed #B59B7C',
          minHeight: 178,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#8B7355', cursor: 'pointer', gap: 4,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: 16, fontWeight: 600 }}>add product</span>
        </div>
      </div>

      {/* Build me a look CTA */}
      <div onClick={() => onNavigate('look')} style={{
        margin: '16px 16px 16px',
        background: '#3D2F26', color: '#F4EDE0',
        borderRadius: 14, padding: '14px 16px',
        boxShadow: '0 4px 14px rgba(20,18,14,.16)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 600, lineHeight: 1 }}>build me a look</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, opacity: .7, marginTop: 3 }}>
            tell us a vibe → we cast products you own
          </div>
        </div>
        <Sparkle size={24} color={LUME.ochre} />
      </div>

      <DashNav onNavigate={onNavigate} active="home" />
    </div>);

}

// ─────────────── Variant C · Journal spread ───────────────
function DashboardJournal({ onNavigate, empty = false, intensity = 'medium' }) {
  const today = [
  { id: 'r1', step: '1', label: 'cleanse', product: PRODUCTS[1], done: true },
  { id: 'r2', step: '2', label: 'tone', product: PRODUCTS[6], done: true },
  { id: 'r3', step: '3', label: 'serum', product: PRODUCTS[0], done: false },
  { id: 'r4', step: '4', label: 'cream', product: PRODUCTS[4], done: false }];

  return (
    <div style={{ position: 'absolute', inset: 0, paddingTop: 54, paddingBottom: 84, overflowY: 'auto' }}>
      {/* Spine of the journal */}
      <div style={{ position: 'absolute', top: 54, bottom: 84, left: '50%', width: 1, background: 'rgba(40,35,28,.14)' }} />

      <DashHeader />

      {/* Two-column journal layout */}
      <div style={{ display: 'flex', padding: '0 14px', gap: 8 }}>
        {/* Left page · today's routine */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <div style={{
            fontFamily: 'Caveat, cursive', fontSize: 19, fontWeight: 600, color: LUME.ink,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            tonight's routine
          </div>
          <Underline width={80} color={LUME.terracotta} style={{ marginTop: 2 }} />

          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {today.map((step) => {
              const Svg = PRODUCT_SVGS[step.product.kind];
              return (
                <div key={step.id} onClick={() => onNavigate('product', step.product)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 8px',
                  background: step.done ? 'rgba(168,184,156,.18)' : '#FFFFFF',
                  borderRadius: 10,
                  border: '1px solid rgba(40,35,28,.10)',
                  position: 'relative', cursor: 'pointer'
                }}>
                  <div style={{
                    fontFamily: 'Courier Prime, monospace', fontSize: 9.5,
                    color: LUME.inkSoft, width: 14
                  }}>{step.step}</div>
                  <div style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: '#fff', border: '1px solid rgba(40,35,28,.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `rotate(${step.done ? 2 : -1}deg)`
                  }}>
                    <Svg size={28} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Caveat, cursive', fontSize: 16, fontWeight: 600, color: LUME.ink, lineHeight: 1,
                      textDecoration: step.done ? 'line-through' : 'none', textDecorationColor: LUME.sageDeep
                    }}>{step.label}</div>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, color: LUME.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                      {step.product.name}
                    </div>
                  </div>
                  {step.done &&
                  <div style={{
                    fontFamily: 'Caveat, cursive', fontSize: 18, color: LUME.sageDeep,
                    transform: 'rotate(-12deg)'
                  }}>✓</div>
                  }
                </div>);

            })}
          </div>

          <div style={{ marginTop: 14, padding: '10px 10px', background: 'rgba(217,164,91,.16)', border: '1px solid rgba(217,164,91,.4)', borderRadius: 10, position: 'relative' }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 16, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>note to self</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: LUME.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
              skipped retinol — barrier felt stingy yesterday.
            </div>
          </div>
        </div>

        {/* Right page · collection grid */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <div style={{
            fontFamily: 'Caveat, cursive', fontSize: 19, fontWeight: 600, color: LUME.ink
          }}>collection</div>
          <Underline width={70} color={LUME.sageDeep} style={{ marginTop: 2 }} />

          <div style={{
            marginTop: 10,
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6
          }}>
            {PRODUCTS.slice(0, 6).map((p) =>
            <div key={p.id} onClick={() => onNavigate('product', p)} style={{
              aspectRatio: '1', background: '#fff', borderRadius: 8,
              border: '1px solid rgba(40,35,28,.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `rotate(${p.id.charCodeAt(1) % 3 - 1}deg)`,
              boxShadow: '0 1px 3px rgba(20,18,14,.06)',
              cursor: 'pointer'
            }}>
                {React.createElement(PRODUCT_SVGS[p.kind], { size: 42 })}
              </div>
            )}
            <div onClick={() => onNavigate('add')} style={{
              aspectRatio: '1', borderRadius: 8,
              border: '1.5px dashed #B59B7C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8B7355', cursor: 'pointer'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div onClick={() => onNavigate('verdict')} style={{
              aspectRatio: '1', borderRadius: 8,
              background: LUME.terracottaDeep, color: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              transform: 'rotate(2deg)',
              boxShadow: '0 2px 6px rgba(178,107,74,.4)',
              cursor: 'pointer', textAlign: 'center', padding: 4
            }}>
              <Sparkle size={16} color={LUME.ochre} />
              <div style={{ fontFamily: 'Caveat, cursive', fontSize: 14, fontWeight: 600, lineHeight: 1, marginTop: 4 }}>get verdict</div>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 7, opacity: .8, marginTop: 2 }}>8 products</div>
            </div>
          </div>

          {/* Skin status */}
          <div onClick={() => onNavigate('scan')} style={{
            marginTop: 12, padding: 10,
            background: '#FFFFFF',
            border: '1px solid rgba(40,35,28,.12)', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
          }}>
            <SelfiePlaceholder size={36} style={{ borderRadius: 999, overflow: 'hidden' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Caveat, cursive', fontSize: 16, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>skin · age 27</div>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8.5, color: LUME.inkSoft, marginTop: 3 }}>scan · 4 days ago</div>
            </div>
          </div>
        </div>
      </div>

      <DashNav onNavigate={onNavigate} active="home" />
    </div>);

}

function LumeDashboard({ layout = 'shelf', ...props }) {
  if (layout === 'pinboard') return <DashboardPinboard {...props} />;
  if (layout === 'journal') return <DashboardJournal {...props} />;
  return <DashboardShelf {...props} />;
}

Object.assign(window, { LumeDashboard, DashboardShelf, DashboardPinboard, DashboardJournal, DashNav });