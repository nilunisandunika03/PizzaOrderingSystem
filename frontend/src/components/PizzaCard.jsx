import { useState } from 'react';
import { useCart } from '../context/CartContext';
import './PizzaCard.css';

const PizzaCard = ({ pizza }) => {
    const { name, description, image, rating } = pizza;
    const { addToCart } = useCart();

    const [size, setSize] = useState('Medium');
    const [crust, setCrust] = useState('Pan');

    // Price Mapping
    const sizePrices = {
        'Personal': 850,
        'Medium': 1590,
        'Large': 2980
    };

    const crustSurcharges = {
        'Pan': 0,
        'Ultimate Cheese': 600,
        'Sausage': 600
    };

    const basePrice = sizePrices[size];
    const surcharge = crustSurcharges[crust];
    const totalPrice = basePrice + surcharge;

    const handleAddToCart = () => {
        addToCart({
            ...pizza,
            price: totalPrice,
            selectedSize: size,
            selectedCrust: crust
        });
    };

    return (
        <div className="pizza-card">
            <div className="card-image">
                <img src={image} alt={name} />
                <div className="rating">
                    ★ {rating}
                </div>
            </div>
            <div className="card-content">
                <div className="card-info-section">
                    <h3>{name}</h3>
                    <p className="description-text">{description}</p>
                </div>

                <div className="card-divider"></div>

                <div className="customization-section">
                    <div className="select-group">
                        <label>Select your crust</label>
                        <select value={crust} onChange={(e) => setCrust(e.target.value)}>
                            <option value="Pan">Pan (Free)</option>
                            <option value="Ultimate Cheese">Ultimate Cheese (+Rs. 600.00)</option>
                            <option value="Sausage">Sausage (+Rs. 600.00)</option>
                        </select>
                    </div>

                    <div className="select-group">
                        <label>Select Size</label>
                        <select value={size} onChange={(e) => setSize(e.target.value)}>
                            <option value="Personal">Personal - {sizePrices['Personal'].toFixed(2)}</option>
                            <option value="Medium">Medium - {sizePrices['Medium'].toFixed(2)}</option>
                            <option value="Large">Large - {sizePrices['Large'].toFixed(2)}</option>
                        </select>
                    </div>
                </div>

                <button className="add-to-cart-action" onClick={handleAddToCart}>
                    <span className="add-btn-text">Add</span>
                    <span className="btn-price-display">Rs. {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </button>
            </div>
        </div>
    );
};

export default PizzaCard;
