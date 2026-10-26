export interface Plant {
  id: number
  name: string
  latin_name: string
  description: string
  planting_instructions: string
  care_instructions: string
  plant_type: string
  target_audience: string
  light_requirement: string
  watering: string
  intended_use: string
  production_date: string
  price: number
  currency: string
  image_url: string
  image_alt: string
  is_available: boolean
  stock_quantity: number
  category_id: number
  category: string
  climate_id: number
  climate: string
  season_id: number
  season: string
}

const BASE_URL = 'https://plants.pequla.com/api'

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

export const PlantApi = {
  getAll: () => request<Plant[]>('/plants'),
}