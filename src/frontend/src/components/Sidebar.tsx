import { Clock, Heart, Home, Search } from "lucide-react";
import { colorGradients, sidebarPlaylists } from "../data/songs";

type ViewId = "home" | "search" | "liked" | "recent";

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
}

const navItems: {
  id: ViewId;
  label: string;
  Icon: React.FC<{ size: number; strokeWidth: number }>;
}[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "search", label: "Search", Icon: Search },
  { id: "liked", label: "Liked Songs", Icon: Heart },
  { id: "recent", label: "Recently Played", Icon: Clock },
];

export default function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  const GreenColor = "oklch(0.65 0.19 145)";

  return (
    <aside
      className="sidebar-scroll flex flex-col"
      style={{ background: "#000", borderRight: "1px solid #1a1a1a" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: GreenColor }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="#000"
            aria-hidden="true"
          >
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
        <span className="text-white font-black text-[17px] tracking-tight">
          Soundwave
        </span>
      </div>

      {/* Primary nav */}
      <nav className="px-2 space-y-0.5">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              type="button"
              data-ocid={`nav.${id}.link`}
              onClick={() => onNavChange(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
              style={{
                color: isActive ? "#fff" : "#b3b3b3",
                background: isActive ? "#1a1a1a" : "transparent",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
              {isActive && id === "liked" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill={GreenColor}
                  className="ml-auto"
                  aria-hidden="true"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div
        className="mx-4 my-4"
        style={{ borderBottom: "1px solid #1a1a1a" }}
      />

      {/* Playlists */}
      <div className="px-2 flex-1">
        <div className="px-3 mb-3">
          <span
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "#555" }}
          >
            Playlists
          </span>
        </div>
        <div className="space-y-0.5">
          {sidebarPlaylists.map((pl, i) => (
            <button
              key={pl.id}
              type="button"
              data-ocid={`sidebar.playlist.item.${i + 1}`}
              onClick={() => onNavChange(`playlist-${pl.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] transition-all cursor-pointer"
              style={{
                color: activeNav === `playlist-${pl.id}` ? "#fff" : "#b3b3b3",
                background:
                  activeNav === `playlist-${pl.id}` ? "#1a1a1a" : "transparent",
              }}
            >
              {/* Color dot with gradient */}
              <div
                className="w-9 h-9 rounded flex-shrink-0 flex items-center justify-center text-base"
                style={{
                  background:
                    colorGradients[pl.colorClass] ?? colorGradients.c1,
                }}
              >
                {pl.emoji}
              </div>
              <div className="min-w-0 text-left">
                <div className="font-semibold truncate">{pl.title}</div>
                <div className="text-[11px]" style={{ color: "#555" }}>
                  {pl.songCount} songs
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4">
        <p className="text-[11px]" style={{ color: "#555" }}>
          12 songs in library
        </p>
      </div>
    </aside>
  );
}
