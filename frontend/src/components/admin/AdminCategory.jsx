import React, { useEffect, useState } from 'react';
import api from '../../api';

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState(null);

    // 🔥 Đưa ra ngoài để dùng lại
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories/');
            setCategories(res.data);
        } catch (err) {
            console.error("Error fetching categories", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // ❌ Xóa
    const handleDelete = async (id) => {
        try {
            await api.delete(`/categories/${id}/`);
            fetchCategories();
        } catch (err) {
            console.error("Error deleting category", err);
        }
    };

    // ➕ Thêm
    const handleAdd = async () => {
        if (!newName) return;
        try {
            await api.post('/categories/', { name: newName });
            setNewName('');
            fetchCategories();
        } catch (err) {
            console.error("Error adding category", err);
        }
    };

    // ✏️ Sửa
    const handleEdit = async (id) => {
        if (!newName) return;
        try {
            await api.put(`/categories/${id}/`, { name: newName });
            setEditId(null);
            setNewName('');
            fetchCategories();
        } catch (err) {
            console.error("Error editing category", err);
        }
    };

    if (loading) return <div>Đang tải...</div>;

    return (
        <div>
            <h2>Danh mục</h2>

            {/* INPUT */}
            <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nhập tên danh mục"
            />

            {editId ? (
                <button onClick={() => handleEdit(editId)}>Cập nhật</button>
            ) : (
                <button onClick={handleAdd}>Thêm danh mục</button>
            )}

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên danh mục</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(category => (
                        <tr key={category.id}>
                            <td>{category.id}</td>
                            <td>{category.name}</td>
                            <td>
                                <button onClick={() => handleDelete(category.id)}>
                                    Xóa
                                </button>

                                <button onClick={() => {
                                    setEditId(category.id);
                                    setNewName(category.name);
                                }}>
                                    Sửa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Category;