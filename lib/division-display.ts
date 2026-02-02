/**
 * Utility for converting division database values to display names
 * Database values remain unchanged, but display names are customized
 */

export const DIVISION_DISPLAY_MAP: Record<string, string> = {
  'Pre-School': 'Pre-School',
  'Elementary': 'Elementary',
  'Middle School': 'Intermediate',
  'High School': 'Secondary',
  'Technical Institute': 'Technical Institute'
}

export const DIVISION_OPTIONS = [
  { value: 'Pre-School', label: 'Pre-School' },
  { value: 'Elementary', label: 'Elementary' },
  { value: 'Middle School', label: 'Intermediate' },
  { value: 'High School', label: 'Secondary' },
  { value: 'Technical Institute', label: 'Technical Institute' }
]

/**
 * Get display name for a division value from the database
 */
export function getDivisionDisplayName(division: string | undefined): string {
  if (!division) return ''
  return DIVISION_DISPLAY_MAP[division] || division
}

/**
 * Get all division values (for database queries)
 */
export function getDivisionValues(): string[] {
  return Object.keys(DIVISION_DISPLAY_MAP)
}
