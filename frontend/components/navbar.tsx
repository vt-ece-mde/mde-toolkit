import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';


export type NavItem = {
    text: string;
    href: string;
    active?: boolean;
}

type NarbarProps = {
    title: string;
    menu_list: NavItem[];
}

// See guide: https://www.youtube.com/watch?v=miiPsBlqMns&ab_channel=DigitalOcean
export default function Navbar({ title, menu_list }: NarbarProps ) {

    const { data: session, status } = useSession()

    return (
        <nav className="bg-gray-100">
            <div className="border border-red-500">
                <div className="flex justify-between">
                    <div className="flex space-x-2">
                        {/* (at left, left) Logo */}
                        <div className="py-4 px-3">
                            <a href="#" className="flex items-center text-gray-700 hover:text-gray-900">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 mr-1 fill-yellow-300">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                </svg>
                                <span className="font-bold">{ title }</span>
                            </a>
                        </div>

                        {/* (at left, right) Primary nav */}
                        <div className="flex items-center space-x-2">
                            {menu_list.map((item, index) => (
                                <Link key={ index } href={ item.href }>
                                    <a className={`${item.active ? "active" : ""} py-4 px-1 text-gray-700 hover:text-gray-900`} aria-current="page">{ item.text }</a>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* (at right) Secondary nav */}
                    <div className="flex items-center space-x-3">

                        {/* Show login button if not authenticated */}
                        { !session && (
                            <Link href="/api/auth/signin">
                                <a className="py-2 px-3 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 hover:text-yellow-800 rounded transition duration-300" onClick={ e => {
                                    e.preventDefault()
                                    signIn()
                                } }>Login</a>
                            </Link>
                        )}

                        {/* Show user info and logout button if authenticated */}
                        { session && (<>
                            <div className='text-center'>
                                <Image src={session.user?.image ? session.user?.image : "#"} className="rounded-full" width={50} height={50} title={ `Logged into Google as: ${session.user?.name ? session.user?.name : "undefined"}` }/>
                                <div className='text-sm'>{session.user?.name ? session.user?.name : "undefined"}</div>
                                <div className='text-xs'>{session.user?.email ? session.user?.email : "undefined"}</div>
                            </div>
                            <Link href="/api/auth/signout">
                                <a className="py-2 px-3 bg-red-400 hover:bg-red-300 text-red-900 hover:text-red-800 rounded transition duration-300" onClick={ e => {
                                    e.preventDefault()
                                    signOut()
                                }}>Logout</a>
                            </Link>
                        </>)}
                    </div>
                </div>
            </div>
        </nav>
    );
}