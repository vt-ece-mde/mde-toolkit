import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useRouter } from 'next/router';


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

    const router = useRouter();

    const { data: session, status } = useSession()

    // Override navbar items if user is not logged in.
    if (!session) {
        menu_list = [];
    }

    return (
        <nav className="bg-gray-100">
            <div className="border border-red-500">
                <div className="flex justify-between">
                    <div className="flex space-x-2">
                        {/* (at left, left) Logo */}
                        <div className="py-4 px-3">
                            <Link href="/">
                                <a className="flex items-center text-gray-700 hover:text-gray-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 mr-1 fill-yellow-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                    </svg>
                                    <span className="font-bold">{ title }</span>
                                </a>
                            </Link>
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
                    <div className="flex items-center space-x-3 pr-4">

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
                            <UserDropdown session={session}/>
                        </>)}
                    </div>
                </div>
            </div>
        </nav>
    );
}


interface UserDropDownProps {
    session: Session;
}
function UserDropdown({ session }: UserDropDownProps) {

    const router = useRouter();

    console.log(`session? ${JSON.stringify(session)}`)
    return (<>
        <div>
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button>
                        <div>
                            {session.user?.image ? (
                                <Image alt="User Icon" src={session.user?.image} className="rounded-full" width={50} height={50} title={ `Logged into Google as: ${session.user?.name}` }/>
                            ) : (
                                <div className='rounded-full w-12 h-12'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            )
                            }
                        </div>
                        {/* <Image src={session.user?.image ? session.user?.image : "#"} className="rounded-full" width={50} height={50} title={ `Logged into Google as: ${session.user?.name ? session.user?.name : "undefined"}` }/> */}
                    </Menu.Button>
                </div>
                <div>
                <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
                >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1 ">
                        <Menu.Item>
                            {({ active }) => (
                                <div className='block px-4 py-2 text-sm text-gray-500 rounded-lg'>
                                <div className='text-sm'>{session.user?.name ? session.user?.name : "undefined"}</div>
                                <div className='text-xs'>{session.user?.email ? session.user?.email : "undefined"}</div>
                            </div>
                            )}
                        </Menu.Item>
                    </div>
                    <div className="px-1 py-1 ">
                        <Menu.Item>
                            {({ active }) => (
                                <Link href="/api/auth/signin">
                                    <a className="block px-4 py-2 text-sm text-gray-500 rounded-lg hover:bg-blue-50 hover:text-blue-700" onClick={ e => {
                                        e.preventDefault()
                                        signIn("google", { callbackUrl: router.pathname })
                                    } }>Switch Accounts</a>
                                </Link>
                            )}
                        </Menu.Item>
                        <Menu.Item>
                            {({ active }) => (
                                <Link href="/api/auth/signout">
                                    <a className="block px-4 py-2 text-sm text-gray-500 rounded-lg hover:bg-red-50 hover:text-red-700" onClick={ e => {
                                        e.preventDefault()
                                        signOut({ callbackUrl: '/auth/signin?' + new URLSearchParams({ redirect: router.pathname })})
                                    }}>Logout</a>
                                </Link>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
                </Transition>
                </div>
            </Menu>
        </div>
    </>);
}