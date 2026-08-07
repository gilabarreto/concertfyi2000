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
    // Hide all site layout elements aggressively
    const navbar = document.querySelector("nav");
    const footer = document.querySelector("footer");
    const header = document.querySelector("header");
    const main = document.querySelector("main");

    // Hide by setting display to none
    if (navbar) navbar.style.display = "none";
    if (footer) footer.style.display = "none";
    if (header) header.style.display = "none";
    if (main) {
      main.style.display = "none";
    }

    // Clean body styling
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "#191414";
    document.body.style.overflow = "hidden";
    document.documentElement.style.background = "#191414";

    // Hide all fixed/absolute positioned elements that might be footers
    const allElements = document.querySelectorAll("*");
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if ((style.position === "fixed" || style.position === "absolute") &&
          el.offsetHeight < 100 &&
          el !== document.querySelector("[data-testid='spotify-callback']")) {
        el.style.display = "none";
      }
    });

    return () => {
      if (navbar) navbar.style.display = "";
      if (footer) footer.style.display = "";
      if (header) header.style.display = "";
      if (main) main.style.display = "";
    };
  }, []);

  // Minimal UI for popup - centered, clean design
  return (
    <div
      data-testid="spotify-callback"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#191414",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
        flexDirection: "column",
        gap: "24px",
        margin: 0,
        padding: 0,
        zIndex: 9999,
      }}
    >
      {status === "loading" && (
        <>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #1DB954",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ margin: 0, fontSize: "18px", fontWeight: "500" }}>
            Connecting to Spotify...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div
            style={{
              fontSize: "64px",
              margin: 0,
              animation: "fadeIn 0.5s ease-in",
            }}
          >
            ✓
          </div>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: "500" }}>
            Connected!
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#b3b3b3" }}>
            Creating your playlist...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <p style={{ fontSize: "64px", color: "#ff4444", margin: 0 }}>✗</p>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: "500" }}>
            Authentication failed
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "#b3b3b3" }}>
            Please try again
          </p>
        </>
      )}

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
}
