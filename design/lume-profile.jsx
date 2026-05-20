// lume-profile.jsx — Profile / saved selfie

function ProfileScreen({ onNavigate }) {
  const stats = [
    { label: 'products', val: 8 },
    { label: 'scans', val: 5 },
    { label: 'looks', val: 12 },
    { label: 'days', val: 23 },
  ];
  const recentScans = [
    { date: 'Mar 29', age: 27, score: 74, delta: 'up 4' },
    { date: 'Mar 15', age: 28, score: 70, delta: 'up 1' },
    { date: 'Mar 2', age: 29, score: 69, delta: 'flat' },
    { date: 'Feb 18', age: 29, score: 67, delta: 'down 2' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingBottom: 90 }}>
      <div style={{ paddingTop: 56, padding: '56px 22px 8px', position: 'relative' }}>
        <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10, color: LUME.inkSoft, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          your file · jen
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Caveat, cursive', fontSize: 36, color: LUME.ink, fontWeight: 700, lineHeight: 1, marginTop: 2, whiteSpace: 'nowrap' }}>
            hi, jen
          </div>
          <button style={{
            padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(60,40,20,.25)',
            background: 'transparent', cursor: 'pointer',
            fontFamily: 'Courier Prime, monospace', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase',
            color: LUME.ink,
          }}>edit</button>
        </div>
        <Underline width={56} color={LUME.terracotta} strokeWidth={2.4} style={{ marginTop: 2 }} />
      </div>

      <div style={{ padding: '8px 22px 0' }}>
        {/* Selfie hero card */}
        <div style={{
          display: 'flex', gap: 14, padding: 14,
          background: LUME.paper, borderRadius: 14,
          border: '1px solid rgba(40,35,28,.10)',
          boxShadow: '0 1px 3px rgba(20,18,14,.06), 0 4px 14px rgba(20,18,14,.06)',
          position: 'relative',
        }}>
          <div style={{ position: 'relative' }}>
            <SelfiePlaceholder size={88} style={{ borderRadius: 999, overflow: 'hidden', border: '4px solid #fff' }} />
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 28, height: 28, borderRadius: 999, background: LUME.terracottaDeep,
              border: '2.5px solid #FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/><circle cx="12" cy="13" r="3"/></svg>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .8, textTransform: 'uppercase' }}>saved selfie</div>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 20, fontWeight: 600, color: LUME.ink, lineHeight: 1.1 }}>jen · march 29</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: LUME.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
              used for verdict & look rendering. neutral lighting, no makeup — perfect.
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => onNavigate('scan')} style={{
                padding: '5px 10px', borderRadius: 999, border: 'none',
                background: LUME.sageDeep, color: '#fff', cursor: 'pointer',
                fontFamily: 'Courier Prime, monospace', fontSize: 9.5, letterSpacing: .8, textTransform: 'uppercase',
              }}>retake</button>
              <button style={{
                padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(60,40,20,.2)',
                background: 'transparent', color: LUME.ink, cursor: 'pointer',
                fontFamily: 'Courier Prime, monospace', fontSize: 9.5, letterSpacing: .8, textTransform: 'uppercase',
              }}>tone palette</button>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              background: '#FFFFFF', borderRadius: 10, padding: '8px 6px',
              border: '1px solid rgba(40,35,28,.10)',
              textAlign: 'center',
              transform: `rotate(${(i - 1.5) * 0.5}deg)`,
            }}>
              <div style={{ fontFamily: 'Caveat, cursive', fontSize: 26, fontWeight: 700, color: LUME.ink, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8.5, color: LUME.inkSoft, letterSpacing: .5, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Skin tone palette card */}
        <div style={{ marginTop: 14, padding: 14, background: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(40,35,28,.10)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 20, fontWeight: 600, color: LUME.ink, lineHeight: 1, whiteSpace: 'nowrap' }}>your tones</div>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .6 }}>NW-22 · warm undertone</div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {['#F2D8C4', '#EAC2A6', '#D9A684', '#C2855E', '#9F5A38'].map((c, i) => (
              <div key={c} style={{
                flex: 1, height: 38, borderRadius: 6,
                background: c, boxShadow: 'inset 0 0 0 1px rgba(20,18,14,.08)',
                transform: `rotate(${((i % 2) ? 1 : -1) * 0.6}deg)`,
              }} />
            ))}
          </div>
          <div style={{ marginTop: 6, fontFamily: 'Inter, sans-serif', fontSize: 10.5, color: LUME.inkSoft }}>
            recommend products near positions 2-3 for closest match.
          </div>
        </div>

        {/* Scan history */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginLeft: 4 }}>
            <div style={{ fontFamily: 'Caveat, cursive', fontSize: 22, fontWeight: 600, color: LUME.ink, lineHeight: 1, whiteSpace: 'nowrap' }}>scan history</div>
            <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9, color: LUME.inkSoft, letterSpacing: .6 }}>{recentScans.length} scans</div>
          </div>
          <Underline width={88} color={LUME.sageDeep} style={{ marginTop: 2, marginLeft: 4 }} />
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentScans.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: i === 0 ? 'rgba(168,184,156,.16)' : '#FFFFFF',
                borderRadius: 10,
                border: '1px solid rgba(40,35,28,.10)',
              }}>
                <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 9.5, color: LUME.inkSoft, width: 56, letterSpacing: .4, textTransform: 'uppercase' }}>{s.date}</div>
                <div style={{ flex: 1, display: 'flex', gap: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, color: LUME.inkSoft }}>age</div>
                    <div style={{ fontFamily: 'Caveat, cursive', fontSize: 17, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>{s.age}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 8, color: LUME.inkSoft }}>score</div>
                    <div style={{ fontFamily: 'Caveat, cursive', fontSize: 17, fontWeight: 600, color: LUME.ink, lineHeight: 1 }}>{s.score}</div>
                  </div>
                </div>
                <div style={{
                  fontFamily: 'Courier Prime, monospace', fontSize: 9, letterSpacing: .5,
                  color: s.delta.startsWith('up') ? LUME.sageDeep : s.delta.startsWith('down') ? LUME.terracottaDeep : LUME.inkFaint,
                  background: s.delta.startsWith('up') ? 'rgba(168,184,156,.2)' : s.delta.startsWith('down') ? 'rgba(201,136,106,.18)' : 'rgba(20,18,14,.05)',
                  padding: '2px 6px', borderRadius: 999, textTransform: 'uppercase', fontWeight: 700,
                }}>{s.delta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings list */}
        <div style={{ marginTop: 16, padding: 4, background: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(40,35,28,.10)' }}>
          {[
            { l: 'magic link sign-in', r: 'jen@hi.dev' },
            { l: 'reminder cadence', r: 'weekly' },
            { l: 'export my data', r: '→' },
            { l: 'sign out', r: '→', danger: true },
          ].map((row, i, arr) => (
            <div key={row.l} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px',
              borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(40,35,28,.07)',
              cursor: 'pointer',
            }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: row.danger ? LUME.terracottaDeep : LUME.ink, fontWeight: 500 }}>{row.l}</div>
              <div style={{ fontFamily: 'Courier Prime, monospace', fontSize: 10.5, color: LUME.inkSoft, letterSpacing: .4 }}>{row.r}</div>
            </div>
          ))}
        </div>
      </div>

      <DashNav onNavigate={onNavigate} active="profile" />
    </div>
  );
}

Object.assign(window, { ProfileScreen });
