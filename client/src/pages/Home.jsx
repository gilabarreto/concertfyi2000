import Swiper from "../components/Swiper";
import { SEOHead } from "../components/SEOHead";

const Home = () => {
  return (
    <>
      <SEOHead
        title="Discover Live Music & Concerts"
        description="Track your favorite artists, explore past performances, and never miss a concert again. Find setlists, venues, and ticket information."
        url="/"
      />
      <div className="flex flex-col w-full flex-1 items-center justify-evenly gap-6 p-4">
        <div className="text-[32px] font-bold text-center tracking-tight">
          <span>Live Music Lives Here</span>
        </div>
        <div className="w-full shrink-0">
          <Swiper />
        </div>
        {/* <div className="w-full text-[22px] leading-[1.5rem] font-bold text-center tracking-tight">
          <div className="mx-auto mt-4 w-[250px] bg-white rounded-xl shadow py-2 flex justify-center items-center">
            <span className="cursor-pointer text-xl font-bold mx-4 tracking-tight hover:text-gray-500 hover:underline hover:underline-offset-8 hover:opacity-90 transition">
              Sign up
            </span>
            <span className="cursor-pointer flex items-center justify-center h-10 w-32 rounded-full bg-red-600 text-white text-xl border-[3px] border-transparent border-solid hover:border-zinc-800 transition">
              Login
            </span>
          </div>
        </div> */}
      </div>
    </>
  );
};

export default Home;
