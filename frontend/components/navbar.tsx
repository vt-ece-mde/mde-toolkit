import NavItem from "./navitem";

type NarbarProps = {
    title: string;
    menu_list: any[];
}

export default function Navbar({ title, menu_list }: NarbarProps ) {
    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <a className="navbar-brand" href="#">{ title }</a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNavDropdown">
                        <ul className="navbar-nav">
                            {menu_list.map((item, index) => {
                                return <NavItem active={false} {...item} key={index}/>;
                            })}
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
}