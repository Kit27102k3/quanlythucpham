import React from 'react';
import ProductCard from './ProductCard';

// Render message dựa vào loại tin nhắn
const renderMessage = (message) => {
  console.log("Rendering message type:", message.type);
  
  switch (message.type) {
    case 'text':
      return <div className="message-text">{message.text}</div>;
    
    case 'productSearch':
      return (
        <div className="product-results">
          {message.products && message.products.length > 0 ? (
            <>
              <div className="message-text">{message.text}</div>
              <div className="product-grid">
                {message.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="message-text">{message.text}</div>
          )}
        </div>
      );
    
    case 'healthProducts':
      return (
        <div className="health-product-results">
          <div className="message-title">{message.title}</div>
          <div className="message-text">{message.text}</div>
          {message.products && message.products.length > 0 && (
            <div className="product-grid">
              {message.products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      );
    
    default:
      return <div className="message-text">{message.text || JSON.stringify(message)}</div>;
  }
};

export default renderMessage; 