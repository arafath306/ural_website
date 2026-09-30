"use client";
import { useEffect, useState } from "react";
import { restaurantService } from "../supabase/services/restaurantService";
import { IRestaurant } from "../utils/interfaces/restaurants.interface";
import { useUserAddress } from "../context/address/address.context";

const useMostOrderedRestaurants = (
  enabled = true,
  page = 1,
  limit = 10,
  shopType?: "restaurant" | "grocery" | null
) => {
  const { userAddress } = useUserAddress();
  const userLongitude = Number(userAddress?.location?.coordinates[0]) || 0;
  const userLatitude = Number(userAddress?.location?.coordinates[1]) || 0;

  const [queryData, setQueryData] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;
    setLoading(true);

    restaurantService.getRestaurants({
      latitude: userLatitude,
      longitude: userLongitude,
      shopType,
      page,
      limit,
    }).then((restaurants) => {
      if (isMounted) {
        setQueryData(restaurants);
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
  }, [enabled, page, limit, shopType, userLatitude, userLongitude]);

  const restaurantsData: IRestaurant[] =
    queryData?.filter((item) => item?.shopType?.toLowerCase() === "restaurant") ?? queryData;

  const groceriesData: IRestaurant[] =
    queryData?.filter((item) => item?.shopType?.toLowerCase() === "grocery") ?? [];

  return {
    queryData,
    loading,
    error,
    networkStatus: 7,
    restaurantsData,
    groceriesData,
    fetchMore: async () => {},
  };
};

export default useMostOrderedRestaurants;
