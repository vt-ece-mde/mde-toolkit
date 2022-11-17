import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

import Link from "next/link";

export default function Error() {

    const { query } = useRouter();

    return (<>
    <div>ERROR: {query.error}</div>
    <div>This application is restricted to VT.edu subdomains. Please login using your Virginia Tech email address</div>
    <Link href="/api/auth/signout">
        <a className="py-2 px-3 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 hover:text-yellow-800 rounded transition duration-300" onClick={ e => {
            e.preventDefault()
            signIn()
        }}>Try Login Again</a>
    </Link>
    </>);
}