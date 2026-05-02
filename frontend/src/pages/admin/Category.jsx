import "../../App.css";
import Headeradmin from "../../components/admin/Header";
import NavAdmin from "../../components/admin/Nav";
import api from "../../api";
import { useState, useEffect } from "react";

function CategoryAdmin() {
    const [checkEdit, setCheckEdit] = useState(false);
    const [categories, setCategories] = useState([]);
    const [nameCategory, setNameCategory] = useState("");
    const [idCategory, setIdCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const getCategory = () => {
        setLoading(true);
        api.get("categories/")
            .then(res => setCategories(res.data))
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }
    useEffect(() => {
        getCategory();
    }, []);
    const handleDelete = (id) => {
        api.delete(`categories/${id}`)
            .then(response => {
                alert("Delete success");
                getCategory();
            })
            .catch(error => {
                console.log(error);
            })
    }
    const handleEdit = async (e) => {
        e.preventDefault();
        if (idCategory) {
            console.log(idCategory);
            await api.put(`categories/${idCategory}/`, { name: nameCategory })
                .then(response => {
                    alert("Edit success");
                    getCategory();
                    setCheckEdit(false);
                    setIdCategory("");
                    setNameCategory("");
                })
                .catch(error => {
                    alert("Edit fail");
                })
        } else {
            await api.post("categories/", { name: nameCategory })
                .then(response => {
                    alert("Add success");
                    getCategory();
                    setCheckEdit(false);
                    setIdCategory("");
                    setNameCategory("");
                })
                .catch(error => {
                    alert("Add fail");
                })
        }
    }
    // { loading ? <p>Loading...</p> : <table>...</table> }

    return (
        <div className="container-homeadmin">
            <Headeradmin />
            <div className="content">
                {/* Sidebar */}
                <NavAdmin />

                {/* Main content */}
                <div className="main">
                    {loading ? <p>Loading...</p> :
                        checkEdit ? (
                            <div className="d-flex justify-content-center flex-column p-5 gap-3">
                                <h1 >{idCategory ? "Edit" : "Add"} Category</h1>
                                <form onSubmit={handleEdit} className="d-flex  gap-3 flex-column justify-content-start">
                                    <div class="input-group">
                                        <span class="input-group-text">Name Category</span>
                                        <input type="text" aria-label="First name" className="form-control" id="nameCategory" onChange={(e) => setNameCategory(e.target.value)} value={nameCategory} />

                                    </div>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-primary text-white rounded-4" style={{ padding: "4px 10px" }} type="submit">Lưu</button>
                                        <button className="btn btn-danger text-white rounded-4" style={{ padding: "4px 10px" }} type="button" onClick={() => {
                                            setCheckEdit(false);
                                            setIdCategory("");
                                            setNameCategory("")
                                        }}>Hủy</button>
                                    </div>
                                </form>
                            </div>
                        ) :
                            (<table className="table">
                                <thead>
                                    <tr>
                                        <th scope="col">id</th>
                                        <th scope="col">Tên Category</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(cate => (
                                        <tr key={cate.id}>
                                            <th scope="row">{cate.id}</th>
                                            <td>{cate.name}</td>
                                            <td className="d-flex gap-4">
                                                <button className="btn btn-danger text-white rounded-4" style={{ padding: "4px 10px" }} onClick={() => handleDelete(cate.id)}>
                                                    Delete
                                                </button>
                                                <button className="btn btn-warning text-white rounded-4" style={{ padding: "4px 10px" }} onClick={() => {
                                                    setIdCategory(cate.id);
                                                    setNameCategory(cate.name);
                                                    setCheckEdit(true)
                                                }}>
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table >)}
                    {checkEdit ? (" ") : (<button type="button" className="btn btn-primary" onClick={() => setCheckEdit(true)}>Thêm Category</button>)}
                </div >
            </div >
        </div >
    )
}

export default CategoryAdmin;