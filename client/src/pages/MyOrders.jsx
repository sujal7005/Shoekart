import "../styles/order.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TriangleLoader from "../components/TriangleLoader";
import EmptyImage from "../Images/empty-cart.png";
import Axios from "../Axios";
import FormReviews from "../components/FormReviews";
import { toast } from "react-toastify";

const MyOrders = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const navigate = useNavigate();
  
  const fetchData = async () => {
    try {
      // Get token from localStorage
      let token = localStorage.getItem("token");
      if (!token) {
        // Fallback to old key
        token = localStorage.getItem("jwt");
      }
      
      if (!token) {
        toast.error("Please login to view orders");
        setLoading(false);
        return;
      }
      
      // Clean token (remove Bearer prefix if present)
      const cleanToken = token.replace(/^Bearer\s+/i, "");
      
      // Fix: Add /api/v1/ prefix to the endpoint
      const response = await Axios.get("/api/v1/orders", {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
      });
      
      console.log("Orders response:", response.data);
      
      // Check if orders exist in response
      if (response.data.success === true) {
        setData(response.data.orders || []);
      } else if (response.data.orders) {
        setData(response.data.orders);
      } else {
        setData([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Fetch orders error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch orders");
      }
      
      setData([]);
      setLoading(false);
    }
  };
  
  const openReviewModal = (status, id1, id2) => {
    if (status && status.toLowerCase() !== "delivered") {
      toast.error("You can only review delivered products.");
      return;
    }
    setShowModal(true);
    setCurrentProductId(id1);
    setCurrentOrderId(id2);
  };
  
  const submitReview = async (review, productId, orderId) => {
    try {
      let token = localStorage.getItem("token");
      if (!token) {
        token = localStorage.getItem("jwt");
      }
      
      const cleanToken = token?.replace(/^Bearer\s+/i, "");
      
      console.log({
        rating: review.rating,
        review: review.opinion,
        productId,
        orderId,
      });
      
      // Fix: Add /api/v1/ prefix to the endpoint
      const response = await Axios.put(
        "/api/v1/product/review",
        { 
          rating: review.rating, 
          review: review.opinion, 
          productId, 
          orderId 
        },
        {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        }
      );
      
      if (response.data.success) {
        toast.success("Review submitted successfully");
        fetchData(); // Refresh orders
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
      
      setShowModal(false);
    } catch (error) {
      console.error("Submit review error:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
      setShowModal(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="orderMainContainer">
      <h1 className="cHeader">My Orders</h1>
      <div className="orderContainer" style={{ flexDirection: "column" }}>
        <table className="order-table">
          <thead>
            <tr>
              <th
                className="order-subheader order-th"
                style={{ textAlign: "left" }}
              >
                Product Details
              </th>
              <th className="order-subheader order-th">Order Date</th>
              <th className="order-subheader order-th">Status</th>
              <th className="order-subheader order-th">Total Price</th>
            </tr>
          </thead>
          <tbody className="order-table-tbody">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="order-td">
                    {item.items && item.items.length > 0 ? (
                      item.items.map((product, i) => (
                        <div key={product.id || i} className="order-td-div">
                          <div className="cart-product-cont">
                            <div className="cart-image-cont">
                              <img
                                src={product.image || "/placeholder.png"}
                                alt={product.name || "product"}
                                className="cart-image"
                                onError={(e) => {
                                  e.target.src = "/placeholder.png";
                                }}
                              />
                            </div>
                            <div className="cart-product-details">
                              <p
                                className="cart-name-cont"
                                style={{
                                  width: "13rem",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {product.name || "Unknown Product"}
                              </p>
                              <p className="cart-desc-cont">
                                {product.color || "N/A"}, UK {product.size || "N/A"}, {product.qty || 1} unit
                              </p>
                            </div>
                          </div>
                          <div className="order-btn-cont">
                            <button
                              className="cart-delete-btn"
                              disabled={product.isReviewed}
                              style={
                                product.isReviewed
                                  ? { cursor: "not-allowed", opacity: "0.5" }
                                  : {}
                              }
                              onClick={() =>
                                openReviewModal(item.delivered, product.id, item.id)
                              }
                            >
                              {product.isReviewed ? "Reviewed" : "Review"}
                            </button>
                            <button
                              className="cart-delete-btn"
                              onClick={() => navigate(`/product/${product.slug}`)}
                            >
                              Buy Again
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div>No items in this order</div>
                    )}
                  </td>
                  <td className="order-td">
                    {item.createdAt ? new Date(item.createdAt).toDateString() : "N/A"}
                  </td>
                  <td className="order-td">
                    <span style={{
                      color: item.delivered === "Delivered" ? "green" :
                             item.delivered === "Cancelled" ? "red" : "orange",
                      fontWeight: "bold"
                    }}>
                      {item.delivered || "Pending"}
                    </span>
                  </td>
                  <td className="order-td">₹{item.totalPrice || 0}</td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
        
        {(!data || data.length === 0) && (
          <div className="empty-cart">
            <img src={EmptyImage} alt="empty-cart" />
            <p>Looks like you haven't purchased any items yet.</p>
          </div>
        )}
      </div>

      {showModal && (
        <FormReviews
          onClose={() => setShowModal(false)}
          onSubmit={(review) =>
            submitReview(review, currentProductId, currentOrderId)
          }
        />
      )}
    </div>
  );
};

export default MyOrders;