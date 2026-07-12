import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaViber, FaWhatsapp } from "react-icons/fa";

const Footer: React.FC = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-gray-900 text-white py-16">
            <div className="container mx-auto px-4">
                {/* Responsive Flex Container: Stack on mobile, row on md+ */}
                <div className="flex flex-col md:flex-row md:justify-between gap-12">
                    {/* Section 1: Branding and Social Icons */}
                    <section className="md:w-1/2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8  rounded-lg flex items-center justify-center">
                                <img className='h-9' src="/favicon-32x32.png" alt="" />
                                {/* <Calendar className="h-5 w-5 text-white" /> */}
                            </div>
                            <span className="text-xl font-bold">Event Solution</span>
                        </div>
                        <p className="text-gray-400 mb-4 max-w-xl">
                            Event Solution is one of the best event portals that allows organizers to create and promote their event online. It offers a range of tools to manage event registration, ticket sales, and promotion.
                        </p>
                        <div className="flex gap-4">
                            {/* <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#1877F2]">
                                <span><FaFacebookF /></span>
                            </div>
                            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gradient-to-r from-[#fd1d1d] to-[#fcb045]">
                                <span><FaInstagram/></span>
                            </div>
                            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#0077B5]">
                                <span><FaLinkedinIn /></span>
                            </div> */}
                            <a className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#1877F2]" href="https://www.facebook.com/eventsolutionnepal" target="_blank" rel="noopener noreferrer">
                            <span><FaFacebookF /></span>
                            </a>
                            <a className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gradient-to-r from-[#fd1d1d] to-[#fcb045]" href="https://www.instagram.com/eventsolutionnepal/" target="_blank" rel="noopener noreferrer">
                            <span><FaInstagram /></span>
                            </a>
                            <a className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#0077B5]" href="https://www.linkedin.com/in/event-solution-0b437b1a1/" target="_blank" rel="noopener noreferrer">
                            <span><FaLinkedinIn /></span>
                            </a>
                            <a className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#000000]" href="" target="_blank" rel="noopener noreferrer">
                            <span><FaTiktok /></span>
                            </a>
                            <a className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#25D366]" href="https://wa.me/9779841503622" target="_blank" rel="noopener noreferrer">
                            <span><FaWhatsapp /></span>
                            </a>
                            <a className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#665CAC]" href="https://invite.viber.com/?g2=AQAxZOgB%2B7IeSktn9WPCFT5HGWrBuv%2FG4NoMztJCNGbEFghBBsF4feQQnwPWpAe3" target="_blank" rel="noopener noreferrer">
                            <span><FaViber /></span>
                            </a>
                        </div>
                    </section>

                    {/* Section 2: Company Links */}
                    <section className="md:w-1/6">
                        <h3 className="font-semibold mb-4">Company</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li>
                                <button
                                    className="hover:text-white transition-colors cursor-pointer"
                                    onClick={() => navigate('/about-us')}
                                >
                                    About Us
                                </button>
                            </li>
                            <li>
                                <button
                                    className="hover:text-white transition-colors cursor-pointer"
                                    onClick={() => navigate('/services')}
                                >
                                    Services
                                </button>
                            </li>
                            <li>
                                <button
                                    className="hover:text-white transition-colors"
                                    onClick={() => navigate('/faqs')}
                                >
                                    FAQs
                                </button>
                            </li>
                            <li>
                                <button
                                    className="hover:text-white transition-colors"
                                    onClick={() => navigate('/contact-us')}
                                >
                                    Contact Us
                                </button>
                            </li>
                        </ul>
                    </section>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                    <p>2025 © Event Solution, Pvt. Ltd. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
