import Set "mo:core/Set";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Outcall "./http-outcalls/outcall";

actor {
  var displayName : Text = "";
  let likedSongs = Set.empty<Text>();
  var youtubeApiKey : Text = "AIzaSyCIKGUfeNLQMyprX7_7w_21Vq5YzcDZ9ls";

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input);
  };

  public shared func setApiKey(key : Text) : async () {
    youtubeApiKey := key;
  };

  public shared func searchYouTube(q : Text) : async Text {
    let encodedQ = q.replace(#text " ", "+");
    let url = "https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=" # encodedQ # "&type=video&videoCategoryId=10&maxResults=10&key=" # youtubeApiKey;
    await Outcall.httpGetRequest(url, [], transform);
  };

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
