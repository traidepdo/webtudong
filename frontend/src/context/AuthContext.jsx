import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const res = await api.get('/profile/');
                    setUser(res.data);
                } catch (err) {
                    console.error("Auth initialization failed", err);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        // SimpleJWT TokenObtainPairView expects 'username' field by default.
        // Our EmailBackend will handle the email correctly even if passed as 'username'.
        const res = await api.post('/login/', { username: email, password });
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        const userRes = await api.get('/profile/');
        setUser(userRes.data);
        return userRes.data;
    };

    const register = async (userData) => {
        await api.post('/register/', userData);
        // After registration, we can either auto-login or redirect to login page
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
