import { Clock, Heart, Home, LogOut, Search, Star } from "lucide-react";
import { colorGradients, sidebarPlaylists } from "../data/songs";
import type { AuthUser } from "../hooks/useAuth";

type ViewId = "home" | "search" | "liked" | "recent";

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  user?: AuthUser | null;
  isPremium?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onUpgrade?: () => void;
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

export default function Sidebar({
  activeNav,
  onNavChange,
  user,
  isPremium,
  onSignIn,
  onSignOut,
  onUpgrade,
}: SidebarProps) {
  return (
    <aside
      className="sidebar-scroll flex flex-col"
      style={{
        background: "#121212",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#1DB954" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="#000"
            aria-hidden="true"
          >
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
        <span
          className="font-black text-[18px] tracking-tight text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          Soundwave
        </span>
      </div>

      {/* Primary nav */}
      <nav className="px-3 space-y-1">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              type="button"
              data-ocid={`nav.${id}.link`}
              onClick={() => onNavChange(id)}
              className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium cursor-pointer"
              style={{
                color: isActive ? "#fff" : "#b3b3b3",
                background: isActive ? "#282828" : "transparent",
                border: "none",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
              {isActive && (
                <span
                  className="ml-auto w-1 h-4 rounded-full flex-shrink-0"
                  style={{ background: "#1DB954" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div
        className="mx-6 my-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      />

      {/* Playlists */}
      <div className="px-3 flex-1">
        <div className="px-3 mb-3 flex items-center justify-between">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ color: "#6a6a6a" }}
          >
            Your Library
          </span>
        </div>
        <div className="space-y-0.5">
          {sidebarPlaylists.map((pl, i) => {
            const isActive = activeNav === `playlist-${pl.id}`;
            return (
              <button
                key={pl.id}
                type="button"
                data-ocid={`sidebar.playlist.item.${i + 1}`}
                onClick={() => onNavChange(`playlist-${pl.id}`)}
                className="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] cursor-pointer"
                style={{
                  color: isActive ? "#fff" : "#b3b3b3",
                  background: isActive ? "#282828" : "transparent",
                  border: "none",
                }}
              >
                {/* Playlist art */}
                <div
                  className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center text-base"
                  style={{
                    background:
                      colorGradients[pl.colorClass] ?? colorGradients.c1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {pl.emoji}
                </div>
                <div className="min-w-0 text-left">
                  <div className="font-semibold truncate text-[13px]">
                    {pl.title}
                  </div>
                  <div className="text-[11px]" style={{ color: "#6a6a6a" }}>
                    Playlist · {pl.songCount} songs
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* User section */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        {user ? (
          <>
            {/* User info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: user.photoURL
                    ? undefined
                    : "linear-gradient(135deg, #1DB954, oklch(0.6 0.3 280))",
                  backgroundImage: user.photoURL
                    ? `url(${user.photoURL})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#000",
                  flexShrink: 0,
                }}
              >
                {!user.photoURL && user.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isPremium ? "#1DB954" : "#6a6a6a",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {isPremium ? (
                    <>
                      <Star size={9} fill="#1DB954" stroke="none" /> Premium ✓
                    </>
                  ) : (
                    "Free Plan"
                  )}
                </div>
              </div>
              <button
                data-ocid="sidebar.signout.button"
                type="button"
                onClick={onSignOut}
                title="Sign out"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6a6a6a",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                <LogOut size={15} />
              </button>
            </div>

            {/* Upgrade button if not premium */}
            {!isPremium && (
              <button
                data-ocid="sidebar.upgrade.button"
                type="button"
                onClick={onUpgrade}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #F59E0B, #1DB954)",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px",
                  color: "#000",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                ✨ Upgrade to Premium
              </button>
            )}
          </>
        ) : (
          <button
            data-ocid="sidebar.signin.button"
            type="button"
            onClick={onSignIn}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #1DB954, #00B8FF)",
              border: "none",
              borderRadius: 10,
              padding: "10px",
              color: "#000",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </aside>
  );
}
