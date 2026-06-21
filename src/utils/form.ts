export function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinCommaSeparated(values: string[]): string {
  return values.join(', ')
}
