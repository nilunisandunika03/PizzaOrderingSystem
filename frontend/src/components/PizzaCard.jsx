import { Plus } from 'phosphor-react';
import { useCart } from '../context/CartContext';
import './PizzaCard.css';

const PizzaCard = ({ pizza }) => {
    const { name, description, price, image, rating } = pizza;
    const { addToCart } = useCart();

    return (
        <div className="pizza-card">
            <div className="card-image">
                <img src={image} alt={name} />
                <div className="rating">
                    ★ {rating}
                </div>
            </div>
            <div className="card-content">
                <h3>{name}</h3>
                <p>{description}</p>
                <div className="card-footer">
                    <span className="price">${price.toFixed(2)}</span>
                    <button className="add-btn" aria-label="Add to cart" onClick={() => addToCart(pizza)}>
                        <Plus weight="bold" /> Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PizzaCard;
