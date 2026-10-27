export interface Review {
  author: string
  rating: number // 1-5
  text: string
}

const authors = ['Marko', 'Jelena', 'Nikola', 'Ana', 'Ivana', 'Stefan']
const texts = [
  'Biljka je stigla zdrava i lepo upakovana.',
  'Odličan kvalitet, preporuka.',
  'Dobra cena, malo sitnija nego što sam očekivao.',
  'Lako se održava, čak i za početnike.',
  'Sjajno izgleda u dnevnoj sobi.',
  'Isporuka je kasnila, ali biljka je u redu.',
]

export function getReviews(plantId: number): Review[] {
  const count = (plantId % 3) + 1
  return Array.from({ length: count }, (_, i) => ({
    author: authors[(plantId + i) % authors.length]!,
    rating: ((plantId * 3 + i * 2) % 3) + 3, // 3..5
    text: texts[(plantId + i * 2) % texts.length]!,
  }))
}