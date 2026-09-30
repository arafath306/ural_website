import { supabase } from '../client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PlaceOrderInput {
  orderId?: string;
  userId?: string | null;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  customerName?: string;
  customerPhone?: string;
  customerLat?: number;
  customerLng?: number;
  items: any[];
  orderAmount: number;
  deliveryCharges: number;
  totalAmount: number;
  paymentMethod: string;
  deliveryAddress: string;
  specialInstructions?: string;
  tip?: number;
}

export const orderService = {
  async placeOrder(input: PlaceOrderInput) {
    const orderNumber =
      input.orderId || `WEB-${Date.now().toString().slice(-6)}`;

    const payload = {
      order_id: orderNumber,
      user_id: input.userId || null,
      restaurant_id: input.restaurantId,
      restaurant_name: input.restaurantName,
      restaurant_address: input.restaurantAddress || 'Dhaka, Bangladesh',
      restaurant_phone: input.restaurantPhone || '',
      customer_name: input.customerName || 'Web Customer',
      customer_phone: input.customerPhone || '',
      customer_lat: input.customerLat || 23.8103,
      customer_lng: input.customerLng || 90.4125,
      items: input.items,
      order_amount: input.orderAmount,
      delivery_charges: input.deliveryCharges,
      total_amount: input.totalAmount,
      payment_method: input.paymentMethod || 'COD',
      payment_status: 'PENDING',
      order_status: 'PENDING',
      delivery_address: input.deliveryAddress,
      special_instructions: input.specialInstructions || '',
      tip: input.tip || 0.0,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase placeOrder error:', error);
      throw error;
    }

    return data;
  },

  async getOrderById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${orderId},order_id.eq.${orderId}`)
      .single();

    if (error) {
      console.error('Supabase getOrderById error:', error);
      return null;
    }
    return data;
  },

  async getCustomerOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getCustomerOrders error:', error);
      return [];
    }
    return data || [];
  },

  subscribeToOrder(orderId: string, onUpdate: (updatedOrder: any) => void): RealtimeChannel {
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  },

  subscribeToRiderLocation(riderId: string, onLocation: (loc: any) => void): RealtimeChannel {
    const channel = supabase
      .channel(`rider-loc-${riderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rider_locations',
          filter: `rider_id=eq.${riderId}`,
        },
        (payload) => {
          if (payload.new) {
            onLocation(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  }
};
