import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [cartCount, setCartCount] = useState(0);

    // Load cart from localStorage when component mounts
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCartItems(parsedCart);
            setCartCount(parsedCart.length);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item._id === product._id);
            if (existingItem) {
                return prevItems.map(item =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity }];
        });
        setCartCount(prevCount => prevCount + quantity);
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => {
            const itemToRemove = prevItems.find(item => item._id === productId);
            setCartCount(prevCount => prevCount - itemToRemove.quantity);
            return prevItems.filter(item => item._id !== productId);
        });
    };

    const updateQuantity = (productId, quantity) => {
        setCartItems(prevItems => {
            const itemToUpdate = prevItems.find(item => item._id === productId);
            const quantityDiff = quantity - itemToUpdate.quantity;
            setCartCount(prevCount => prevCount + quantityDiff);
            return prevItems.map(item =>
                item._id === productId
                    ? { ...item, quantity }
                    : item
            );
        });
    };

    const clearCart = () => {
        setCartItems([]);
        setCartCount(0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            cartCount,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
} 