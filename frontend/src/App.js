import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [quantityState, setQuantityState] = useState({});
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isManualScroll, setIsManualScroll] = useState(false);
    const bannerRef = useRef(null);

    useEffect(() => {
        axios.get('http://localhost:5000/products')
            .then((response) => setProducts(response.data))
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    useEffect(() => {
        let interval;

        if (!isManualScroll) {
            interval = setInterval(() => {
                if (bannerRef.current) {
                    const banners = Array.from(bannerRef.current.children);
                    const firstChild = banners.shift();
                    bannerRef.current.appendChild(firstChild);
                }
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [isManualScroll]);

    const handleManualScroll = () => {
        setIsManualScroll(true);
        setTimeout(() => setIsManualScroll(false), 10000);
    };

    const handleQuantityChange = (productId, type, delta) => {
        setQuantityState((prevState) => {
            const key = `${productId}-${type}`;
            const newQuantity = Math.max((prevState[key] || 0) + delta, 0);

            if (newQuantity === 0) {
                setCart((prevCart) => prevCart.filter(item => !(item._id === productId && item.type === type)));
            } else {
                setCart((prevCart) => {
                    const existingProduct = prevCart.find(
                        (item) => item._id === productId && item.type === type
                    );
                    if (existingProduct) {
                        return prevCart.map((item) =>
                            item._id === productId && item.type === type
                                ? { ...item, quantity: newQuantity }
                                : item
                        );
                    } else {
                        const product = products.find((prod) => prod._id === productId);
                        return [
                            ...prevCart,
                            {
                                _id: productId,
                                title: product.title,
                                image: product.image,
                                type,
                                price: type === 'Half' ? product.halfPrice : product.fullPrice,
                                quantity: newQuantity,
                            },
                        ];
                    }
                });
            }

            return { ...prevState, [key]: newQuantity };
        });
    };

    const toggleOrderSummary = () => {
        setShowOrderSummary(!showOrderSummary);
    };

    const showProductDetails = (product) => {
        setSelectedProduct(product);
    };

    const closeProductDetails = () => {
        setSelectedProduct(null);
    };

    const calculateSubtotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const tax = subtotal * 0.05; 
        return subtotal + tax;
    };

    return (
        <div className="app-container">
            <header className="header">
                <div className="logo">PFC Wings</div>
                <div className="search-bar">
                    <input type="text" placeholder="Search for food..." />
                </div>
            </header>

            <div className="banner-container" onTouchStart={handleManualScroll} onMouseDown={handleManualScroll}>
                <div className="banner-carousel" ref={bannerRef}>
                    <div className="banner-item">
                        <img src="https://content.wepik.com/statics/740676612/preview-page0.jpg" alt="Banner 1" className="banner-image" />
                    </div>
                    <div className="banner-item">
                        <img src="https://img.freepik.com/free-vector/flat-design-food-sale-background_23-2149211006.jpg?w=360" alt="Banner 2" className="banner-image" />
                    </div>
                    <div className="banner-item">
                        <img src="https://img.freepik.com/free-vector/flat-design-food-sale-background_23-2149167390.jpg" alt="Banner 3" className="banner-image" />
                    </div>
                </div>
            </div>

            <main className="product-list">
                {products.map((product) => (
                    <div className="product-card" key={product._id}>
                        <div className="product-header">
                            <div className={product.isVeg ? 'veg-mark' : 'non-veg-mark'}></div>
                            <img
                                className="product-image"
                                src={product.image}
                                alt={product.title}
                            />
                            <div className="product-info">
                                <div className="product-info-header">
                                    <h3>{product.title}</h3>
                                    <span className="time">20min</span>
                                </div>
                                <p>{product.description} <span className="know-more" onClick={() => showProductDetails(product)}>Know More</span></p>
                                <div className="prices">
                                    <span className="price">@{product.halfPrice} Half</span>
                                    <span className="price">@{product.fullPrice} Full</span>
                                </div>
                            </div>
                        </div>
                        <div className="product-actions">
                            <div className="styled-button half">
                                <span className="quantity-label">Half</span>
                                <button className="quantity-button" onClick={() => handleQuantityChange(product._id, 'Half', -1)}>-</button>
                                <span className="quantity-text">{quantityState[`${product._id}-Half`] || 0}</span>
                                <button className="quantity-button" onClick={() => handleQuantityChange(product._id, 'Half', 1)}>+</button>
                            </div>
                            <div className="styled-button full">
                                <span className="quantity-label">Full</span>
                                <button className="quantity-button" onClick={() => handleQuantityChange(product._id, 'Full', -1)}>-</button>
                                <span className="quantity-text">{quantityState[`${product._id}-Full`] || 0}</span>
                                <button className="quantity-button" onClick={() => handleQuantityChange(product._id, 'Full', 1)}>+</button>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {selectedProduct && (
                <div className="popup-overlay">
                    <div className="product-details-popup slide-up">
                        <button className="back-arrow" onClick={closeProductDetails}>&larr;</button>
                        <img className="details-image" src={selectedProduct.image} alt={selectedProduct.title} />
                        <div className="details-content">
                            <h3>{selectedProduct.title}</h3>
                            <p className="details-description">{selectedProduct.detailedDescription}</p>
                            <div className="notes-section">
                                <h4>Add Notes For Chef</h4>
                                <textarea placeholder="Write your notes here..." className="notes-input"></textarea>
                            </div>
                            <div className="special-items">
                                <h4>Add Special Items</h4>
                                {selectedProduct.specialItems.map((item, index) => (
                                    <button key={index} className="special-item-button">{item}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {cart.length > 0 && (
                <footer className="cart-footer">
                    <button onClick={toggleOrderSummary} className="summary-button">Order Summary</button>
                    <button className="place-order">Play Order</button>
                </footer>
            )}

            {showOrderSummary && (
                <div className="popup-overlay">
                    <div className="order-summary-popup slide-up">
                        <h3>Your Cart</h3>
                        <ul className="order-list scrollable">
                            {cart.map((item) => (
                                <li key={`${item._id}-${item.type}`} className="order-item">
                                    <img src={item.image} alt={item.title} className="order-item-image" />
                                    <div className="order-item-details">
                                        <div className="item-title">{item.title} ({item.type})</div>
                                        <div className="quantity-control styled-control">
                                            <span className="quantity-label">Quantity</span>
                                            <button onClick={() => handleQuantityChange(item._id, item.type, -1)}>-</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => handleQuantityChange(item._id, item.type, 1)}>+</button>
                                        </div>
                                        <div className="item-price">Price: ${item.price * item.quantity}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="order-summary-footer">
                            <div className="subtotal">Subtotal: ${calculateSubtotal()}</div>
                            <div className="tax">Tax: ${(calculateSubtotal() * 0.05).toFixed(2)}</div>
                            <div className="grand-total">Grand Total: ${calculateGrandTotal().toFixed(2)}</div>
                        </div>
                        <button onClick={toggleOrderSummary} className="summary-close">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;