import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Truck, Package, Phone, MapPin, Clock, CreditCard, HouseLine } from 'phosphor-react';
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
        no: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        contact1: '',
        contact2: ''
    });

    // Payment State
    const [saveCard, setSaveCard] = useState(false);
    const [selectedCardIdx, setSelectedCardIdx] = useState('new'); // 'new' or index
    const [cardDetails, setCardDetails] = useState({
        name: '',
        number: '',
        expiry: '',
        cvc: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Order info needed for success screen
    const [confirmedOrder, setConfirmedOrder] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (cartItems.length === 0 && step !== 'success') {
            navigate('/menu');
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
            // Prepare Payment Info
            let paymentInfo = {};
            if (selectedCardIdx !== 'new' && user.savedCards && user.savedCards[selectedCardIdx]) {
                const saved = user.savedCards[selectedCardIdx];
                paymentInfo = {
                    method: 'card',
                    last4: saved.last4,
                    brand: saved.brand,
                    saveCard: false // Already saved
                };
            } else {
                paymentInfo = {
                    method: 'card',
                    last4: cardDetails.number.slice(-4),
                    brand: 'Visa', // Simplification
                    expiry: cardDetails.expiry,
                    cardHolder: cardDetails.name,
                    saveCard: saveCard
                };
            }

            const orderData = {
                items: cartItems,
                subtotal: cartTotal,
                tax: 0,
                deliveryFee,
                total: finalTotal,
                deliveryType: orderType,
                deliveryInfo,
                paymentInfo
            };

            const response = await axios.post('http://localhost:3001/api/orders', orderData, { withCredentials: true });

            setConfirmedOrder(response.data);
            setStep('processing');

            // Simulation of processing time
            setTimeout(() => {
                setStep('success');
                clearCart();
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Payment processing failed');
            setLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="checkout-page success">
                <div className="success-card">
                    <CheckCircle size={64} color="#4CAF50" weight="fill" />
                    <h1>Order Confirmed!</h1>
                    <p>Thank you, {user?.full_name || user?.name}!</p>
                    <p>Order #{confirmedOrder?.orderNumber}</p>
                    <p>{orderType === 'delivery' ? 'Your delicious pizza will be delivered to you within 30 minutes!' : 'Your pizza will be ready for pickup soon.'}</p>
                    <div className="success-actions">
                        <button className="btn btn-secondary" onClick={() => navigate('/orders')}>
                            View Order History
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Back to Home
                        </button>
                    </div>
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
                                                <label><HouseLine size={16} /> Delivery Address</label>
                                                <div className="address-grid">
                                                    <div className="form-row">
                                                        <div className="form-group" style={{ flex: '1' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="No."
                                                                required
                                                                value={deliveryInfo.no}
                                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, no: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="form-group" style={{ flex: '3' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Street Name"
                                                                required
                                                                value={deliveryInfo.street}
                                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, street: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <input
                                                                type="text"
                                                                placeholder="City"
                                                                required
                                                                value={deliveryInfo.city}
                                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <input
                                                                type="text"
                                                                placeholder="State"
                                                                required
                                                                value={deliveryInfo.state}
                                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, state: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <input
                                                                type="text"
                                                                placeholder="ZIP Code"
                                                                required
                                                                value={deliveryInfo.zipCode}
                                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, zipCode: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label><Phone size={16} /> Primary Contact</label>
                                                    <input
                                                        type="tel"
                                                        placeholder="07X XXX XXXX"
                                                        required
                                                        value={deliveryInfo.contact1}
                                                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, contact1: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label><Phone size={16} /> Secondary Contact</label>
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

                                    {/* Saved Cards Selection */}
                                    {user?.savedCards?.length > 0 && (
                                        <div className="saved-cards-section">
                                            <h3>Saved Cards</h3>
                                            <div className="saved-cards-list">
                                                {user.savedCards.map((card, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`saved-card-item ${selectedCardIdx === idx ? 'selected' : ''}`}
                                                        onClick={() => setSelectedCardIdx(idx)}
                                                    >
                                                        <div className="card-icon">{card.brand === 'Visa' ? '💳' : '💳'}</div>
                                                        <div className="card-info">
                                                            <span className="card-last4">•••• {card.last4}</span>
                                                            <span className="card-expiry">Expires {card.expiry}</span>
                                                        </div>
                                                        <div className="card-check">
                                                            {selectedCardIdx === idx && <CheckCircle size={20} weight="fill" color="#ff6b6b" />}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div
                                                    className={`saved-card-item new-card ${selectedCardIdx === 'new' ? 'selected' : ''}`}
                                                    onClick={() => setSelectedCardIdx('new')}
                                                >
                                                    <div className="card-icon"><CreditCard size={24} /></div>
                                                    <div className="card-info">Use a new card</div>
                                                    <div className="card-check">
                                                        {selectedCardIdx === 'new' && <CheckCircle size={20} weight="fill" color="#ff6b6b" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* New Card Form */}
                                    {selectedCardIdx === 'new' && (
                                        <div className="new-card-form">
                                            <div className="form-group">
                                                <label>Cardholder Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    required
                                                    value={cardDetails.name}
                                                    onChange={e => setCardDetails({ ...cardDetails, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="0000 0000 0000 0000"
                                                    maxLength="19"
                                                    required
                                                    value={cardDetails.number}
                                                    onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Expiry</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        maxLength="5"
                                                        required
                                                        value={cardDetails.expiry}
                                                        onChange={e => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>CVC</label>
                                                    <input
                                                        type="text"
                                                        placeholder="123"
                                                        maxLength="3"
                                                        required
                                                        value={cardDetails.cvc}
                                                        onChange={e => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group checkbox-group">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={saveCard}
                                                        onChange={(e) => setSaveCard(e.target.checked)}
                                                    />
                                                    Save this card for future orders
                                                </label>
                                            </div>
                                        </div>
                                    )}

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
