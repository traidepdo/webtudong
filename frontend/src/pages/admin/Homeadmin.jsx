import Headeradmin from "../../components/admin/Header";
// import { Link } from 'react-router-dom';
import NavAdmin from "../../components/admin/Nav";
import "../../App.css";
import "../../admin.css";
function Homeadmin() {
    return (
        <div className="container-homeadmin">
            <Headeradmin />

            <div className="content">
                {/* Sidebar */}
                <NavAdmin />

                {/* Main content */}
                <div className="main">
                    <h1>Home admin</h1>
                </div>
            </div>
        </div>
    );
}

export default Homeadmin;