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
    // Hide navbar, footer, and other layout elements
    const navbar = document.querySelector("nav");
    const footer = document.querySelector("footer");
    if (navbar) navbar.style.display = "none";
    if (footer) footer.style.display = "none";

    // Clear body margin/padding for clean popup
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "#191414";
    document.documentElement.style.background = "#191414";

    return () => {
      if (navbar) navbar.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  // Minimal UI for popup - centered
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      background: "#191414",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
      flexDirection: "column",
      gap: "20px",
      margin: 0,
      padding: 0,
      overflow: "hidden"
    }}>
      {status === "loading" && (
        <>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid #1DB954",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <p style={{ margin: 0, fontSize: "16px" }}>Connecting to Spotify...</p>
        </>
      )}

      {status === "success" && (
        <>
          <p style={{ fontSize: "48px", margin: 0 }}>✓</p>
          <p style={{ margin: 0, fontSize: "16px" }}>Connected!</p>
        </>
      )}

      {status === "error" && (
        <>
          <p style={{ fontSize: "48px", color: "#ff4444", margin: 0 }}>✗</p>
          <p style={{ margin: 0, fontSize: "16px" }}>Authentication failed</p>
        </>
      )}

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #191414 !important; }
        html { background: #191414 !important; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
