import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Header from "./Header";
import { useState } from "react";

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`https://formspree.io/f/${import.meta.env.VITE_FORMSPREE_ID}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert('Message sent successfully!');
                setFormData({ name: '', email: '', message: '' });
            } else {
                alert('An error occurred while sending the message');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Connection failed. Please try again later.');
        }
    };

    return (
        <>
            <div className="w-full bg-red-600 flex flex-col items-center justify-between p-4">
                <Header />
                <div>
                    <span>
                        <FontAwesomeIcon icon={faEnvelope} className="text-[150px] sm:text-[250px] [text-shadow:_0_2px_8px_rgba(0,0,0,0.5)] font-medium" />
                    </span>
                </div>
                <div className="w-[350px] sm:w-[600px] bg-red-600 rounded-3xl [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.5))] p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="name" className="block text-zinc-100 font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md"
                                    required
                                />
                            </div>

                            <div className="flex-1">
                                <label htmlFor="email" className="block text-zinc-100 font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full p-2 rounded-md"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-zinc-100 font-medium mb-1">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full p-2 rounded-md"
                                required
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="bg-white text-red-600 font-bold py-2 px-4 rounded-md hover:bg-gray-100 transition mt-2"
                        >
                            Send Message
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}