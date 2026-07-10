import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLicenseCategories } from "../master/logbook/license-categories/getLicenseCategories";
import {
  LicenseCategoriesResponse,
  LicenseCategory,
  LicenseCategoryOption,
} from "../master/logbook/license-categories/licenseCategories.interface";

export const useLicenseCategories = () => {
  const query = useQuery<LicenseCategoriesResponse, Error>({
    queryKey: ["licenseCategories"],
    queryFn: getLicenseCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - master data doesn't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoized options for dropdowns/select components
  const options = useMemo((): LicenseCategoryOption[] => {
    if (!query.data?.responseData) return [];
    return query.data.responseData.map(
      (cat: LicenseCategory): LicenseCategoryOption => ({
        value: cat.id,
        label: cat.name,
        code: cat.code,
      })
    );
  }, [query.data]);

  // Memoized map for quick lookups
  const licenseCategoryMap = useMemo(() => {
    if (!query.data?.responseData) return new Map<number, LicenseCategory>();
    const map = new Map<number, LicenseCategory>();
    query.data.responseData.forEach((cat: LicenseCategory) => {
      map.set(cat.id, cat);
    });
    return map;
  }, [query.data]);

  const getLicenseCategoryById = (id: number) => licenseCategoryMap.get(id);

  return {
    ...query,
    options,
    licenseCategories: query.data?.responseData || [],
    licenseCategoryMap,
    getLicenseCategoryById,
  };
};
