import React from 'react';

const macroColors = { protein: '#ff6b6b', carbs: '#4ecdc4', fat: '#ffd93d' };

function MacroBar({ label, current, target, color, unit }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{ width: 50, color: 'var(--color-fg-muted)', textAlign: 'right', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--color-border-subtle)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ width: 80, color: 'var(--color-fg-primary)', textAlign: 'left', flexShrink: 0 }}>
        {current.toFixed(0)} / {target.toFixed(0)} {unit}
      </span>
    </div>
  );
}

function TotalsSummary({ totals, tdee, macros }) {
  const hasTargets = tdee > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .ts-bar {
          position: fixed; bottom: 0; left: 0; width: 100%;
          background: var(--color-bg-card); border-top: 1px solid var(--color-border-subtle);
          z-index: 1000; padding: 10px 24px; box-sizing: border-box;
          display: flex; gap: 24px; align-items: center; flex-wrap: wrap;
        }
        .ts-item { display: flex; flex-direction: column; align-items: center; gap: 1px; }
        .ts-value { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--color-accent); line-height: 1; }
        .ts-label { font-family: 'DM Sans', sans-serif; font-size: 10px; color: var(--color-fg-muted); text-transform: uppercase; letter-spacing: 1px; }
      `}</style>

      <div className="ts-bar">
        <div className="ts-item">
          <span className="ts-value">{parseFloat(totals?.energy || 0).toFixed(0)} kcal</span>
          <span className="ts-label">Kalorie</span>
        </div>
        <div className="ts-item">
          <span className="ts-value">{parseFloat(totals?.proteins || 0).toFixed(1)} g</span>
          <span className="ts-label">Białko</span>
        </div>
        <div className="ts-item">
          <span className="ts-value">{parseFloat(totals?.fat || 0).toFixed(1)} g</span>
          <span className="ts-label">Tłuszcz</span>
        </div>
        <div className="ts-item">
          <span className="ts-value">{parseFloat(totals?.sugars || 0).toFixed(1)} g</span>
          <span className="ts-label">Węglowodany</span>
        </div>

        {hasTargets && (
          <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', gap: 4, borderLeft: '1px solid var(--color-border-default)', paddingLeft: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--color-fg-muted)', marginBottom: 2 }}>
              Cel: <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{tdee} kcal</span>
            </div>
            <MacroBar label="Białko" current={totals?.proteins || 0} target={macros.protein} color={macroColors.protein} unit="g" />
            <MacroBar label="Węgle" current={totals?.sugars || 0} target={macros.carbs} color={macroColors.carbs} unit="g" />
            <MacroBar label="Tłuszcz" current={totals?.fat || 0} target={macros.fat} color={macroColors.fat} unit="g" />
          </div>
        )}
      </div>
    </>
  );
}

export default TotalsSummary;
