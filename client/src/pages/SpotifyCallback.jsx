import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAccessTokenFromCode, saveAccessToken } from "../helpers/spotifyAuth";

// Runs inside the auth popup: exchange the code, hand the token to the opener, close.
export default function SpotifyCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code || searchParams.get("error")) {
      setStatus("error");
      return;
    }

    getAccessTokenFromCode(code)
      .then((accessToken) => {
        saveAccessToken(accessToken);

        // the songs cross the window boundary through localStorage, not postMessage
        const playlistData = JSON.parse(localStorage.getItem("spotifyPlaylistData") || "{}");
        window.opener?.postMessage(
          { type: "SPOTIFY_AUTH_SUCCESS", accessToken, playlistData },
          window.location.origin,
        );

        setStatus("success");
        setTimeout(() => window.close(), 1500);
      })
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <div
      data-testid="spotify-callback"
      className="flex h-dvh w-full items-center justify-center bg-white p-10 text-center"
    >
      {status === "loading" && (
        <div className="space-y-5">
          <div className="mx-auto size-10 animate-spin motion-reduce:animate-none rounded-full border-4 border-green-600 border-t-transparent" />
          <p className="text-zinc-800">Connecting to Spotify...</p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-2">
          <p className="text-5xl text-green-600">✓</p>
          <p className="font-semibold text-zinc-800">Connected!</p>
          <p className="text-sm text-zinc-500">Creating your playlist...</p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-2">
          <p className="text-5xl text-red-500">✗</p>
          <p className="font-semibold text-zinc-800">Authentication failed</p>
          <p className="text-sm text-zinc-500">Please try again</p>
        </div>
      )}
    </div>
  );
}
