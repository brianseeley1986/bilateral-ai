// Strip outlet suffixes like " - Miami Herald" and Editorial/Opinion/Analysis prefixes.
export function cleanHeadline(title: string): string {
  if (!title) return ''
  return title
    .replace(/\s[-–|]\s[A-Z][^-–|]{2,50}$/, '')
    .replace(/^Editorial:\s*/i, '')
    .replace(/^Opinion:\s*/i, '')
    .replace(/^Analysis:\s*/i, '')
    .trim()
}
