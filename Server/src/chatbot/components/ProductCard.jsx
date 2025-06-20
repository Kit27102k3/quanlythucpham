import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  if (!product) return null;

  // Kiểm tra và xử lý dữ liệu sản phẩm
  const productName = product.productName || 'Sản phẩm không có tên';
  const productPrice = product.productPrice || 0;
  
  // Xử lý hình ảnh sản phẩm - ưu tiên theo thứ tự
  let imageUrl = null;
  if (product.productImage) {
    imageUrl = product.productImage;
  } else if (product.productImageURL) {
    imageUrl = product.productImageURL;
  } else if (product.imageBase64) {
    imageUrl = product.imageBase64;
  }

  // Log để debug
  console.log('ProductCard rendering:', {
    name: productName,
    price: productPrice,
    image: imageUrl,
    product: product
  });

  // Định dạng giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="product-card">
      <div className="product-image">
        {imageUrl ? (
          <img src={imageUrl} alt={productName} />
        ) : (
          <div className="no-image">Không có hình ảnh</div>
        )}
      </div>
      <div className="product-info">
        <h3 className="product-name">{productName}</h3>
        <p className="product-price">{formatPrice(productPrice)}</p>
      </div>
    </div>
  );
};

export default ProductCard; 