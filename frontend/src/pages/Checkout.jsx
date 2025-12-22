import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, Package, Phone, MapPin, Clock } from 'phosphor-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import './Checkout.css';

const Checkout = () => {
    const { user } = useAuth();
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();

    const [step, setStep] = useState('details'); // details, payment, processing, success
    const [orderType, setOrderType] = useState(null); // null, delivery, takeaway
    const [deliveryInfo, setDeliveryInfo] = useState({
        address: '',
        contact1: '',
        contact2: ''
    });

    const [captcha, setCaptcha] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchCaptcha = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/auth/captcha', { withCredentials: true });
            setCaptchaSvg(response.data);
        } catch (err) {
            console.error('Failed to load captcha');
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (cartItems.length === 0 && step !== 'success') {
            navigate('/menu');
        }

        if (step === 'payment') {
            fetchCaptcha();
        }
    }, [user, cartItems, navigate, step]);

    const deliveryFee = orderType === 'delivery' ? 300 : 0;
    const finalTotal = cartTotal + deliveryFee;

    const handleDetailsSubmit = (e) => {
        e.preventDefault();
        if (!orderType) {
            alert('Please select an order type (Delivery or Takeaway) to proceed.');
            return;
        }
        setStep('payment');
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Verify CAPTCHA first
            await axios.post('http://localhost:3001/api/auth/verify-captcha', { captcha }, { withCredentials: true });

            setStep('processing');
            setTimeout(() => {
                setStep('success');
                clearCart();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'CAPTCHA verification failed');
            fetchCaptcha(); // Refresh captcha on failure
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="checkout-page success">
                <div className="success-card">
                    <CheckCircle size={64} color="#4CAF50" weight="fill" />
                    <h1>Order Confirmed!</h1>
                    <p>Thank you, {user?.name}!</p>
                    <p>{orderType === 'delivery' ? 'Your delicious pizza will be delivered to you within 30 minutes!' : 'Your pizza will be ready for pickup soon.'}</p>
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
                <div className="checkout-header">
                    <h1>Checkout</h1>
                    <div className="checkout-steps">
                        <div className={`step-indicator ${step === 'details' ? 'active' : 'completed'}`}>1. Order Details</div>
                        <div className={`step-indicator ${step === 'payment' ? 'active' : ''}`}>2. Payment</div>
                    </div>
                </div>

                <div className="checkout-grid">
                    <div className="checkout-main">
                        {step === 'details' ? (
                            <div className="details-section">
                                <h2>How would you like your pizza?</h2>
                                <div className="order-type-toggle">
                                    <button
                                        className={`type-btn ${orderType === 'delivery' ? 'active' : ''}`}
                                        onClick={() => setOrderType('delivery')}
                                    >
                                        <Truck size={24} />
                                        <span>Delivery</span>
                                    </button>
                                    <button
                                        className={`type-btn ${orderType === 'takeaway' ? 'active' : ''}`}
                                        onClick={() => setOrderType('takeaway')}
                                    >
                                        <Package size={24} />
                                        <span>Takeaway</span>
                                    </button>
                                </div>

                                <form onSubmit={handleDetailsSubmit} className="checkout-form">
                                    {orderType === 'delivery' && (
                                        <div className="delivery-form">
                                            <div className="delivery-notification">
                                                <Clock size={20} weight="fill" />
                                                <span>Estimated delivery time: <strong>30 Minutes</strong></span>
                                            </div>
                                            <div className="form-group">
                                                <label><MapPin size={16} /> Delivery Location</label>
                                                <textarea
                                                    placeholder="Enter your full address"
                                                    required
                                                    value={deliveryInfo.address}
                                                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                                                ></textarea>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label><Phone size={16} /> Contact Number</label>
                                                    <input
                                                        type="tel"
                                                        placeholder="07X XXX XXXX"
                                                        required
                                                        value={deliveryInfo.contact1}
                                                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, contact1: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label><Phone size={16} /> Additional Number</label>
                                                    <input
                                                        type="tel"
                                                        placeholder="07X XXX XXXX"
                                                        required
                                                        value={deliveryInfo.contact2}
                                                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, contact2: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {orderType === 'takeaway' && (
                                        <div className="takeaway-info">
                                            <p>You can pick up your order at our main branch.</p>
                                        </div>
                                    )}

                                    <button type="submit" className="btn btn-primary btn-block">
                                        Proceed to Payment
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="payment-form-section">
                                <div className="payment-header">
                                    <button className="back-btn" onClick={() => setStep('details')}>← Back to Details</button>
                                    <h2>Payment Details</h2>
                                </div>
                                {error && <div className="alert error">{error}</div>}
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

                                    <div className="form-group captcha-group">
                                        <label>Human Verification</label>
                                        <div className="captcha-container">
                                            <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="captcha-img" />
                                            <button type="button" onClick={fetchCaptcha} className="btn-icon">↻</button>
                                        </div>
                                        <input
                                            type="text"
                                            value={captcha}
                                            onChange={(e) => setCaptcha(e.target.value)}
                                            placeholder="Enter characters exactly"
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                        {loading ? 'Processing...' : `Pay Rs. ${finalTotal.toLocaleString()}`}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>

                    <div className="order-summary-mini">
                        <h3>Order Summary</h3>
                        <div className="mini-items-container">
                            {cartItems.map((item, index) => (
                                <div key={`${item.id}-${index}`} className="mini-item">
                                    <div className="mini-item-info">
                                        <span className="mini-item-name">{item.name}</span>
                                        <span className="mini-item-meta">{item.selectedSize} | {item.selectedCrust}</span>
                                        <span className="mini-item-qty">Qty: {item.quantity}</span>
                                    </div>
                                    <span className="mini-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mini-divider"></div>
                        <div className="summary-calculations">
                            <div className="mini-row">
                                <span>Subtotal</span>
                                <span>Rs. {cartTotal.toLocaleString()}</span>
                            </div>
                            <div className="mini-row">
                                <span>Delivery Fee</span>
                                <span>{deliveryFee > 0 ? `Rs. ${deliveryFee}` : 'FREE'}</span>
                            </div>
                            <div className="mini-divider"></div>
                            <div className="mini-row total">
                                <span>Total</span>
                                <span>Rs. {finalTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
