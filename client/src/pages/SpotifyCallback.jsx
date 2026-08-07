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
        display: "flex !important",
        alignItems: "center !important",
        justifyContent: "center !important",
        position: "fixed !important",
        top: "0 !important",
        left: "0 !important",
        width: "100% !important",
        height: "100% !important",
        background: "#191414 !important",
        color: "#ffffff !important",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important",
        flexDirection: "column !important",
        gap: "24px !important",
        margin: "0 !important",
        padding: "0 !important",
        zIndex: "99999 !important",
        inset: "0 !important",
      }}
    >
      {status === "loading" && (
        <>
          <div
            style={{
              width: "50px !important",
              height: "50px !important",
              border: "4px solid #1DB954 !important",
              borderTopColor: "transparent !important",
              borderRadius: "50% !important",
              animation: "spin 1s linear infinite !important",
            }}
          />
          <p style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: "500 !important", color: "#ffffff !important" }}>
            Connecting to Spotify...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div
            style={{
              fontSize: "64px !important",
              margin: "0 !important",
              animation: "fadeIn 0.5s ease-in !important",
              color: "#1DB954 !important",
            }}
          >
            ✓
          </div>
          <p style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: "500 !important", color: "#ffffff !important" }}>
            Connected!
          </p>
          <p style={{ margin: "0 !important", fontSize: "14px !important", color: "#ffffff !important" }}>
            Creating your playlist...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <p style={{ fontSize: "64px !important", color: "#ff4444 !important", margin: "0 !important" }}>✗</p>
          <p style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: "500 !important", color: "#ffffff !important" }}>
            Authentication failed
          </p>
          <p style={{ margin: "0 !important", fontSize: "14px !important", color: "#ffffff !important" }}>
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
