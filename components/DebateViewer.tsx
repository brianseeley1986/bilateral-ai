'use client'
import { useState } from 'react'
import type { DebateOutput } from '@/types/debate'
import { SourceBadge } from './SourceBadge'

const tabs = ['Context', 'Timeline', 'Conservative', 'Liberal', 'Verdict'] as const
type Tab = typeof tabs[number]

export function DebateViewer({
  debate,
  showHeader = true,
}: {
  debate: DebateOutput
  showHeader?: boolean
}) {
  const [active, setActive] = useState<Tab>('Context')
  const cPosition = debate.conservative!
  const lPosition = debate.liberal!
  const rebuttalData = debate.rebuttal!
  const verdictData = debate.verdict!

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '740px', margin: '0 auto' }}>
      {showHeader && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            {new Date(debate.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 500, lineHeight: 1.3, margin: 0 }}>{debate.headline}</h1>
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '24px', borderBottom: '0.5px solid #e0e0e0', paddingBottom: '12px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              fontSize: '12px',
              padding: '5px 14px',
              borderRadius: '20px',
              border: active === tab ? 'none' : '0.5px solid #d0d0d0',
              background: active === tab ? '#0A0A0A' : 'transparent',
              color: active === tab ? '#F5F5F0' : '#6B6B6B',
              cursor: 'pointer',
              fontWeight: active === tab ? 500 : 400
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === 'Context' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>What happened</div>
            <p style={{ fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{debate.context.whatHappened}</p>
          </div>
          <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Why it matters</div>
            <p style={{ fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{debate.context.whyItMatters}</p>
          </div>
          <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Key facts</div>
            {debate.context.keyFacts.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', lineHeight: 1.6, padding: '4px 0', borderBottom: i < debate.context.keyFacts.length - 1 ? '0.5px solid #e8e8e4' : 'none' }}>
                <span style={{ color: '#6B6B6B', flexShrink: 0 }}>—</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === 'Timeline' && (
        <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '8px 16px' }}>
          {debate.timeline.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: i < debate.timeline.length - 1 ? '0.5px solid #e8e8e4' : 'none' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B6B6B', minWidth: '42px', paddingTop: '2px', flexShrink: 0 }}>{item.year}</span>
              <span style={{ fontSize: '13px', lineHeight: 1.65 }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {active === 'Conservative' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ border: '0.5px solid #e0e0e0', borderLeft: '3px solid #C1121F', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#C1121F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Conservative position</div>
            <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{cPosition.argument}</p>
          </div>
          <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '8px 16px' }}>
            {cPosition.evidence.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < cPosition.evidence.length - 1 ? '0.5px solid #e8e8e4' : 'none' }}>
                <SourceBadge tag={ev.tag} />
                <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#444', paddingTop: '1px' }}>{ev.text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff8e6', border: '0.5px solid #f0d080', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#856404', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Weakest point (self-identified)</div>
            <p style={{ fontSize: '13px', lineHeight: 1.65, margin: 0, color: '#5a4400' }}>{cPosition.weakestPoint}</p>
          </div>
          <div style={{ border: '0.5px solid #e0e0e0', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Rebuttal to Liberal</div>
            <p style={{ fontSize: '13px', lineHeight: 1.65, margin: 0 }}>{rebuttalData.conservative}</p>
          </div>
        </div>
      )}

      {active === 'Liberal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ border: '0.5px solid #e0e0e0', borderLeft: '3px solid #1B4FBE', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#1B4FBE', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Liberal position</div>
            <p style={{ fontSize: '14px', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{lPosition.argument}</p>
          </div>
          <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '8px 16px' }}>
            {lPosition.evidence.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < lPosition.evidence.length - 1 ? '0.5px solid #e8e8e4' : 'none' }}>
                <SourceBadge tag={ev.tag} />
                <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#444', paddingTop: '1px' }}>{ev.text}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff8e6', border: '0.5px solid #f0d080', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#856404', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Weakest point (self-identified)</div>
            <p style={{ fontSize: '13px', lineHeight: 1.65, margin: 0, color: '#5a4400' }}>{lPosition.weakestPoint}</p>
          </div>
          <div style={{ border: '0.5px solid #e0e0e0', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Rebuttal to Conservative</div>
            <p style={{ fontSize: '13px', lineHeight: 1.65, margin: 0 }}>{rebuttalData.liberal}</p>
          </div>
        </div>
      )}

      {active === 'Verdict' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '8px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 0 4px' }}>Where they agree</div>
            {verdictData.agreements.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.65, padding: '7px 0', borderBottom: i < verdictData.agreements.length - 1 ? '0.5px solid #e8e8e4' : 'none' }}>
                <span style={{ color: '#16a34a', flexShrink: 0 }}>✓</span><span>{a}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '8px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 0 4px' }}>Where they conflict</div>
            {verdictData.conflicts.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.65, padding: '7px 0', borderBottom: i < verdictData.conflicts.length - 1 ? '0.5px solid #e8e8e4' : 'none' }}>
                <span style={{ color: '#dc2626', flexShrink: 0 }}>✗</span><span>{c}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#0A0A0A', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Questions neither side has answered</div>
            {verdictData.openQuestions.map((q, i) => (
              <div key={i} style={{ fontSize: '13px', lineHeight: 1.7, color: '#F5F5F0', padding: '6px 0', borderBottom: i < verdictData.openQuestions.length - 1 ? '0.5px solid #333' : 'none' }}>{q}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
