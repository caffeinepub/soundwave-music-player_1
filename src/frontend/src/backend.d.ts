import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    getDisplayName(): Promise<string>;
    getLikedSongs(): Promise<Array<string>>;
    isSongLiked(songId: string): Promise<boolean>;
    setDisplayName(name: string): Promise<void>;
    toggleSongLike(songId: string): Promise<void>;
    unlikeSong(songId: string): Promise<void>;
}
