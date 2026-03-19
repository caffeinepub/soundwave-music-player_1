export interface ArtistSong {
  videoId: string;
  title: string;
  thumbnail: string;
}

export interface ArtistPlaylist {
  id: string;
  name: string;
  image: string; // YouTube thumbnail URL for artist card
  emoji: string;
  topSongs: ArtistSong[];
  popularTracks: ArtistSong[];
}

function thumb(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function song(videoId: string, title: string): ArtistSong {
  return { videoId, title, thumbnail: thumb(videoId) };
}

export const FEATURED_ARTIST_PLAYLISTS: ArtistPlaylist[] = [
  {
    id: "arijit-singh",
    name: "Arijit Singh",
    image: thumb("sFVeKDQGkEU"),
    emoji: "🎙️",
    topSongs: [
      song("sFVeKDQGkEU", "Tum Hi Ho"),
      song("6FURuLYGOOg", "Ae Dil Hai Mushkil"),
      song("284Ov7ysmfA", "Channa Mereya"),
      song("bdxSKFOnLoo", "Kal Ho Naa Ho"),
      song("nfWlot6h_JM", "Raabta"),
    ],
    popularTracks: [
      song("IOkEjoOdGOM", "Phir Bhi Tumko Chaahunga"),
      song("E6WCkFhWAZI", "Kabira"),
      song("dl1bqFqKcmU", "Gerua"),
      song("Xe3MfDGCPdU", "Tujhe Kitna Chahne Lage"),
      song("LkKhRCLFaAE", "Humari Adhuri Kahani"),
    ],
  },
  {
    id: "shreya-ghoshal",
    name: "Shreya Ghoshal",
    image: thumb("N9o7oHvBb0c"),
    emoji: "🌸",
    topSongs: [
      song("N9o7oHvBb0c", "Teri Meri"),
      song("fNvbA3V6JLo", "Tujh Mein Rab Dikhta Hai"),
      song("1A89hqcv3R0", "Lag Ja Gale"),
      song("Cj8dKL6JQLE", "Dheere Jalna"),
      song("V2jJAsTJxGo", "Sun Raha Hai"),
    ],
    popularTracks: [
      song("0W1cUDmMC0c", "Jab Tak"),
      song("YnNeDI1WZGM", "Barso Re"),
      song("e0fAEpBZLM4", "Tumhi Ho Bandhu"),
      song("-WRPNCASbA4", "Ghoomar"),
      song("Lhk3-oOHmYo", "Manwa Laage"),
    ],
  },
  {
    id: "taylor-swift",
    name: "Taylor Swift",
    image: thumb("b1kbLwvqugk"),
    emoji: "✨",
    topSongs: [
      song("b1kbLwvqugk", "Anti-Hero"),
      song("nfWlot6h_JM", "Shake It Off"),
      song("8xg3vE8Ie_E", "Love Story"),
      song("e-ORhEE9VVg", "Blank Space"),
      song("QcIy9NiNbmo", "Bad Blood"),
    ],
    popularTracks: [
      song("ic8j13piAhQ", "Cruel Summer"),
      song("K-a8s8OLBSE", "cardigan"),
      song("wIht9wBzEsU", "Style"),
      song("VuNIsY6JdUw", "You Belong With Me"),
      song("IdneKLhsWOQ", "Wildest Dreams"),
    ],
  },
  {
    id: "the-weeknd",
    name: "The Weeknd",
    image: thumb("4NRXx6U8ABQ"),
    emoji: "🌙",
    topSongs: [
      song("4NRXx6U8ABQ", "Blinding Lights"),
      song("34Nwg7RTdVA", "Starboy"),
      song("LIIDh-qI8oQ", "Save Your Tears"),
      song("yzTuBuRdAyA", "The Hills"),
      song("KEI4qSrkPAs", "Can't Feel My Face"),
    ],
    popularTracks: [
      song("waU75jf5aOQ", "Earned It"),
      song("Qd5JLrEdXoI", "Often"),
      song("vym9dEMwWRU", "Call Out My Name"),
      song("qFLhGq0060w", "I Feel It Coming"),
      song("aco_mCl5Gx8", "After Hours"),
    ],
  },
];
