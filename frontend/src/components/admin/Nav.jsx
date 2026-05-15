import { NavLink } from 'react-router-dom'; // Dùng NavLink thay Link

function NavAdmin() {
    return (
        <nav className="sidebar">
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li>
                    <NavLink to="/admin/homeadmin">Dashboard</NavLink>
                </li>
                <li>
                    <NavLink to="/admin/categories">Categories</NavLink>
                </li>
                <li>
                    <NavLink to="/admin/products">Product</NavLink>
                </li>
                <li>
                    <NavLink to="/admin/order">Order</NavLink>
                </li>
            </ul>
        </nav>
    );
}
export default NavAdmin;
