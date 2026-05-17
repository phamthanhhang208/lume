// lume-add-product.jsx — Add Product flow (4 steps)

function AddProductScreen({ onNavigate, step: initialStep = 0, intensity = 'medium' }) {
  const [step, setStep] = React.useState(initialStep);
  const [productName, setProductName] = React.useState('Glow Drops');
  const [brand, setBrand] = React.useState('Lume Botanica');

  // tab header (close + step indicator)
  const Header = ({ title, subtitle }) =>
  <div style={{ paddingTop: 56, paddingBottom: 12, paddingLeft: 22, paddingRight: 22, position: 'relative' }}>
      <button onClick={() => onNavigate('home')} style={{
      position: 'absolute', top: 56, right: 18,
      width: 32, height: 32, borderRadius: 999, border: 'none',
      background: 'rgba(60,40,20,.7)', color: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
      </button>
      <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>
        step {step + 1} of 4 · add product
      </div>
      <div style={{ fontFamily: 'Caveat, cursive', fontSize: 32, color: LUME.ink, fontWeight: 600, lineHeight: 1.1, marginTop: 2 }}>{title}</div>
      <Underline width={64} color={LUME.terracotta} style={{ marginTop: 2 }} />
      {subtitle && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: LUME.inkSoft, marginTop: 6, lineHeight: 1.4 }}>{subtitle}</div>}
    </div>;


  const PrimaryBtn = ({ onClick, children, style = {} }) =>
  <button onClick={onClick} style={{
    padding: '12px 22px', borderRadius: 999, border: 'none',
    background: LUME.terracottaDeep, color: '#fff', cursor: 'pointer',
    fontFamily: 'Courier Prime, monospace', fontSize: 12,
    letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
    boxShadow: '0 4px 14px rgba(178,107,74,.4)',
    ...style
  }}>{children}</button>;


  const GhostBtn = ({ onClick, children, style = {} }) =>
  <button onClick={onClick} style={{
    padding: '12px 22px', borderRadius: 999,
    background: 'transparent', color: LUME.ink, cursor: 'pointer',
    border: '1.5px solid rgba(60,40,20,.3)',
    fontFamily: 'Courier Prime, monospace', fontSize: 12,
    letterSpacing: 1.4, textTransform: 'uppercase',
    ...style
  }}>{children}</button>;


  // ───── Step 0: camera framing ─────
  if (step === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Header title="snap the front" subtitle="we'll cut out the background and turn it into a sticker. hold steady." />
        <div style={{ padding: '8px 22px 22px' }}>
          {/* camera viewfinder */}
          <div style={{
            position: 'relative',
            background: '#1A1410',
            borderRadius: 18,
            aspectRatio: '3/4',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,.25)'
          }}>
            {/* fake camera view */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 40%, #4A3A2C, #1A1410 70%)'
            }} />
            {/* product silhouette */}
            <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)' }}>
              <ProductBottleA size={170} />
            </div>
            {/* framing brackets */}
            {[['T', 'L'], ['T', 'R'], ['B', 'L'], ['B', 'R']].map(([v, h]) =>
            <div key={v + h} style={{
              position: 'absolute',
              [v === 'T' ? 'top' : 'bottom']: 28,
              [h === 'L' ? 'left' : 'right']: 28,
              width: 24, height: 24,
              borderTop: v === 'T' ? '2px solid #F4EDE0' : 'none',
              borderBottom: v === 'B' ? '2px solid #F4EDE0' : 'none',
              borderLeft: h === 'L' ? '2px solid #F4EDE0' : 'none',
              borderRight: h === 'R' ? '2px solid #F4EDE0' : 'none',
              borderRadius: 4
            }} />
            )}
            {/* tip overlay */}
            <div style={{
              position: 'absolute', bottom: 16, left: 16, right: 16,
              padding: '8px 12px',
              background: 'rgba(244,237,224,.92)',
              borderRadius: 10,
              fontFamily: 'Caveat, cursive', fontSize: 16, color: LUME.ink,
              textAlign: 'center', lineHeight: 1.1
            }}>good light + plain background = clean cutout ✨</div>
          </div>
          {/* shutter row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 22 }}>
            <button onClick={() => onNavigate('home')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={LUME.inkSoft} strokeWidth="1.8"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>
            </button>
            <button onClick={() => setStep(1)} style={{
              width: 72, height: 72, borderRadius: 999,
              border: '4px solid #FFFFFF', background: LUME.terracottaDeep,
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(178,107,74,.5)'
            }} />
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={LUME.inkSoft} strokeWidth="1.8" strokeLinecap="round"><path d="M21 12a9 9 0 11-9-9m9 0v6h-6" /></svg>
            </button>
          </div>
        </div>
      </div>);

  }

  // ───── Step 1: cutout preview ─────
  if (step === 1) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Header title="here's your sticker" subtitle="background removed in 0.8s. tap the chips below to fix anything." />
        <div style={{ padding: '12px 22px 16px' }}>
          {/* sticker preview */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '20px 0 14px' }}>
            <div style={{
              width: 180, padding: 16,
              background: LUME.paper, borderRadius: 12,
              boxShadow: '0 2px 6px rgba(20,18,14,.12), 0 12px 28px rgba(20,18,14,.16)',
              border: '1px solid rgba(40,35,28,.10)'
            }} data-comment-anchor="3e37c81b8a-div-126-13">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 140 }}>
                <ProductBottleA size={110} />
              </div>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, textAlign: 'center', marginTop: 6, letterSpacing: .5, color: LUME.ink }}>
                {brand.toUpperCase()}
              </div>
              <div style={{ fontFamily: 'Caveat, cursive', fontSize: 20, textAlign: 'center', fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>
                {productName}
              </div>
            </div>
            <Sparkle size={20} color={LUME.ochre} style={{ position: 'absolute', top: 16, right: '12%', transform: 'rotate(12deg)' }} />
          </div>

          {/* editable fields, journal style */}
          <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 14, border: '1px solid rgba(40,35,28,.10)' }}>
            <Field label="product name" value={productName} onChange={setProductName} />
            <Field label="brand" value={brand} onChange={setBrand} />
            <Field label="category" value="skincare · serum" readOnly tag />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16 }}>
            <GhostBtn onClick={() => setStep(0)}>retake</GhostBtn>
            <PrimaryBtn onClick={() => setStep(2)}>scan back →</PrimaryBtn>
          </div>
        </div>
      </div>);

  }

  // ───── Step 2: scan the back (OCR) ─────
  if (step === 2) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
        <Header title="now the back" subtitle="we read the ingredient list so verdict knows what's in there." />
        <div style={{ padding: '8px 22px 22px' }}>
          <div style={{
            position: 'relative',
            background: '#1A1410',
            borderRadius: 18,
            aspectRatio: '3/4',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,.25)'
          }}>
            {/* fake ingredient label */}
            <div style={{
              position: 'absolute', top: '14%', left: '12%', right: '12%', bottom: '14%',
              background: '#F4EEDC',
              borderRadius: 4,
              padding: '12px 14px',
              transform: 'rotate(-1deg)',
              fontFamily: 'monospace', fontSize: 6.5, color: '#3D2F26',
              lineHeight: 1.4, overflow: 'hidden'
            }}>
              <div style={{ fontSize: 7.5, fontWeight: 700, marginBottom: 4 }}>INGREDIENTS</div>
              <div>Aqua/Water, Niacinamide, Glycerin, Pentylene Glycol, Zinc PCA, Sodium Hyaluronate, Tocopheryl Acetate, Centella Asiatica Extract, Panthenol, Allantoin, Citric Acid, Sodium Benzoate, Potassium Sorbate.</div>
              <div style={{ fontSize: 6, marginTop: 8, color: '#6B5A4D' }}>Net Wt. 30ml / 1.0 fl. oz.</div>
            </div>
            {/* scan line animation suggested by horizontal pill */}
            <div style={{
              position: 'absolute', top: '46%', left: 22, right: 22,
              height: 2, background: 'linear-gradient(90deg, transparent, #C9886A, transparent)',
              boxShadow: '0 0 16px rgba(201,136,106,.6)'
            }} />
            {/* OCR hits */}
            {[
            { top: '24%', left: '20%', text: 'Niacinamide' },
            { top: '30%', left: '36%', text: 'Hyaluronate' },
            { top: '36%', left: '24%', text: 'Centella' }].
            map((h, i) =>
            <div key={i} style={{
              position: 'absolute', top: h.top, left: h.left,
              padding: '2px 6px', background: 'rgba(168,184,156,.95)',
              color: '#3D2F26',
              fontFamily: 'Courier Prime, monospace', fontSize: 7.5,
              fontWeight: 700, letterSpacing: .3,
              borderRadius: 3,
              transform: 'rotate(-2deg)'
            }}>{h.text} ✓</div>
            )}
            <div style={{
              position: 'absolute', bottom: 16, left: 16, right: 16,
              padding: '8px 12px',
              background: 'rgba(244,237,224,.92)',
              borderRadius: 10,
              fontFamily: 'Inter, sans-serif', fontSize: 11.5, color: LUME.ink,
              textAlign: 'center', lineHeight: 1.3
            }}>
              <span style={{ fontFamily: 'Caveat, cursive', fontSize: 15, fontWeight: 600, marginRight: 6 }}>reading…</span>
              gemini vision · 87% confidence
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16 }}>
            <GhostBtn onClick={() => setStep(1)}>← back</GhostBtn>
            <PrimaryBtn onClick={() => setStep(3)}>looks right →</PrimaryBtn>
          </div>
        </div>
      </div>);

  }

  // ───── Step 3: ingredients confirmed ─────
  const flags = [
  { ing: 'Niacinamide', tag: 'brightens · barrier', tone: 'good' },
  { ing: 'Sodium Hyaluronate', tag: 'humectant', tone: 'good' },
  { ing: 'Centella Asiatica', tag: 'calming', tone: 'good' },
  { ing: 'Pentylene Glycol', tag: 'humectant', tone: 'neutral' },
  { ing: 'Zinc PCA', tag: 'oil balance', tone: 'good' },
  { ing: 'Sodium Benzoate', tag: 'preservative', tone: 'neutral' }];

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>
      <Header title="ingredients caught" subtitle="13 ingredients · we'll let the verdict engine chew on these." />
      <div style={{ padding: '8px 22px 22px' }}>
        {/* sticker preview */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '6px 0 14px' }}>
          <div style={{
            width: 130, padding: 10,
            background: LUME.paper, borderRadius: 10,
            boxShadow: '0 2px 6px rgba(20,18,14,.12)',
            transform: 'rotate(-2deg)',
            border: '1px solid rgba(40,35,28,.10)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', height: 90 }}>
              <ProductBottleA size={70} />
            </div>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, textAlign: 'center', marginTop: 4, color: LUME.ink }}>
              {brand.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 16, textAlign: 'center', fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>
              {productName}
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: 14, padding: 14, border: '1px solid rgba(40,35,28,.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1, textTransform: 'uppercase' }}>
              ingredient list · 13
            </div>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 14, color: LUME.terracottaDeep, fontWeight: 600 }}>edit</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {flags.map((f, i) => {
              const bg = f.tone === 'good' ? 'rgba(168,184,156,.22)' : 'rgba(217,164,91,.22)';
              const bd = f.tone === 'good' ? LUME.sageDeep : LUME.ochre;
              return (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 999,
                  background: bg, border: `1px solid ${bd}`
                }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: LUME.ink, fontWeight: 500 }}>{f.ing}</span>
                  <span style={{ fontFamily: 'Caveat, cursive', fontSize: 13, color: bd, fontWeight: 600, lineHeight: 1 }}>· {f.tag}</span>
                </div>);

            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16 }}>
          <GhostBtn onClick={() => setStep(2)}>← retry scan</GhostBtn>
          <PrimaryBtn onClick={() => onNavigate('home')}>save to shelf ✓</PrimaryBtn>
        </div>
      </div>
    </div>);

}

function Field({ label, value, onChange, readOnly, tag }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid rgba(40,35,28,.07)' }}>
      <div style={{
        width: 88, fontFamily: 'Courier Prime, monospace', fontSize: 10,
        color: LUME.inkSoft, letterSpacing: .8, textTransform: 'uppercase'
      }}>{label}</div>
      {tag ?
      <div style={{
        padding: '3px 9px', borderRadius: 999,
        background: 'rgba(168,184,156,.25)', color: LUME.sageDeep,
        fontFamily: 'Caveat, cursive', fontSize: 15, fontWeight: 600
      }}>{value}</div> :

      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'Caveat, cursive', fontWeight: 600, fontSize: 18, color: LUME.ink,
          padding: 0
        }} />

      }
    </div>);

}

Object.assign(window, { AddProductScreen });