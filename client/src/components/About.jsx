import Header from "./Header";

export default function About() {
    return (
        <div className="w-full bg-red-600 flex flex-col items-center justify-between p-4">
            <Header />

            <div>
                <span className="text-[180px] sm:text-[234px] [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)] font-medium tracking-tight items-center text-center overflow-hidden text-balance">
                    {"{"}
                    <span className="text-[180px] sm:text-[240px] [text-shadow:_0_4px_12px_rgba(0,0,0,0.5)] tracking-tight font-semibold text-zinc-100">
                        fyi
                    </span>
                    {"}"}
                </span>
            </div>

            <div className="[&>span]:block w-[350px] text-lg sm:w-[450px] sm:text-xl text-justify text-zinc-100 font-medium tracking-tight bg-red-600 rounded-3xl [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] p-8 flex justify-center items-center">
                <span>
                    <span className="text-2xl text-zinc-800 font-semibold">
                        Concertfyi
                    </span>{" "}
                    is your backstage pass to your favorite artist’s world. From past
                    setlists to upcoming dates, hidden venues to sold-out arenas — find
                    it all here. Explore concert history, discover what’s next, and
                    connect with the music that moves you. The ultimate guide for true
                    fans.
                </span>
            </div>
        </div>
    );
}
