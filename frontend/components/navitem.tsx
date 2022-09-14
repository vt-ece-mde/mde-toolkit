import Link from "next/link";

type NavItemProps = {
    text: string;
    href: string;
    active: boolean;
}

export default function NavItem({ text, href, active }: NavItemProps) {
    return (
        <li className="nav-item">
            <Link href={ href }>
                <a className={`nav-link ${active ? "active" : ""}`} aria-current="page">{ text }</a>
            </Link>
        </li>
    );
}