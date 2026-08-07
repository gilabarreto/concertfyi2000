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

  // Style popup background
  useEffect(() => {
    document.body.style.background = "#191414";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Popup as white box only
  const popupContent = (
    <div
      data-testid="spotify-callback"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100vh",
        background: "white",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          textAlign: "center",
          width: "100%",
          padding: "40px 30px",
        }}
      >
        {status === "loading" && (
          <>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #1DB954",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <p style={{ margin: "0", fontSize: "16px", color: "#333" }}>
              Connecting to Spotify...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              style={{
                fontSize: "48px",
                margin: "0 0 16px 0",
                animation: "fadeIn 0.5s ease-in",
                color: "#1DB954",
              }}
            >
              ✓
            </div>
            <p style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#333" }}>
              Connected!
            </p>
            <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
              Creating your playlist...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p style={{ fontSize: "48px", color: "#ff4444", margin: "0 0 16px 0" }}>✗</p>
            <p style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#333" }}>
              Authentication failed
            </p>
            <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
              Please try again
            </p>
          </>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #191414 !important;
          overflow: hidden !important;
        }
        html {
          background: #191414 !important;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );

  return popupContent;
}
