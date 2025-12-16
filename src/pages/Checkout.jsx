import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'phosphor-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Checkout.css';

const Checkout = () => {
    const { user } = useAuth();
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [step, setStep] = useState('payment'); // payment, processing, success

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (cartItems.length === 0 && step === 'payment') {
            navigate('/menu');
        }
    }, [user, cartItems, navigate, step]);

    const handlePayment = (e) => {
        e.preventDefault();
        setStep('processing');
        setTimeout(() => {
            setStep('success');
            clearCart();
        }, 2000);
    };

    if (step === 'success') {
        return (
            <div className="checkout-page success">
                <div className="success-card">
                    <CheckCircle size={64} color="#4CAF50" weight="fill" />
                    <h1>Order Confirmed!</h1>
                    <p>Thank you, {user?.name}!</p>
                    <p>Your delicious pizza is on its way.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'processing') {
        return (
            <div className="checkout-page processing">
                <div className="spinner"></div>
                <h2>Processing Payment...</h2>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <h1>Checkout</h1>
                <div className="checkout-grid">
                    <div className="payment-form-section">
                        <h2>Payment Details</h2>
                        <form onSubmit={handlePayment}>
                            <div className="form-group">
                                <label>Cardholder Name</label>
                                <input type="text" placeholder="John Doe" required />
                            </div>
                            <div className="form-group">
                                <label>Card Number</label>
                                <input type="text" placeholder="0000 0000 0000 0000" maxLength="19" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Expiry</label>
                                    <input type="text" placeholder="MM/YY" maxLength="5" required />
                                </div>
                                <div className="form-group">
                                    <label>CVC</label>
                                    <input type="text" placeholder="123" maxLength="3" required />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">
                                Pay ${(cartTotal + 5).toFixed(2)}
                            </button>
                        </form>
                    </div>

                    <div className="order-summary-mini">
                        <h3>Order Summary</h3>
                        {cartItems.map(item => (
                            <div key={item.id} className="mini-item">
                                <span>{item.quantity}x {item.name}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="mini-divider"></div>
                        <div className="mini-row total">
                            <span>Total</span>
                            <span>${(cartTotal + 5).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
