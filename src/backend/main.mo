import Set "mo:core/Set";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";

actor {
  var displayName : Text = "";
  let likedSongs = Set.empty<Text>();

  public shared ({ caller }) func setDisplayName(name : Text) : async () {
    displayName := name;
  };

  public query ({ caller }) func getDisplayName() : async Text {
    displayName;
  };

  public shared ({ caller }) func toggleSongLike(songId : Text) : async () {
    if (likedSongs.contains(songId)) {
      likedSongs.remove(songId);
    } else {
      likedSongs.add(songId);
    };
  };

  public query ({ caller }) func getLikedSongs() : async [Text] {
    likedSongs.values().toArray();
  };

  public query ({ caller }) func isSongLiked(songId : Text) : async Bool {
    likedSongs.contains(songId);
  };

  public shared ({ caller }) func unlikeSong(songId : Text) : async () {
    if (not likedSongs.contains(songId)) { Runtime.trap("Song is not liked") };
    likedSongs.remove(songId);
  };
};
