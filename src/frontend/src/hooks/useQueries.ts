import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetLikedSongs() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["liked-songs"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await (actor as any).getLikedSongs();
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useToggleSongLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (songId: string) => {
      if (!actor) return;
      try {
        await (actor as any).toggleSongLike(songId);
      } catch {
        // Backend may not have this method — silently ignore
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liked-songs"] });
    },
  });
}
