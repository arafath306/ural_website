"use client";
import { useEffect, useState, useMemo } from "react";
import { orderService } from "@/lib/supabase/services/orderService";

function useTracking({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [riderLocation, setRiderLocation] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;

    // 1. Initial fetch
    orderService.getOrderById(orderId).then((data) => {
      if (isMounted && data) {
        setOrder(data);
        setLoading(false);
      }
    });

    // 2. Realtime order updates
    const channel = orderService.subscribeToOrder(orderId, (updated) => {
      if (isMounted) {
        setOrder((prev: any) => ({ ...prev, ...updated }));
      }
    });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [orderId]);

  // 3. If rider assigned, subscribe to live GPS coordinates
  useEffect(() => {
    if (!order?.rider_id) return;
    let isMounted = true;

    const channel = orderService.subscribeToRiderLocation(order.rider_id, (loc) => {
      if (isMounted) {
        setRiderLocation({
          location: {
            coordinates: [loc.longitude, loc.latitude],
          },
          heading: loc.heading,
          speed: loc.speed,
        });
      }
    });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [order?.rider_id]);

  const orderDetails = useMemo(() => {
    if (!order) return null;
    return {
      _id: order.id,
      orderId: order.order_id,
      orderStatus: order.order_status,
      preparationTime: order.preparation_time || 20,
      createdAt: order.created_at,
      acceptedAt: order.accepted_at,
      pickedAt: order.picked_at,
      deliveredAt: order.delivered_at,
      orderAmount: order.order_amount,
      deliveryCharges: order.delivery_charges,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      deliveryAddress: typeof order.delivery_address === 'string'
        ? { deliveryAddress: order.delivery_address }
        : order.delivery_address,
      items: order.items || [],
      rider: order.rider_name ? {
        _id: order.rider_id,
        name: order.rider_name,
        phone: order.rider_phone,
      } : null,
      restaurant: {
        _id: order.restaurant_id,
        name: order.restaurant_name,
        address: order.restaurant_address,
        location: {
          coordinates: [order.restaurant_lng || 90.4125, order.restaurant_lat || 23.8103],
        },
      },
    };
  }, [order]);

  const trackingData = useMemo(() => {
    if (!riderLocation) return null;
    return riderLocation;
  }, [riderLocation]);

  return {
    orderTrackingDetails: orderDetails,
    isOrderTrackingDetailsLoading: loading && !order,
    subscriptionData: orderDetails,
    trackingData,
  };
}

export default useTracking;
