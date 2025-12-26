import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import axios from 'axios';
import zxcvbn from 'zxcvbn'; // We'll need to install this in frontend too

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordScore, setPasswordScore] = useState(0);

    const { signup } = useAuth();
    // const navigate = useNavigate(); // We don't nav automatically, we show "Check Email"

    const fetchCaptcha = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/auth/captcha', { withCredentials: true });
            setCaptchaSvg(response.data.svg);
        } catch (err) {
            console.error('Failed to load captcha');
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        const result = zxcvbn(val);
        setPasswordScore(result.score); // 0-4
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordScore < 3) {
            setError('Please choose a stronger password.');
            return;
        }

        try {
            const res = await signup(name, email, password, captcha);
            setSuccess(res.message);
            // Clear form
            setName('');
            setEmail('');
            setPassword('');
            setCaptcha('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign up');
            fetchCaptcha(); // Refresh captcha on failure
        }
    };

    const getStrengthLabel = (score) => {
        switch (score) {
            case 0: return { label: 'Very Weak', color: 'red', width: '20%' };
            case 1: return { label: 'Weak', color: 'orange', width: '40%' };
            case 2: return { label: 'Fair', color: 'yellow', width: '60%' };
            case 3: return { label: 'Good', color: 'lightgreen', width: '80%' };
            case 4: return { label: 'Strong', color: 'green', width: '100%' };
            default: return { label: '', color: 'transparent', width: '0' };
        }
    };

    const strength = getStrengthLabel(passwordScore);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Create Account</h2>
                <p>Join us for exclusive deals</p>

                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                required
                            />
                            {password && (
                                <div className="password-strength">
                                    <div className="strength-bar-bg">
                                        <div
                                            className="strength-bar-fill"
                                            style={{ width: strength.width, backgroundColor: strength.color }}
                                        ></div>
                                    </div>
                                    <small style={{ color: strength.color }}>{strength.label}</small>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Captcha</label>
                            <div className="captcha-container">
                                <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="captcha-img" />
                                <button type="button" onClick={fetchCaptcha} className="btn-icon" title="Refresh Captcha">↻</button>
                            </div>
                            <input
                                type="text"
                                value={captcha}
                                onChange={(e) => setCaptcha(e.target.value)}
                                placeholder="Enter characters exactly"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block">
                            Sign Up
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
