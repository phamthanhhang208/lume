// lume-app.jsx — Main app: design canvas + interactive prototype + tweaks

const LUME_DEFAULTS = /*EDITMODE-BEGIN*/{
  "intensity": "medium",
  "fontPair": "scrapbook",
  "dashboard": "pinboard",
  "verdictTag": "chip",
  "paper": "cream"
}/*EDITMODE-END*/;

// Apply chosen font pairing to CSS variables
function applyFonts(pair) {
  const root = document.documentElement;
  const pairs = {
    scrapbook: {
      // Editorial italic serif headlines + clean modern sans UI.
      // The Apple+scrapbook reference look. Instrument Serif reads better
      // at regular weight than bold — force 400.
      head: "'Instrument Serif', serif",
      headScale: 0.88,
      headWeight: 400,
      mono: "'Courier Prime', monospace",
      ui:   "'Bricolage Grotesque', sans-serif",
    },
    folderly: {
      head: "'Bricolage Grotesque', sans-serif",
      headScale: 0.82,
      mono: "'Courier Prime', monospace",
      ui:   "'Bricolage Grotesque', sans-serif",
    },
    caveat: {
      head: "'Caveat', cursive",
      mono: "'Courier Prime', monospace",
      ui:   "'Inter', sans-serif",
    },
    shadows: {
      head: "'Shadows Into Light', cursive",
      mono: "'Courier Prime', monospace",
      ui:   "'Inter', sans-serif",
    },
    homemade: {
      head: "'Homemade Apple', cursive",
      mono: "'Courier Prime', monospace",
      ui:   "'Bricolage Grotesque', sans-serif",
    },
    serif: {
      head: "'Instrument Serif', serif",
      mono: "'Courier Prime', monospace",
      ui:   "'Inter', sans-serif",
    },
  };
  const p = pairs[pair] || pairs.scrapbook;
  root.style.setProperty('--font-head', p.head);
  root.style.setProperty('--font-mono', p.mono);
  root.style.setProperty('--font-ui', p.ui);
  const italicRule = p.headItalic ? 'font-style: italic !important;' : '';
  const weightRule = p.headWeight ? `font-weight: ${p.headWeight} !important;` : '';
  const scale = p.headScale ?? (p.head.includes('Caveat') ? 1 : 0.85);
  const scaleRules = scale === 1 ? '' : [16,17,18,19,20,21,22,24,26,28,30,32,34,36,38,40,44,48,52,56].map((px) => {
    const scaled = Math.round(px * scale);
    return `[style*="Caveat"][style*="font-size: ${px}px"] { font-size: ${scaled}px !important; }`;
  }).join('\n');
  const css = `
    [style*="Caveat"] { font-family: ${p.head} !important; ${italicRule} ${weightRule} letter-spacing: -0.015em; }
    [style*="Courier Prime"] { font-family: ${p.mono} !important; }
    [style*="Inter"] { font-family: ${p.ui} !important; }
    ${scaleRules}
  `;
  let style = document.getElementById('lume-font-override');
  if (!style) {
    style = document.createElement('style');
    style.id = 'lume-font-override';
    document.head.appendChild(style);
  }
  style.textContent = css;
}

// Phone wrapper — IOSDevice w/ a relative container that fills the screen area
function Phone({ children, paper = 'cream', grid = true }) {
  return (
    <IOSDevice width={402} height={874}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <PaperBg variant={paper} grid={grid} />
        {children}
      </div>
    </IOSDevice>
  );
}

// Product detail sheet — overlays on top of any screen
function ProductSheet({ product, onClose, tagStyle = 'chip' }) {
  if (!product) return null;
  const Svg = PRODUCT_SVGS[product.kind];
  const v = VERDICTS[product.id];
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(60,40,20,.4)',
      backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: LUME.paper,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '20px 22px 32px',
        boxShadow: '0 -8px 32px rgba(20,18,14,.16)',
        position: 'relative',
        minHeight: 460,
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(20,18,14,.16)', borderRadius: 999, margin: '0 auto 14px' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 90, height: 110,
            background: '#fff', border: '1px solid rgba(40,35,28,.10)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(-3deg)',
            boxShadow: '0 2px 6px rgba(20,18,14,.10)',
          }}>
            <Svg size={72} hue={product.hue} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: .8, textTransform: 'uppercase' }}>{product.brand}</div>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 32, fontWeight: 700, color: LUME.ink, lineHeight: 1 }}>{product.name}</div>
            <div style={{ marginTop: 6, display: 'inline-block', padding: '3px 8px', background: 'rgba(168,184,156,.22)', border: '1px solid rgba(124,145,112,.5)', borderRadius: 999, fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.sageDeep, letterSpacing: .6, textTransform: 'uppercase' }}>{product.category} · {product.subcat}</div>
            {v && (
              <div style={{ marginTop: 10 }}>
                <VerdictTag verdict={v.v} style={tagStyle} />
              </div>
            )}
          </div>
        </div>

        {v && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(40,35,28,.10)' }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 18, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>why</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: LUME.ink, lineHeight: 1.5, marginTop: 4 }}>{v.reason}</div>
            <div style={{ marginTop: 8, display: 'inline-block', fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, background: 'rgba(20,18,14,.05)', padding: '3px 8px', borderRadius: 4, letterSpacing: .4 }}>{v.delta}</div>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9.5, color: LUME.inkSoft, letterSpacing: .8, textTransform: 'uppercase', marginBottom: 6 }}>
            ingredients · {product.ingredients.length}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {product.ingredients.map((ing) => (
              <span key={ing} style={{
                padding: '3px 8px', borderRadius: 999, background: '#fff',
                border: '1px solid rgba(40,35,28,.12)',
                fontFamily: 'Inter, sans-serif', fontSize: 10.5, color: LUME.ink,
              }}>{ing}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px 18px', borderRadius: 999, border: '1.5px solid rgba(60,40,20,.25)',
            background: 'transparent', color: LUME.ink, cursor: 'pointer',
            fontFamily: 'Courier Prime, monospace', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700,
          }}>close</button>
          <button style={{
            flex: 1, padding: '11px 18px', borderRadius: 999, border: 'none',
            background: LUME.terracottaDeep, color: '#fff', cursor: 'pointer',
            fontFamily: 'Courier Prime, monospace', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700,
            boxShadow: '0 4px 14px rgba(178,107,74,.4)',
          }}>add to look</button>
        </div>
      </div>
    </div>
  );
}

// ─────────── Interactive prototype ───────────
function LumePrototype({ tweaks }) {
  const [screen, setScreen] = React.useState('home');
  const [product, setProduct] = React.useState(null);
  const [empty, setEmpty] = React.useState(false);

  const onNavigate = React.useCallback((target, payload) => {
    if (target === 'product') { setProduct(payload); return; }
    setScreen(target);
  }, []);

  return (
    <Phone paper={tweaks.paper} grid={tweaks.intensity !== 'restrained'}>
      {screen === 'home' && (
        <LumeDashboard layout={tweaks.dashboard} empty={empty} intensity={tweaks.intensity} onNavigate={onNavigate} />
      )}
      {screen === 'add' && (
        <AddProductScreen onNavigate={onNavigate} intensity={tweaks.intensity} />
      )}
      {screen === 'scan' && (
        <SkinAnalysisScreen onNavigate={onNavigate} />
      )}
      {screen === 'verdict' && (
        <VerdictScreen variant="card" tagStyle={tweaks.verdictTag} onNavigate={onNavigate} />
      )}
      {screen === 'look' && (
        <LookScreen onNavigate={onNavigate} />
      )}
      {screen === 'profile' && (
        <ProfileScreen onNavigate={onNavigate} />
      )}
      <ProductSheet product={product} onClose={() => setProduct(null)} tagStyle={tweaks.verdictTag} />
    </Phone>
  );
}

// ─────────── App root ───────────
function App() {
  const [t, setT] = useTweaks(LUME_DEFAULTS);

  React.useEffect(() => { applyFonts(t.fontPair); }, [t.fontPair]);

  // Static variant artboards: use a frozen sub-renderer with stable nav (no real navigation)
  const noop = () => {};

  return (
    <DesignCanvas>
      <DCSection id="prototype" title="The Lume prototype" subtitle="Tap through • Tweaks panel (toolbar) controls intensity, fonts, dashboard layout, paper, verdict-tag style.">
        <DCArtboard id="interactive" label="Interactive · iPhone" width={402} height={874}>
          <LumePrototype tweaks={t} />
        </DCArtboard>
        <DCArtboard id="empty" label="Dashboard · empty state" width={402} height={874}>
          <Phone paper={t.paper}>
            <DashboardShelf onNavigate={noop} empty={true} />
          </Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="dashboards" title="Dashboard · three metaphors" subtitle="Three answers for the home screen — pick one, mix two, or expose as a setting.">
        <DCArtboard id="d-shelf" label="A · Vanity shelf" width={402} height={874}>
          <Phone paper={t.paper}>
            <DashboardShelf onNavigate={noop} />
          </Phone>
        </DCArtboard>
        <DCArtboard id="d-pinboard" label="B · Tidy grid" width={402} height={874}>
          <Phone paper={t.paper}>
            <DashboardPinboard onNavigate={noop} />
          </Phone>
        </DCArtboard>
        <DCArtboard id="d-journal" label="C · Journal spread" width={402} height={874}>
          <Phone paper={t.paper}>
            <DashboardJournal onNavigate={noop} />
          </Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="add" title="Add Product · flow" subtitle="Camera → background-removed sticker → flip → OCR ingredients → save.">
        <DCArtboard id="add-0" label="① Camera" width={402} height={874}>
          <Phone paper={t.paper}><AddProductScreen onNavigate={noop} step={0} /></Phone>
        </DCArtboard>
        <DCArtboard id="add-1" label="② Sticker preview" width={402} height={874}>
          <Phone paper={t.paper}><AddProductScreen onNavigate={noop} step={1} /></Phone>
        </DCArtboard>
        <DCArtboard id="add-2" label="③ OCR scan" width={402} height={874}>
          <Phone paper={t.paper}><AddProductScreen onNavigate={noop} step={2} /></Phone>
        </DCArtboard>
        <DCArtboard id="add-3" label="④ Ingredients caught" width={402} height={874}>
          <Phone paper={t.paper}><AddProductScreen onNavigate={noop} step={3} /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="skin" title="Skin Analysis · flow" subtitle="Selfie → 14 Perfect Corp metrics → skin age + overall score.">
        <DCArtboard id="skin-0" label="① Capture" width={402} height={874}>
          <Phone paper={t.paper}><SkinAnalysisScreen onNavigate={noop} step={0} /></Phone>
        </DCArtboard>
        <DCArtboard id="skin-1" label="② Analyzing" width={402} height={874}>
          <Phone paper={t.paper}><SkinAnalysisScreen onNavigate={noop} step={1} /></Phone>
        </DCArtboard>
        <DCArtboard id="skin-2" label="③ Results" width={402} height={874}>
          <Phone paper={t.paper}><SkinAnalysisScreen onNavigate={noop} step={2} /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="verdict" title="Verdict · two formats" subtitle="The AI-magic moment. Same data, two reads.">
        <DCArtboard id="v-tray" label="A · Sort tray (3 piles)" width={402} height={874}>
          <Phone paper={t.paper}><VerdictSortTray onNavigate={noop} tagStyle={t.verdictTag} /></Phone>
        </DCArtboard>
        <DCArtboard id="v-card" label="B · Report card (per-product)" width={402} height={874}>
          <Phone paper={t.paper}><VerdictReportCard onNavigate={noop} tagStyle={t.verdictTag} /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="look" title="Build Me a Look · flow" subtitle="Prompt → AI casts your products → magazine-page VTO render.">
        <DCArtboard id="look-0" label="① Vibe prompt" width={402} height={874}>
          <Phone paper={t.paper}><LookScreen onNavigate={noop} step={0} /></Phone>
        </DCArtboard>
        <DCArtboard id="look-1" label="② Cast" width={402} height={874}>
          <Phone paper={t.paper}><LookScreen onNavigate={noop} step={1} /></Phone>
        </DCArtboard>
        <DCArtboard id="look-2" label="③ Magazine spread" width={402} height={874}>
          <Phone paper={t.paper}><LookScreen onNavigate={noop} step={2} /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="profile" title="Profile · saved selfie & history" subtitle="The hub for the reusable selfie and scan-over-time.">
        <DCArtboard id="profile-0" label="Profile" width={402} height={874}>
          <Phone paper={t.paper}><ProfileScreen onNavigate={noop} /></Phone>
        </DCArtboard>
      </DCSection>

      <DCSection id="desktop" title="Desktop · responsive comparison" subtitle="Same metaphor at desktop size. PWA installable; tablet adapts between these breakpoints.">
        <DCArtboard id="desktop-1" label="Desktop · 1280" width={1280} height={820}>
          <LumeDesktop width={1280} height={820} />
        </DCArtboard>
      </DCSection>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Style">
          <TweakRadio
            label="Intensity"
            value={t.intensity}
            options={['restrained', 'medium', 'maximal']}
            onChange={(v) => setT('intensity', v)}
          />
          <TweakSelect
            label="Font pair"
            value={t.fontPair}
            options={[
              { label: 'Scrapbook · Instrument Serif + Bricolage', value: 'scrapbook' },
              { label: 'Folderly · Bricolage modern', value: 'folderly' },
              { label: 'Caveat + Courier + Inter', value: 'caveat' },
              { label: 'Shadows Into Light + …', value: 'shadows' },
              { label: 'Homemade Apple + Bricolage', value: 'homemade' },
              { label: 'Instrument Serif (editorial)', value: 'serif' },
            ]}
            onChange={(v) => setT('fontPair', v)}
          />
          <TweakRadio
            label="Paper"
            value={t.paper}
            options={['cream', 'notebook', 'dotgrid']}
            onChange={(v) => setT('paper', v)}
          />
        </TweakSection>

        <TweakSection label="Dashboard layout" />
        <TweakRadio
          label="Layout"
          value={t.dashboard}
          options={[
            { label: 'Shelf', value: 'shelf' },
            { label: 'Grid', value: 'pinboard' },
            { label: 'Journal', value: 'journal' },
          ]}
          onChange={(v) => setT('dashboard', v)}
        />

        <TweakSection label="Verdict tag" />
        <TweakRadio
          label="Style"
          value={t.verdictTag}
          options={['chip', 'stamp', 'sticky']}
          onChange={(v) => setT('verdictTag', v)}
        />
      </TweaksPanel>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
