// src/pages/Home.jsx
import Swiper from '../components/Swiper';

const Home = ({ setSetlist, setTicketmaster }) => {
    return (

        <div className="w-full flex flex-col items-center justify-between min-h-full p-4">
            <div className="flex flex-1 flex-col h-[120px] max-h-min justify-center text-3xl font-medium tracking-tight items-center pt-6">
                <h1>
                    concert{"{"}
                    <span className="text-3xl tracking-tight font-semibold text-red-600">
                        fyi
                    </span>
                    {"}"}
                </h1>
                <h1 className="text-4xl top-0 font-bold text-center text-zinc-800 tracking-tight pt-4">
                    Live Music Lives Here.
                </h1>
            </div>

            <Swiper
                setSetlist={setSetlist}
                setTicketmaster={setTicketmaster}
            />

            <div className="w-full text-[22px] leading-[2rem] font-bold text-center tracking-tight">
                <h1 className="[&>span]:block">
                    <span>Track your favorite artists,</span>
                    <span>explore past performances,</span>
                    <span>and never miss a concert again.</span>
                </h1>
            </div>

            <div className="my-4 w-[250px] bg-white rounded-xl shadow py-4 flex justify-center items-center">
                <span className="cursor-pointer text-2xl font-bold mx-4 tracking-tight hover:text-gray-500 hover:underline hover:underline-offset-8 hover:opacity-90 transition-all duration-300 ease-in-out">
                    Sign up
                </span>
                <span className="cursor-pointer flex items-center justify-center h-12 w-32 rounded-full bg-red-600 text-white text-2xl border-[3px] border-transparent border-solid hover:border-zinc-800 transition-all duration-300 ease-in-out">
                    Login
                </span>
            </div>
        </div>
    );
};

export default Home;