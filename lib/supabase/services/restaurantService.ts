import { supabase } from '../client';
import { IRestaurant, ICategory, IFood } from '@/lib/utils/interfaces';

export interface GetRestaurantsParams {
  latitude?: number;
  longitude?: number;
  shopType?: string | null;
  page?: number;
  limit?: number;
  search?: string;
}

export const restaurantService = {
  async getRestaurants({
    latitude,
    longitude,
    shopType,
    page = 1,
    limit = 20,
    search,
  }: GetRestaurantsParams = {}): Promise<IRestaurant[]> {
    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_available', true);

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error } = await query
        .range(from, to)
        .order('name', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      return data.map((r: any) => ({
        _id: r.id,
        id: r.id,
        name: r.name || 'Restaurant',
        image: r.image || '/assets/images/restaurant-placeholder.png',
        logo: r.logo || r.image || '/assets/images/restaurant-placeholder.png',
        address: r.address || 'Dhaka, Bangladesh',
        deliveryTime: r.delivery_time || 30,
        minimumOrder: r.minimum_order || 100,
        salesTax: r.sales_tax || 0,
        isAvailable: r.is_available ?? true,
        rating: r.rating || 5.0,
        totalRatings: r.total_ratings || 0,
        shopType: r.shop_type || 'restaurant',
        location: r.location || {
          coordinates: [r.longitude || 90.4125, r.latitude || 23.8103],
        },
        categories: (r.categories || []).map((cat: any) => ({
          _id: cat.id || cat._id,
          title: cat.title || cat.name,
          foods: cat.foods || [],
        })),
        sections: r.sections || [],
        openingTimes: r.opening_times || [],
      })) as IRestaurant[];
    } catch (err) {
      console.error('Error fetching restaurants from Supabase:', err);
      return [];
    }
  },

  async getRestaurantById(id: string): Promise<IRestaurant | null> {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      // Also fetch foods and categories if stored separately
      const { data: foodsData } = await supabase
        .from('foods')
        .select('*')
        .eq('restaurant_id', id);

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', id);

      const foods: IFood[] = (foodsData || []).map((f: any) => ({
        _id: f.id,
        id: f.id,
        title: f.title || f.name,
        description: f.description || '',
        image: f.image || '',
        price: f.price || 0,
        category: f.category_id,
        variations: f.variations || [],
        addons: f.addons || [],
      })) as IFood[];

      const categories: ICategory[] = (categoriesData || []).map((c: any) => ({
        _id: c.id,
        id: c.id,
        title: c.title || c.name,
        foods: foods.filter((f: any) => f.category === c.id),
      })) as ICategory[];

      return {
        _id: data.id,
        id: data.id,
        name: data.name,
        image: data.image || '/assets/images/restaurant-placeholder.png',
        logo: data.logo || data.image || '/assets/images/restaurant-placeholder.png',
        address: data.address || '',
        deliveryTime: data.delivery_time || 30,
        minimumOrder: data.minimum_order || 100,
        salesTax: data.sales_tax || 0,
        isAvailable: data.is_available ?? true,
        rating: data.rating || 5.0,
        totalRatings: data.total_ratings || 0,
        shopType: data.shop_type || 'restaurant',
        location: data.location || { coordinates: [90.4125, 23.8103] },
        categories: categories.length > 0 ? categories : (data.categories || []),
        sections: data.sections || [],
        openingTimes: data.opening_times || [],
      } as IRestaurant;
    } catch (err) {
      console.error('Error fetching restaurant details from Supabase:', err);
      return null;
    }
  },

  async getCuisines() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('title', { ascending: true });

      if (error || !data) return [];
      return data;
    } catch (err) {
      console.error('Error fetching cuisines:', err);
      return [];
    }
  },
};
