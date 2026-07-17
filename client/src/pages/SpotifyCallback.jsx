import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAccessTokenFromCode, saveAccessToken } from "../helpers/spotifyAuth";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError("Authorization denied");
        setLoading(false);
        setTimeout(() => window.close(), 2000);
        return;
      }

      if (!code) {
        setError("No authorization code received");
        setLoading(false);
        setTimeout(() => window.close(), 2000);
        return;
      }

      try {
        const accessToken = await getAccessTokenFromCode(code);
        saveAccessToken(accessToken);
        setLoading(false);
        setTimeout(() => window.close(), 1000);
      } catch (err) {
        console.error("Token exchange failed:", err);
        setError("Failed to authenticate");
        setLoading(false);
        setTimeout(() => window.close(), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        {loading && (
          <div className="space-y-4">
            <div className="animate-spin">
              <div className="h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
            <p className="text-white text-lg">Connecting to Spotify...</p>
          </div>
        )}

        {error && (
          <div className="space-y-4">
            <p className="text-red-600 text-lg">{error}</p>
            <p className="text-gray-400 text-sm">This window will close automatically</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <p className="text-green-600 text-lg">✓ Connected!</p>
            <p className="text-gray-400 text-sm">This window will close automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}
