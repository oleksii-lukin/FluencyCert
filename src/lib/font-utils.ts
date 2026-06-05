export function isVariableFont(bytes: Uint8Array | ArrayBuffer): boolean {
  return isFontIncompatible(bytes)
}

export function isFontIncompatible(bytes: Uint8Array | ArrayBuffer): boolean {
  const view = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes
  if (view.length < 12) return false

  const numTables = (view[4] << 8) | view[5]

  const incompatibleTables = new Set(['fvar', 'gvar', 'CFF2'])

  for (let i = 0; i < numTables; i++) {
    const offset = 12 + i * 16
    if (offset + 4 > view.length) break
    const tag = String.fromCharCode(
      view[offset],
      view[offset + 1],
      view[offset + 2],
      view[offset + 3],
    )
    if (incompatibleTables.has(tag)) return true
  }

  return false
}
