import { getProviders, getSession, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import { GetServerSidePropsContext } from "next";

type SignInProps = {
    providers: ClientSafeProvider[],
    redirect: string,
}
export default function SignIn({ providers, redirect }: SignInProps) {
    return (<>
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="font-bold text-xl p-1">Welcome to the VT ECE MDE Toolkit</div>
            <div className="text-lg pb-4">Please sign in below</div>
            <div>
                {Object.values(providers).map(p => renderProvider(p, redirect))}
            </div>
        </div>
    </>);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {

    const { req, query } = context;
    const { redirect = '/' } = query; // Defaults to homepage.
    const session = await getSession({ req });

    // Redirect to homepage if already logged in and no error exists in session.
    if (session && session.error === undefined) {
        return {
            redirect: {
                destination: redirect,
                permanent: false,
            },
        }
    }
    
    if (session && session.error !== undefined) {
        console.log(`[SignIn] there was an error with the current session`)
    }

    console.log(`[SignIn] rendering fresh sign-in page`)

    // Render signin page with provider list.
    const providers = await getProviders()
    return {
        props: { 
            providers,
            redirect,
        },
    }
}

function renderProviderGoogle(provider: ClientSafeProvider, redirect: string) {
    return (<>
        {/* See https://flowbite.com/docs/components/buttons/#social-buttons */}
        <div key={provider.name}>
            <button className="text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 mr-2 mb-2" onClick={() => signIn(provider.id, { callbackUrl: redirect })}>
                <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                Sign in with {provider.name}
            </button>
        </div>
    </>);
}

function renderProvider(provider: ClientSafeProvider, redirect: string) {
    if (provider.name.toLowerCase() === 'google') {
        return renderProviderGoogle(provider, redirect);
    }

    // Do not render unsupported providers.
    return null;
}