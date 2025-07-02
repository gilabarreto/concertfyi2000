import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

export default function Contact(props) {

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
                        <FontAwesomeIcon icon={faEnvelope} />
                    </h1>
                </div>
                <div className="w-[350px] text-lg sm:w-[450px] sm:text-xl bg-red-600 rounded-3xl [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] p-8 flex justify-center items-center text-justify text-zinc-100 font-medium tracking-tight">
                    <h1 className="[&>span]:block">
                        <span>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugit ullam necessitatibus sint dolor, officia, ipsam reiciendis facere, nihil odit sequi possimus voluptates laboriosam quaerat. Esse quasi debitis quam dolorem porro?</span>
                    </h1>
                </div>
            </div>
        </>
    );
}