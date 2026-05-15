import React, { useEffect, useState } from 'react';
import api from '../../api';

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState(null);

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

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
        try {
            await api.delete(`/categories/${id}/`);
            fetchCategories();
        } catch (err) {
            console.error("Error deleting category", err);
        }
    };

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

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <p style={{ marginTop: '20px', color: '#64748b' }}>Đang tải danh mục...</p>
        </div>
    );

    return (
        <div className="admin-categories">
            <div className="admin-table-container">
                <div className="admin-table-header">
                    <h2>Quản lý danh mục</h2>
                </div>
                
                <div style={{ padding: '25px 30px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '15px', maxWidth: '500px' }}>
                        <input
                            className="form-control"
                            style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', flex: 1 }}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Tên danh mục mới..."
                        />
                        {editId ? (
                            <button className="admin-btn admin-btn-primary" onClick={() => handleEdit(editId)}>
                                <i className="bi bi-check-lg"></i> Cập nhật
                            </button>
                        ) : (
                            <button className="admin-btn admin-btn-primary" onClick={handleAdd}>
                                <i className="bi bi-plus-lg"></i> Thêm mới
                            </button>
                        )}
                        {editId && (
                            <button className="admin-btn admin-btn-edit" onClick={() => { setEditId(null); setNewName(''); }}>
                                Hủy
                            </button>
                        )}
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên danh mục</th>
                                <th>Slug</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td style={{ fontWeight: '700' }}>#{cat.id}</td>
                                    <td style={{ fontWeight: '600' }}>{cat.name}</td>
                                    <td style={{ color: '#64748b', fontFamily: 'monospace' }}>{cat.slug}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="admin-btn admin-btn-edit" onClick={() => {
                                                setEditId(cat.id);
                                                setNewName(cat.name);
                                            }}>
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button className="admin-btn admin-btn-delete" onClick={() => handleDelete(cat.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Category;