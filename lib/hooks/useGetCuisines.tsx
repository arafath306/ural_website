"use client";
import { useEffect, useState } from "react";
import { restaurantService } from "../supabase/services/restaurantService";
import { ICuisinesData } from "@/lib/utils/interfaces";

const useGetCuisines = (enabled = true, shoptype?: string) => {
  const [cuisines, setCuisines] = useState<ICuisinesData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;
    setLoading(true);

    restaurantService.getCuisines().then((data) => {
      if (isMounted) {
        const formatted: ICuisinesData[] = (data || []).map((c: any) => ({
          _id: c.id,
          name: c.title || c.name || 'Cuisine',
          description: c.description || '',
          image: c.image || '',
          shopType: c.shop_type || 'restaurant',
        }));
        setCuisines(formatted);
        setLoading(false);
      }
    }).catch((err) => {
      if (isMounted) {
        setError(err);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [enabled, shoptype]);

  const restaurantCuisinesData = cuisines.filter(
    (item) => item.shopType?.toLowerCase() === "restaurant"
  );
  const groceryCuisinesData = cuisines.filter(
    (item) => item.shopType?.toLowerCase() === "grocery"
  );

  return {
    queryData: cuisines,
    loading,
    error,
    networkStatus: 7,
    restaurantCuisinesData,
    groceryCuisinesData,
  };
};

export default useGetCuisines;
