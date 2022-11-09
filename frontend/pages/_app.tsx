// import 'tailwindcss/tailwind.css'
import '../styles/globals.css'

import Head from "next/head";
import Script from "next/script"
import type { AppProps } from 'next/app'
import Navbar, { NavItem } from '../components/navbar';
import { useRouter } from 'next/router';

import { Session } from "next-auth";
import { SessionProvider, useSession } from "next-auth/react";

// Navbar elements.
const NAVBAR_TITLE = "MDE Toolkit";
const NAVBAR_MENU_LIST: NavItem[] = [
    { text: "Home", href: "/" },
    { text: "Courses", href: "/courses" },
    { text: "Students", href: "/students" },
    { text: "IPR History Spreadsheet", href: "/ipr-history-spreadsheet" },
    { text: "Expo Team Dirs", href: "/expo/team-dirs" },
];

function App({ Component, pageProps }: AppProps<{session: Session}>) {

    const router = useRouter();
    const showNavbar = router.pathname.startsWith('/auth/') ? false : true;

    return (
    <>
    <SessionProvider session={pageProps.session}>
        <Head>
            <title>{ NAVBAR_TITLE }</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet"/>
        </Head>

        {/* Conditionally render the navbar (useful for hiding on signin page) */}
        {/* {showNavbar && <Navbar title={ NAVBAR_TITLE } menu_list={ menu_list }/>} */}
        <Navbar title={ NAVBAR_TITLE } menu_list={ NAVBAR_MENU_LIST }/>

        <Component {...pageProps} />

        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/js/bootstrap.bundle.min.js"/>
    </SessionProvider>
    </>
    );
}

export default App
