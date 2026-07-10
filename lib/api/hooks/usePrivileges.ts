import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getPrivileges } from "../master/logbook/privileges/getPrivileges";
import {
  PrivilegesResponse,
  Privilege,
  PrivilegeOption,
} from "../master/logbook/privileges/privileges.interface";

export const usePrivileges = () => {
  const query = useQuery<PrivilegesResponse, Error>({
    queryKey: ["privileges"],
    queryFn: getPrivileges,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const options = useMemo((): PrivilegeOption[] => {
    if (!query.data?.responseData) return [];
    return query.data.responseData.map(
      (p: Privilege): PrivilegeOption => ({
        value: p.id,
        label: p.name,
        code: p.code,
      })
    );
  }, [query.data]);

  const privilegeMap = useMemo(() => {
    if (!query.data?.responseData) return new Map<number, Privilege>();
    const map = new Map<number, Privilege>();
    query.data.responseData.forEach((p: Privilege) => {
      map.set(p.id, p);
    });
    return map;
  }, [query.data]);

  const getPrivilegeById = (id: number) => privilegeMap.get(id);

  return {
    ...query,
    options,
    privileges: query.data?.responseData || [],
    privilegeMap,
    getPrivilegeById,
  };
};
