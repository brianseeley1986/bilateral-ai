import type { EvidenceTag } from '@/types/debate'

const config: Record<EvidenceTag, { label: string; bg: string; text: string }> = {
  hist: { label: 'HISTORY', bg: '#faeeda', text: '#633806' },
  data: { label: 'DATA', bg: '#e6f1fb', text: '#0c447c' },
  prec: { label: 'PRECEDENT', bg: '#eeedfe', text: '#3c3489' },
  econ: { label: 'ECONOMICS', bg: '#e1f5ee', text: '#085041' }
}

export function SourceBadge({ tag }: { tag: EvidenceTag }) {
  const c = config[tag]
  return (
    <span style={{
      background: c.bg,
      color: c.text,
      fontSize: '10px',
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: '3px',
      letterSpacing: '0.05em',
      flexShrink: 0,
      marginTop: '2px'
    }}>
      {c.label}
    </span>
  )
}
