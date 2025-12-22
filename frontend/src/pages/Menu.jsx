import { useState } from 'react';
import PizzaCard from '../components/PizzaCard';
import pizzaImage from '../assets/pizza-margherita.png';
import './Menu.css';

const menuItems = [
    { id: 1, name: "Classic Margherita", description: "San Marzano tomato sauce, fresh mozzarella di bufala, basil, extra virgin olive oil.", price: 14.50, rating: 4.8, image: pizzaImage, category: 'vegetarian' },
    { id: 2, name: "Double Pepperoni", description: "Crispy cup pepperoni, spicy tomato sauce, mozzarella, parmesan, oregano.", price: 16.00, rating: 4.9, image: pizzaImage, category: 'meat' },
    { id: 3, name: "Truffle Mushroom", description: "Wild mushrooms, truffle cream base, thyme, mozzarella, garlic oil.", price: 18.00, rating: 4.7, image: pizzaImage, category: 'vegetarian' },
    { id: 4, name: "Four Cheese", description: "Mozzarella, gorgonzola, fontina, and parmesan cheese with a touch of honey.", price: 17.50, rating: 4.6, image: pizzaImage, category: 'vegetarian' },
    { id: 5, name: "Spicy Hawaiian", description: "Roasted pineapple, jalapeños, smoked ham, bacon, mozzarella.", price: 16.50, rating: 4.5, image: pizzaImage, category: 'spicy' },
    { id: 6, name: "BBQ Chicken", description: "Grilled chicken, red onions, cilantro, BBQ sauce base, gouda cheese.", price: 17.00, rating: 4.8, image: pizzaImage, category: 'meat' },
    { id: 7, name: "Veggie Supreme", description: "Bell peppers, onions, olives, mushrooms, tomatoes, spinach, feta.", price: 15.50, rating: 4.7, image: pizzaImage, category: 'vegetarian' },
    { id: 8, name: "Meat Lovers", description: "Pepperoni, sausage, bacon, ham, ground beef, mozzarella.", price: 19.00, rating: 4.9, image: pizzaImage, category: 'meat' },
    { id: 9, name: "Spicy Diablo", description: "Spicy salami, chili flakes, hot honey, mozzarella, basil.", price: 18.50, rating: 4.8, image: pizzaImage, category: 'spicy' },
    { id: 10, name: "Pesto Garden", description: "Basil pesto base, cherry tomatoes, pine nuts, ricotta cheese.", price: 16.50, rating: 4.6, image: pizzaImage, category: 'vegetarian' },
    { id: 11, name: "Italian Sausage", description: "Fennel sausage, roasted peppers, onions, mozzarella.", price: 17.00, rating: 4.7, image: pizzaImage, category: 'meat' },
    { id: 12, name: "Buffalo Chicken", description: "Spicy buffalo sauce, grilled chicken, blue cheese drizzle, celery.", price: 17.50, rating: 4.6, image: pizzaImage, category: 'spicy' },
];

const Menu = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredItems = activeCategory === 'All'
        ? menuItems
        : menuItems.filter(item => {
            if (activeCategory === 'Vegetarian') return item.category === 'vegetarian';
            if (activeCategory === 'Meat') return item.category === 'meat' || item.category === 'spicy'; // Include spicy meats in generic meat? Or strict? Let's be strict for now or careful. Actually usually Spicy is a flavor profile. Let's just match category for now or allow overlapping if we had arrays. Since category is string, let's just do direct match.
            // Wait, "Meat" usually implies non-veg. 
            if (activeCategory === 'Meat') return item.category === 'meat' || (item.category === 'spicy' && !item.name.includes('Veg')); // simplistic check
            if (activeCategory === 'Spicy') return item.category === 'spicy';
            return true;
        });

    // Let's refine the filter logic to be more precise based on standard expectations
    const getFilteredItems = () => {
        if (activeCategory === 'All') return menuItems;
        if (activeCategory === 'Vegetarian') return menuItems.filter(item => item.category === 'vegetarian');
        if (activeCategory === 'Meat') return menuItems.filter(item => item.category === 'meat' || (item.category === 'spicy' && item.name !== 'Veggie'));
        if (activeCategory === 'Spicy') return menuItems.filter(item => item.category === 'spicy');
        return menuItems;
    };

    const displayItems = getFilteredItems();

    return (
        <div className="menu-page">
            <div className="menu-header">
                <div className="container">
                    <h1>Our Menu</h1>
                    <p>Explore our wide range of handcrafted pizzas.</p>
                </div>
            </div>

            <div className="container menu-content">
                <div className="filters">
                    {['All', 'Vegetarian', 'Meat', 'Spicy'].map(category => (
                        <button
                            key={category}
                            className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="pizza-grid">
                    {displayItems.map(pizza => (
                        <PizzaCard key={pizza.id} pizza={pizza} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Menu;
