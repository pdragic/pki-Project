export const patterns = {
  // najmanje dve reči, samo slova (uključujući š, đ, č, ć, ž), dozvoljeni - ' .
  name: /^\p{L}[\p{L}'’.-]+(\s+\p{L}[\p{L}'’.-]+)+$/u,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  // npr. +381 64 123 4567, 064/123-4567, 0641234567
  phone: /^\+?\d[\d\s/-]{6,14}\d$/,
  // mora imati slova i broj, npr. "Bulevar kralja Aleksandra 73, Beograd"
  address: /^(?=.*\p{L})(?=.*\d)[\p{L}\d\s.,'’/-]{5,100}$/u,
  // najmanje 8 karaktera, malo slovo, veliko slovo i cifra, bez razmaka
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{8,64}$/,
}

export const rules = {
  name: (v: string) =>
    patterns.name.test(v.trim()) ? '' : 'Unesite ime i prezime (najmanje dve reči, samo slova).',
  email: (v: string) =>
    patterns.email.test(v.trim()) ? '' : 'Unesite ispravnu email adresu (npr. ime@domen.com).',
  phone: (v: string) =>
    patterns.phone.test(v.trim()) ? '' : 'Unesite ispravan broj telefona (npr. +381 64 123 4567).',
  address: (v: string) =>
    patterns.address.test(v.trim()) ? '' : 'Unesite ulicu i broj (npr. Knez Mihailova 5, Beograd).',
  password: (v: string) =>
    patterns.password.test(v)
      ? ''
      : 'Šifra mora imati najmanje 8 karaktera, malo slovo, veliko slovo i cifru, bez razmaka.',
}