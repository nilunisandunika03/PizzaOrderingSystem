import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './Auth.css'; // Reuse Auth styles for simplicity or create Profile.css

const Profile = () => {
    const { user, logout, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        address: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.name || user.fullName || '',
                address: user.address || ''
            });
        }
    }, [user]);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        try {
            await updateProfile(formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    return (
        <div className="auth-container" style={{ paddingTop: '120px', minHeight: '60vh' }}>
            <div className="auth-card" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="auth-header">
                    <h2>My Profile</h2>
                    <p>Manage your account details</p>
                </div>

                {message.text && (
                    <div className={`alert ${message.type}`} style={{ marginTop: '1rem' }}>
                        {message.text}
                    </div>
                )}

                <div className="profile-details" style={{ marginTop: '2rem' }}>
                    {!isEditing ? (
                        <>
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

                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>Home Address</label>
                                <div className="profile-value" style={{ padding: '10px', background: '#f5f5f5', borderRadius: '8px', minHeight: '42px' }}>
                                    {user.address || <span style={{ color: '#999', fontStyle: 'italic' }}>No address provided</span>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="submit-btn"
                                    style={{ background: '#4CAF50' }}
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={logout}
                                    className="submit-btn"
                                    style={{ background: '#ff4444' }}
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    disabled
                                    style={{ background: '#e9ecef', cursor: 'not-allowed' }}
                                />
                                <small style={{ color: '#666' }}>Email cannot be changed.</small>
                            </div>

                            <div className="form-group">
                                <label>Home Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows="3"
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                                    placeholder="Enter your delivery address"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setMessage({ type: '', text: '' });
                                        setFormData({
                                            fullName: user.name || user.fullName || '',
                                            address: user.address || ''
                                        });
                                    }}
                                    className="submit-btn"
                                    style={{ background: '#999' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
