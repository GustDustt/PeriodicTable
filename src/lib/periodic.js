// Grid position of each element in the standard 18-column layout. Rows 9 and
// 10 are the lanthanides and actinides, drawn below a spacer row 8.
export function position(z) {
  if (z === 1) return { row: 1, col: 1 }
  if (z === 2) return { row: 1, col: 18 }
  if (z <= 4) return { row: 2, col: z - 2 }
  if (z <= 10) return { row: 2, col: z + 8 }
  if (z <= 12) return { row: 3, col: z - 10 }
  if (z <= 18) return { row: 3, col: z }
  if (z <= 36) return { row: 4, col: z - 18 }
  if (z <= 54) return { row: 5, col: z - 36 }
  if (z <= 56) return { row: 6, col: z - 54 }
  if (z <= 71) return { row: 9, col: z - 54 }
  if (z <= 86) return { row: 6, col: z - 68 }
  if (z <= 88) return { row: 7, col: z - 86 }
  if (z <= 103) return { row: 10, col: z - 86 }
  return { row: 7, col: z - 100 }
}

// The ~20 elements a school chemistry student types most, in chip order.
export const COMMON = ['H', 'C', 'N', 'O', 'Na', 'Cl', 'S', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Al', 'P', 'Zn', 'Ag', 'Br', 'I', 'F', 'Li']
