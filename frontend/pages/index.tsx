// import Head from 'next/head'
// import Image from 'next/image'
// import styles from '../styles/Home.module.css'
import { useSession, getSession, getProviders } from 'next-auth/react'
import type { Session } from 'next-auth';
import { GetServerSidePropsContext } from 'next';


export default function Home ({ session }: { session: Session }) {
    // const { data: session, status } = useSession();
    // const loading = (status === "loading");

    return (<>
    <div>
        <h1>Home</h1>
    </div>
    </>);
}


export async function getServerSideProps(context: GetServerSidePropsContext) {

    const { req } = context;
    const session = await getSession({ req });

    // Redirect to signin page.
    if (!session || session?.error === "RefreshAccessTokenError") {
    // if (!session) {
        return {
            redirect: { destination: '/auth/signin', permanent: false },
        }
    }

    // Render desired page with session.
    return {
        props: { 
            session,
        },
    }
}