import { useContext } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useArtistData } from "../api/queries";
import ArtistInfo from "../components/ArtistPage/ArtistInfo";
import ConcertTabs from "../components/ArtistPage/ConcertTabs";
import UpcomingConcerts from "../components/ArtistPage/UpcomingConcerts";
import Player from "../components/ArtistPage/Player";
import CardTitle from "../components/ArtistPage/CardTitle";
import CardNotice from "../components/ArtistPage/CardNotice";
import { SEOHead } from "../components/SEOHead";
import { getBestImage } from "../helpers/selectors";
import { useT } from "../i18n";

// This route uses a Ticketmaster identity, without inventing a past concert or MBID.
export default function ArtistOverviewPage() {
  const t = useT();
  const { artistId } = useParams();
  const [params] = useSearchParams();
  const urlName = params.get("name")?.trim() || "";
  const { ticketmaster: cached = {} } = useContext(AppContext);
  const { data, isLoading } = useArtistData(urlName);
  const sources = [cached, data?.ticketmaster || {}];
  const attractions = sources.flatMap((source) => source.attractions || []);
  const events = [
    ...new Map(
      sources.flatMap((source) => source.events || []).map((event) => [event.id, event]),
    ).values(),
  ].filter((event) => event._embedded?.attractions?.some((artist) => artist.id === artistId));
  const attraction =
    attractions.find((artist) => artist.id === artistId) ||
    events
      .flatMap((event) => event._embedded?.attractions || [])
      .find((artist) => artist.id === artistId);
  const ticketmaster = { attractions: attraction ? [attraction] : [], events };
  // Every card below joins on the name; a hand-edited URL without one has nothing to show.
  const artistName = urlName || attraction?.name;
  if (!artistName) return <Navigate to="/" replace />;

  return (
    <div className="artist-page w-full min-w-0">
      <SEOHead
        title={artistName}
        description={`Discover ${artistName}, artist information and upcoming concerts.`}
        image={getBestImage(attraction?.images || [])}
        url={`/artists/ticketmaster/${encodeURIComponent(artistId)}?${new URLSearchParams({ name: artistName })}`}
      />
      <div className="w-full mx-auto sm:px-6 sm:py-4 space-y-4 lg:space-y-3">
        <div id="artist" className="stage px-3 lg:px-6 pb-4 lg:pt-4 sm:-mx-6 sm:-mt-4">
          <ArtistInfo artistName={artistName} musicbrainzId={null} attraction={attraction} />
        </div>
        <ConcertTabs
          artistName={artistName}
          musicbrainzId={null}
          setlist={[]}
          ticketmaster={ticketmaster}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-3">
          <div id="setlist" className="bg-white px-4 flex flex-col">
            <CardTitle>{t("Setlists")}</CardTitle>
            <CardNotice>{t("No Setlist available. Check back later.")}</CardNotice>
          </div>
          <div id="top-tracks" className="px-4 spotify-player-card">
            <Player attraction={attraction} />
          </div>
          <div id="past-concerts" className="bg-white px-4">
            <CardTitle>{t("Past Concerts")}</CardTitle>
            <CardNotice>{t("No past concerts available.")}</CardNotice>
          </div>
          <div id="upcoming-concerts" className="bg-white px-4 pb-4">
            {isLoading && !events.length ? (
              <CardNotice>{t("Loading…")}</CardNotice>
            ) : (
              <UpcomingConcerts artistName={artistName} ticketmaster={ticketmaster} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
