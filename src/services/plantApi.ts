import axios from 'axios'

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

const api = axios.create({
  baseURL: 'https://plants.pequla.com/api',
  timeout: 10000,
})

export const PlantApi = {
  async getAll(): Promise<Plant[]> {
    const res = await api.get<Plant[]>('/plants')
    return res.data
  },
}