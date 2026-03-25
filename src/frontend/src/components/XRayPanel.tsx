import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface XRayPanelProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  artist: string;
  thumbnail: string;
}

const GENRES = [
  "Indie",
  "Electronic",
  "Pop",
  "R&B",
  "Hip-Hop",
  "Rock",
  "Jazz",
  "Soul",
  "Ambient",
  "Folk",
];
const MOODS = [
  "Chill",
  "Energetic",
  "Melancholic",
  "Uplifting",
  "Dark",
  "Romantic",
  "Fierce",
  "Dreamy",
];
const SIMILAR_ARTISTS_MAP: Record<string, string[]> = {
  Indie: ["Arctic Monkeys", "Vampire Weekend", "Tame Impala", "Mac DeMarco"],
  Electronic: ["Daft Punk", "Disclosure", "Caribou", "Four Tet"],
  Pop: ["Olivia Rodrigo", "Harry Styles", "Dua Lipa", "Doja Cat"],
  "R&B": ["Frank Ocean", "SZA", "Daniel Caesar", "H.E.R."],
  "Hip-Hop": [
    "Kendrick Lamar",
    "J. Cole",
    "Tyler, the Creator",
    "Denzel Curry",
  ],
  Rock: ["Foo Fighters", "Queens of the Stone Age", "Radiohead", "Muse"],
  Jazz: ["Miles Davis", "John Coltrane", "Norah Jones", "GoGo Penguin"],
  Soul: ["Leon Bridges", "James Brown", "Marvin Gaye", "D'Angelo"],
  Ambient: ["Brian Eno", "Ólafur Arnalds", "Nils Frahm", "Jon Hopkins"],
  Folk: ["Fleet Foxes", "Iron & Wine", "Bon Iver", "Father John Misty"],
};

// Deterministic content generation from artist name
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function getArtistContent(artist: string, title: string) {
  const h = hashStr(artist || "Unknown");
  const h2 = hashStr(title || "Unknown");
  const genre = pick(GENRES, h);
  const mood = pick(MOODS, h2);
  const mood2 = pick(MOODS, h + 3);
  const similar = SIMILAR_ARTISTS_MAP[genre] ?? SIMILAR_ARTISTS_MAP.Pop;

  const bios = [
    `${artist} is a boundary-pushing artist known for blending ${genre.toLowerCase()} soundscapes with raw emotional depth. Their music resonates with listeners worldwide through cinematic storytelling and intricate production.`,
    `${artist} has carved a unique space in the ${genre.toLowerCase()} scene, delivering tracks that feel both timeless and deeply personal. With millions of streams globally, their artistry continues to evolve.`,
    `Critically acclaimed ${genre.toLowerCase()} artist ${artist} crafts immersive sonic experiences. Known for fearless experimentation, they consistently redefine what modern music can sound like.`,
  ];

  const facts = [
    [
      `${artist} recorded their debut in a home studio with a $200 microphone`,
      "This track has been added to over 50,000 user playlists worldwide",
      "The song was written in under 24 hours during a late-night session",
    ],
    [
      `${artist} cites film scores as a primary influence on their sound`,
      "The production style blends analog warmth with digital precision",
      "This track was mixed across three different countries",
    ],
    [
      `${artist} started their career busking in subway stations`,
      "The music video for this track was shot on a single day",
      `Fans describe ${artist}'s live performances as transformative experiences`,
    ],
  ];

  return {
    bio: pick(bios, h),
    facts: pick(facts, h2),
    genre,
    mood,
    mood2,
    similar,
  };
}

export default function XRayPanel({
  isOpen,
  onClose,
  songTitle,
  artist,
  thumbnail,
}: XRayPanelProps) {
  const content = getArtistContent(artist, songTitle);
  const Accent = "#1ed760";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 450,
            }}
          />

          <motion.aside
            data-ocid="xray.panel"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "clamp(280px, 320px, 90vw)",
              background: "rgba(10, 10, 20, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              zIndex: 460,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "rgba(10,10,20,0.96)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  color: Accent,
                  background: "rgba(30,215,96,0.1)",
                  border: `1px solid ${Accent}`,
                  borderRadius: 4,
                  padding: "2px 8px",
                }}
              >
                X-RAY
              </div>
              <span
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  flex: 1,
                }}
              >
                Artist Info
              </span>
              <button
                type="button"
                data-ocid="xray.close_button"
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  color: "#b3b3b3",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Thumbnail */}
            {thumbnail && (
              <div
                style={{
                  position: "relative",
                  height: 160,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src={thumbnail}
                  alt={songTitle}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, transparent 40%, rgba(10,10,20,0.95) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 16,
                    right: 16,
                  }}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 15,
                      marginBottom: 2,
                    }}
                  >
                    {songTitle || "Unknown Track"}
                  </div>
                  <div style={{ color: "#b3b3b3", fontSize: 12 }}>
                    {artist || "Unknown Artist"}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: "20px 20px 80px" }}>
              {/* Artist Bio */}
              <Section title="Artist Bio" accent={Accent}>
                <p
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {content.bio}
                </p>
              </Section>

              {/* Did You Know */}
              <Section title="Did You Know?" accent={Accent}>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {content.facts.map((fact) => (
                    <li
                      key={fact.slice(0, 20)}
                      style={{
                        display: "flex",
                        gap: 10,
                        color: "rgba(255,255,255,0.72)",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{
                          color: Accent,
                          flexShrink: 0,
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        ✦
                      </span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* About This Track */}
              <Section title="About This Track" accent={Accent}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[content.genre, content.mood, content.mood2].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 20,
                        padding: "4px 12px",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 600,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Section>

              {/* Similar Artists */}
              <Section title="Similar Artists" accent={Accent}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {content.similar.map((name) => (
                    <span
                      key={name}
                      style={{
                        background: "rgba(30,215,96,0.08)",
                        border: "1px solid rgba(30,215,96,0.2)",
                        borderRadius: 20,
                        padding: "5px 14px",
                        fontSize: 12,
                        color: Accent,
                        fontWeight: 600,
                        cursor: "default",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({
  title,
  accent,
  children,
}: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          color: accent,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
