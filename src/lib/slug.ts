const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const LENGTH = 6

export function generateSlug(): string {
  const array = new Uint8Array(LENGTH)
  crypto.getRandomValues(array)
  let slug = ''
  for (let i = 0; i < LENGTH; i++) {
    slug += ALPHABET[array[i] % ALPHABET.length]
  }
  return slug
}
