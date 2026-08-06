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

        // Notify parent window that auth succeeded
        if (window.opener) {
          window.opener.postMessage({ type: "SPOTIFY_AUTH_SUCCESS", accessToken }, "*");
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

  // Minimal UI for popup
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
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
          <p style={{ margin: 0 }}>Connecting to Spotify...</p>
        </>
      )}

      {status === "success" && (
        <>
          <p style={{ fontSize: "32px", margin: 0 }}>✓</p>
          <p style={{ margin: 0 }}>Connected!</p>
        </>
      )}

      {status === "error" && (
        <>
          <p style={{ fontSize: "24px", color: "#ff4444", margin: 0 }}>✗</p>
          <p style={{ margin: 0 }}>Authentication failed</p>
        </>
      )}

      <style>{`
        * { margin: 0; padding: 0; }
        body { background: #191414; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
