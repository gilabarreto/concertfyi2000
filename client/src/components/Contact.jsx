import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Header from "./Header";

export default function Contact(props) {

    return (
        <>
            <div className="w-full bg-red-600 flex flex-col items-center justify-between p-4">
                <Header />
                <div>
                    <span>
                        <FontAwesomeIcon icon={faEnvelope} className="text-[200px] sm:text-[250px] [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)] font-medium"/>
                    </span>
                </div>
                <div className="[&>span]:block w-[350px] text-lg sm:w-[450px] sm:text-xl text-justify text-zinc-100 font-medium tracking-tight bg-red-600 rounded-3xl [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] p-8 flex justify-center items-center">
                    <span>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugit ullam necessitatibus sint dolor, officia, ipsam reiciendis facere, nihil odit sequi possimus voluptates laboriosam quaerat. Esse quasi debitis quam dolorem porro?</span>
                </div>
            </div>
        </>
    );
}