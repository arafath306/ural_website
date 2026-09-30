"use client";
import { useEffect, useState, useCallback } from "react";
import { restaurantService } from "../supabase/services/restaurantService";
import { IRestaurant } from "../utils/interfaces/restaurants.interface";

export default function useRestaurant(id: string, slug?: string) {
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<any>(null);

  const fetchRest = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await restaurantService.getRestaurantById(id);
      setRestaurant(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRest();
  }, [fetchRest]);

  return {
    data: restaurant ? { restaurant } : null,
    refetch: fetchRest,
    networkStatus: 7,
    loading,
    error,
  };
}
