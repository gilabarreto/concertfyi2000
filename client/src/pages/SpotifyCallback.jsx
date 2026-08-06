import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAccessTokenFromCode, saveAccessToken } from "../helpers/spotifyAuth";

export default function SpotifyCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      console.log("SpotifyCallback:", { code, errorParam });

      if (errorParam) {
        console.error("Spotify error:", errorParam);
        setStatus("error");
        return;
      }

      if (!code) {
        console.error("No code received");
        setStatus("error");
        return;
      }

      try {
        console.log("Exchanging code for token...");
        const accessToken = await getAccessTokenFromCode(code);
        console.log("Token received:", !!accessToken);
        saveAccessToken(accessToken);

        // Get songs from localStorage (shared between popup and parent window)
        const playlistData = JSON.parse(localStorage.getItem("spotifyPlaylistData") || "{}");

        // Notify parent window that auth succeeded
        if (window.opener) {
          window.opener.postMessage({
            type: "SPOTIFY_AUTH_SUCCESS",
            accessToken,
            playlistData
          }, "*");
        }

        setStatus("success");
        setTimeout(() => window.close(), 1500);
      } catch (err) {
        console.error("Token exchange error:", err);
        setStatus("error");
      }
    };

    handleCallback();
  }, [searchParams]);

  // Hide all site elements and show only popup content
  useEffect(() => {
    // Hide navbar, footer, and main content area
    const navbar = document.querySelector("nav");
    const footer = document.querySelector("footer");
    const header = document.querySelector("header");
    const main = document.querySelector("main");

    if (navbar) navbar.style.display = "none";
    if (footer) footer.style.display = "none";
    if (header) header.style.display = "none";
    if (main) main.style.visibility = "hidden";

    // Clear body margin/padding for clean popup
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "#191414";
    document.body.style.overflow = "hidden";
    document.documentElement.style.background = "#191414";

    return () => {
      if (navbar) navbar.style.display = "";
      if (footer) footer.style.display = "";
      if (header) header.style.display = "";
      if (main) main.style.visibility = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Minimal UI for popup - centered
  return (
    <>
      {status === "loading" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-gray-800">Connecting to Spotify...</p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>✓ Connected!</p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Authentication failed</p>
          </div>
        </div>
      )}

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #191414 !important; }
        html { background: #191414 !important; }
      `}</style>
    </>
  );
}
