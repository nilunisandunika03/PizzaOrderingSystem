import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in (session exists) on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/me');
                setUser(response.data.user);
            } catch (error) {
                console.log('Not authenticated');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password, captcha) => {
        // This function now returns the response data so component can handle MFA
        const response = await api.post('/login', { email, password, captcha });
        // If MFA not required (e.g. disabled setting?), we might set user here, 
        // but our backend always requires MFA given the task description.
        // So we expect { requireMfa: true }
        return response.data;
    };

    const verifyOtp = async (otp) => {
        const response = await api.post('/verify-otp', { otp });
        setUser(response.data.user);
        return response.data;
    };

    const signup = async (name, email, password, captcha, address) => {
        const response = await api.post('/register', { fullName: name, email, password, captcha, address });
        return response.data; // Expect message about checking email
    };

    const updateProfile = async (data) => {
        const response = await api.put('/profile', data);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyOtp, signup, logout, loading, updateProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
