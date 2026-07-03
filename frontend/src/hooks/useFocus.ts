import { useQuery } from "@tanstack/react-query";
import { focusApi } from "@/api/focus";

export function useFocusSummary() {
  return useQuery({
    queryKey: ["focus", "summary"],
    queryFn: () => focusApi.summary(),
  });
}
