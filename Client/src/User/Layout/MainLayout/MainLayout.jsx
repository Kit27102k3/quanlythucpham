import React, { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";
import "./MainLayout.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import ChatBot from '../../Components/ChatBot/ChatBot';

const MainLayout = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    }, []);

    return (
        <>
            {loading ? (
                <div className="loading-container">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className='main-layout'>
                    <header className='header'>
                        <Navbar />
                    </header>
                    <main className='main-content'>
                        <Outlet />
                    </main>
                    <footer className='footer'>
                        <Footer />
                    </footer>
                    <ChatBot />
                </div>
            )}
        </>
    );
};

export default MainLayout; 