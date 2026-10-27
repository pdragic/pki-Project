export interface Ctx {
  loggedIn: boolean
  name: string
  cartCount: number
}

export interface Option {
  label: string
  next?: string
  to?: string
}

export interface AgentNode {
  text: string | ((c: Ctx) => string)
  options: Option[]
}

export const START = 'start'

const back: Option = { label: '↩ Nazad na početak', next: START }

export const tree: Record<string, AgentNode> = {
  start: {
    text: c => `Zdravo${c.name ? ', ' + c.name : ''}! Ja sam Biljko, vaš pomoćnik. Šta vas zanima?`,
    options: [
      { label: 'Pretraga biljaka', next: 'search' },
      { label: 'Rezervacija', next: 'reserve' },
      { label: 'Korpa i statusi', next: 'cart' },
      { label: 'Nega biljaka', next: 'care' },
      { label: 'Nalog i profil', next: 'account' },
    ],
  },

  search: {
    text:
      'Biljke možete da pretražujete po nazivu, opisu (sadnja i nega), vrsti, podneblju, sezoni, ' +
      'ciljnoj grupi, datumu proizvodnje, ceni i recenzijama. Svaki kriterijum radi i samostalno i u kombinaciji.',
    options: [
      { label: 'Otvori pretragu', to: '/plants' },
      { label: 'Pomozi mi da izaberem biljku', next: 'choose' },
      back,
    ],
  },
  choose: {
    text: 'Za šta tražite biljku?',
    options: [
      { label: 'Za stan ili kuću', next: 'indoor' },
      { label: 'Za baštu', next: 'garden' },
      { label: 'Za poklon', next: 'gift' },
      { label: 'Nemam iskustva', next: 'beginner' },
      back,
    ],
  },
  indoor: {
    text:
      'Za enterijer pogledajte kategoriju „Sobne biljke“. Na stranici biljke proverite polje ' +
      '„Svetlost“, da li vaš prostor odgovara njenim potrebama.',
    options: [
      { label: 'Prikaži sobne biljke', to: '/plants?category=Sobne biljke' },
      { label: 'Nazad', next: 'choose' },
      back,
    ],
  },
  garden: {
    text:
      'Za baštu u filteru „Kategorija“ izaberite baštenske biljke, a prema „Sezoni“ ' +
      'odaberite one koje se sade u pravo vreme.',
    options: [
      { label: 'Otvori pretragu', to: '/plants' },
      { label: 'Nazad', next: 'choose' },
      back,
    ],
  },
  gift: {
    text:
      'Za poklon su dobar izbor biljke sa visokom ocenom. U pretrazi podesite „Minimalna ocena“ ' +
      'na 4+ ili čitajte recenzije kupaca.',
    options: [
      { label: 'Otvori pretragu', to: '/plants' },
      { label: 'Nazad', next: 'choose' },
      back,
    ],
  },
  beginner: {
    text:
      'Počnite sa biljkama koje se lako održavaju. Filter „Ciljna grupa“ pokazuje za koga je biljka ' +
      'namenjena, a u opisu nege vidite koliko često se zaliva.',
    options: [
      { label: 'Otvori pretragu', to: '/plants' },
      { label: 'Nazad', next: 'choose' },
      back,
    ],
  },

  reserve: {
    text:
      'Otvorite stranicu biljke i kliknite „Rezerviši“. Dobićete obaveštenje, a biljka se dodaje ' +
      'u korpu rezervacija sa statusom „rezervisano“.',
    options: [
      { label: 'Moram li da se prijavim?', next: 'needLogin' },
      { label: 'Zašto je dugme nedostupno?', next: 'stock' },
      { label: 'Već imam rezervaciju te biljke', next: 'again' },
      back,
    ],
  },
  needLogin: {
    text: c =>
      c.loggedIn
        ? 'Već ste prijavljeni, pa možete odmah da rezervišete.'
        : 'Da. Za rezervaciju i pristup korpi potrebna je prijava, a ako nemate nalog, prvo se registrujte.',
    options: [
      { label: 'Prijava', to: '/login' },
      { label: 'Registracija', to: '/register' },
      back,
    ],
  },
  stock: {
    text:
      'Dugme je onemogućeno kada nema slobodnih komada. Slobodna količina je broj na stanju ' +
      'umanjen za komade koji su vam već pristigli.',
    options: [{ label: 'Nazad', next: 'reserve' }, back],
  },
  again: {
    text:
      'Ako je biljka već rezervisana, klik na „Rezerviši“ pita da li želite da povećate količinu ' +
      'postojeće rezervacije. Količinu možete menjati i u korpi.',
    options: [{ label: 'Nazad', next: 'reserve' }, back],
  },

  cart: {
    text: c =>
      !c.loggedIn
        ? 'Korpi pristupate nakon prijave. U njoj vidite sve rezervacije i ukupnu cenu.'
        : `U korpi trenutno imate stavki: ${c.cartCount}. Šta vas zanima?`,
    options: [
      { label: 'Šta znače statusi?', next: 'statuses' },
      { label: 'Kako da ocenim biljku?', next: 'rate' },
      { label: 'Kako da obrišem stavku?', next: 'delete' },
      { label: 'Otvori korpu', to: '/cart' },
      back,
    ],
  },
  statuses: {
    text:
      'Rezervisano: čeka se isporuka, količinu možete menjati ili otkazati. ' +
      'Pristiglo: biljka je stigla, možete je oceniti ili obrisati. ' +
      'Otkazano: rezervacija je poništena i ne računa se u ukupnu cenu.',
    options: [{ label: 'Nazad', next: 'cart' }, back],
  },
  rate: {
    text:
      'Biljku možete da ocenite tek kada dobije status „pristiglo“. U korpi kliknite „Oceni“, ' +
      'izaberite zvezdice i, ako želite, napišite komentar. Recenziju kasnije možete da izmenite.',
    options: [{ label: 'Nazad', next: 'cart' }, back],
  },
  delete: {
    text:
      'Stavke sa statusom „pristiglo“ (i „otkazano“) brišu se dugmetom „Obriši“. ' +
      'Rezervisanu stavku prvo otkažite, a pre brisanja se traži potvrda.',
    options: [{ label: 'Nazad', next: 'cart' }, back],
  },

  care: {
    text:
      'Uputstvo za sadnju i negu nalazi se na stranici svake biljke, u odeljku „Sadnja i nega“. ' +
      'Možete da pretražujete i po opisu, npr. „saksija“ ili „senka“.',
    options: [
      { label: 'Zalivanje', next: 'water' },
      { label: 'Svetlost', next: 'light' },
      { label: 'Otvori pretragu', to: '/plants' },
      back,
    ],
  },
  water: {
    text:
      'Zalivajte kada se površinski sloj zemlje prosuši, a višak vode neka otiče kroz otvore na saksiji. ' +
      'Tačan raspored za svaku biljku je u polju „Zalivanje“ na njenoj stranici.',
    options: [{ label: 'Nazad', next: 'care' }, back],
  },
  light: {
    text:
      'Neke biljke vole direktno sunce, a neke polusenku. Provera je u polju „Svetlost“ na stranici biljke. ' +
      'Jako podnevno sunce često škodi sobnim biljkama.',
    options: [{ label: 'Nazad', next: 'care' }, back],
  },

  account: {
    text: 'Šta vas zanima u vezi sa nalogom?',
    options: [
      { label: 'Registracija', to: '/register' },
      { label: 'Izmena podataka i omiljenih vrsta', next: 'profile' },
      { label: 'Promena šifre', next: 'password' },
      back,
    ],
  },
  profile: {
    text:
      'U profilu menjate ime, email, telefon, adresu i omiljene vrste biljaka. ' +
      'Izmene se čuvaju klikom na „Sačuvaj izmene“.',
    options: [
      { label: 'Otvori profil', to: '/profile' },
      { label: 'Nazad', next: 'account' },
    ],
  },
  password: {
    text:
      'U profilu, u odeljku „Promena šifre“, unesite trenutnu i novu šifru. ' +
      'Nova šifra mora imati najmanje 8 karaktera, malo i veliko slovo i cifru.',
    options: [
      { label: 'Otvori profil', to: '/profile' },
      { label: 'Nazad', next: 'account' },
    ],
  },

  again2: {
    text: 'Otvorio sam traženu stranicu. Mogu li još nečim da pomognem?',
    options: [
      { label: 'Da, vrati me na početak', next: START },
      { label: 'Hvala, to je sve', next: 'bye' },
    ],
  },
  bye: {
    text: 'Nema na čemu! Uživajte u biljkama. 🌿',
    options: [{ label: 'Nova pitanja', next: START }],
  },
}