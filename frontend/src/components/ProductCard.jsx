import api from "../services/api";
import { getImageUrl } from "../services/image";

function ProductCard({ product }) {
  const handleAddToCart = async () => {
    try {
      await api.post("/cart/", {
        product_id: product.id,
        quantity: 1,
      });

      window.dispatchEvent(new Event("cartUpdated"));
      alert(`${product.name} added to cart!`);
    } catch (error) {
      alert(
        error.response?.data?.error || "Failed to add product to cart"
      );
    }
  };

  return (
    <div className="product-card">

      <div className="product-image">

        {product.image ? (
       <img
  src={getImageUrl(product.image)}
  alt={product.name}
/>
        ) : (
          <div className="no-image">
            No Image
          </div>
        )}

      </div>

      <div className="product-info">

        <p className="product-category">
          {product.category.name}
        </p>

        <h3>
          {product.name}
        </h3>

        <p className="product-description">
          {product.description}
        </p>

        <div className="price-container">

          {product.sale_price ? (
            <>
              <span className="sale-price">
                ₹{product.sale_price}
              </span>

              <span className="original-price">
                ₹{product.price}
              </span>
            </>
          ) : (
            <span className="sale-price">
              ₹{product.price}
            </span>
          )}

        </div>

        <button className="add-cart" onClick={handleAddToCart}>
          Add to Cart
        </button>

      </div>

    </div>
  );
}

export default ProductCard;