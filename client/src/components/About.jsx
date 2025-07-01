export default function About(props) {

    return (
        <>
            <div className="w-full bg-red-600 flex flex-1 flex-col items-center justify-cente h-screen overflow-hidden p-4">
                <h1 className="text-3xl font-medium tracking-tight items-center my-4">
                    concert{"{"}
                    <span className="text-3xl tracking-tight font-medium text-zinc-100">
                        fyi
                    </span>
                    {"}"}
                </h1>
                <div className="w-full flex items-center justify-center overflow-hidden">

                    <h1 className=" text-4xl top-0 font-bold text-center text-zinc-100 tracking-tight">
                        Live Music Lives Here.
                    </h1>
                </div>
                <div>
                    <h1 className="text-[180px] sm:text-[240px] [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)] font-medium tracking-tight items-center">
                        {"{"}
                        <span className="text-[180px] sm:text-[240px] [text-shadow:_0_4px_12px_rgba(0,0,0,0.5)] tracking-tight font-medium text-zinc-100">
                            fyi
                        </span>
                        {"}"}
                    </h1>
                </div>
                <div className="w-[350px] text-lg sm:w-[450px] sm:text-xl bg-red-600 rounded-3xl [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] p-8 flex justify-center items-center text-justify text-zinc-100 font-medium tracking-tight">
                    <h1 className="[&>span]:block">
                        <span>Concertify is your backstage pass to your favorite artist’s world.
                            From past setlists to upcoming dates, hidden venues to sold-out arenas — find it all here.
                            Explore concert history, discover what’s next, and connect with the music that moves you.
                            The ultimate guide for true fans.</span>
                    </h1>
                </div>
            </div>
        </>
    );
}