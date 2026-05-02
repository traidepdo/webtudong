import React from 'react'
import { useAuth } from '../../context/AuthContext'
function Headeradmin() {
    const { user, logout } = useAuth()

    return (

        <div className="headeradmin">
            <div className="logo">
                <h2>Routine Store</h2>
            </div>
            <div className="admin-profile">
                <img src={user.avatar} alt="" />
                <p>{user.username}</p>
                <button type='button' onClick={logout}>Logout</button>
            </div>
            <style>{`
                .headeradmin {
                    display: flex;
                    justify-content: space-between;
                    padding: 0px 50px;
                    height: 100px;
                    align-items: center;
                    background-color: #00c3ffff;
                }

                .admin-profile {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .admin-profile p {
                    color: white;
                    margin: 0;                    
                }
                .admin-profile button {
                border: none;
                background: black;
                color: white;
                cursor: pointer;
                border-radius: 20px;
                height: 40px;
                width: 80px;
                font-size: 14px;
                font-weight: bold;
                }
                .admin-profile button:hover {
                    background-color: #ff0000;
                    transform: translateY(-5px);
                    transition: all 0.2s ease;
                }
                .admin-profile button:active {
                    background-color: #ff0000;
                    transform: translateY(0px);
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    )
}

export default Headeradmin