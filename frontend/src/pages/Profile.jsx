import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './Auth.css'; // Reuse Auth styles for simplicity or create Profile.css

const Profile = () => {
    const { user, logout } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="auth-container" style={{ paddingTop: '120px', minHeight: '60vh' }}>
            <div className="auth-card" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="auth-header">
                    <h2>My Profile</h2>
                    <p>Manage your account details</p>
                </div>

                <div className="profile-details" style={{ marginTop: '2rem' }}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="profile-value" style={{ padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                            {user.name || user.fullName || "User"}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Email Address</label>
                        <div className="profile-value" style={{ padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                            {user.email}
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="submit-btn"
                        style={{ marginTop: '2rem', background: '#ff4444' }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
