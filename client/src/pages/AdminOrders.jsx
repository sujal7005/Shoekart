import "../styles/order.css";
import { useEffect, useState } from "react";
import TriangleLoader from "../components/TriangleLoader";
import EmptyImage from "../Images/empty-cart.png";
import Axios from "../Axios";
import { toast } from "react-toastify";
import Pagination from "./Pagination";

const AdminOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [totalPages, setTotalPages] = useState(0);
  
  const canPreviousPage = page > 1;
  const canNextPage = page < totalPages;
  
  const gotoPage = (p) => {
    setPage(p);
  };
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jwtAdmin");
      
      if (!token) {
        toast.error("Access denied. Please login again.");
        setLoading(false);
        return;
      }
      
      // Make sure the endpoint matches your server route
      const response = await Axios.get("/api/v1/admin/order", {
        params: { limit, page },
        headers: {
          Authorization: `Bearer ${token}`, // Add Bearer prefix if needed
        },
      });

      console.log("API Response:", response.data);
      
      // Handle different response structures
      if (response.data && response.data.success !== false) {
        const orders = response.data.orders || response.data.data || [];
        const count = response.data.count || response.data.total || orders.length;
        
        setData(orders);
        setTotalPages(Math.ceil(count / limit));
      } else {
        setData([]);
        setTotalPages(0);
        toast.error(response.data?.message || "Failed to fetch orders");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setData([]);
      setTotalPages(0);
      setLoading(false);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("jwtAdmin");
        // Navigate to admin login if you have a separate admin login route
        // navigate("/admin/login");
      } else {
        toast.error(error?.response?.data?.message || "Error fetching orders");
      }
    }
  };

  const updateOrderStatus = async (id, status, paymentId) => {
    try {
      const token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied. Please login again.");
        return;
      }
      
      const response = await Axios.put(
        "/api/v1/admin/order",
        { id, status, paymentId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        // Update the local state correctly
        const updatedData = data.map((item) => {
          if (item._id === id) {
            return { ...item, delivered: status };
          }
          return item;
        });
        setData(updatedData);
        toast.success(response.data.message || "Order status updated");
      } else {
        toast.error(response.data.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Error updating order status");
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [page]);

  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="orderMainContainer">
      <h1 className="cHeader" style={{ textAlign: "left" }}>
        Orders List
      </h1>
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
              <th className="order-subheader order-th ">Customer</th>
              <th className="order-subheader order-th ">Order Date</th>
              <th className="order-subheader order-th ">Status</th>
              <th className="order-subheader order-th ">Total Price</th>
              <th className="order-subheader order-th ">Action</th>
            </tr>
          </thead>
          <tbody className="order-table-tbody">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item._id || index}>
                  <td className="order-td">
                    {item.products && item.products.length > 0 ? (
                      item.products.map((product, idx) => (
                        <div key={product._id || idx} className="order-td-div">
                          <div className="cart-product-cont">
                            <div className="cart-image-cont">
                              <img
                                src={product.image || "/placeholder-image.png"}
                                alt={product.name || "product"}
                                className="cart-image"
                                onError={(e) => {
                                  e.target.src = "/placeholder-image.png";
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
                                {product.name || "Unnamed Product"}
                              </p>
                              <p className="cart-desc-cont">
                                {product.desc || "No description"}
                              </p>
                              <p className="cart-price-cont">
                                Qty: {product.qty || product.quantity || 1} | 
                                Size: {product.size || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div>No products in this order</div>
                    )}
                  </td>
                  <td className="order-td">
                    {item.user?.name || item.user || "N/A"}
                  </td>
                  <td className="order-td">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="order-td">
                    <span className={item.delivered === "Delivered" ? "status-delivered" : 
                                   item.delivered === "Cancelled" ? "status-cancelled" : 
                                   "status-pending"}>
                      {item.delivered || "pending"}
                    </span>
                  </td>
                  <td className="order-td">
                    ₹{item.total || item.totalPrice || 0}
                  </td>
                  <td className="order-td">
                    <div
                      className="order-btn-cont"
                      style={{ flexDirection: "column" }}
                    >
                      <button
                        className="cart-delete-btn"
                        disabled={item.delivered !== "pending"}
                        style={
                          item.delivered !== "pending"
                            ? { cursor: "not-allowed", opacity: "0.5" }
                            : {}
                        }
                        onClick={() =>
                          updateOrderStatus(item._id, "Delivered", item.paymentId)
                        }
                      >
                        Mark as Delivered
                      </button>
                      <button
                        className="cart-delete-btn"
                        disabled={item.delivered !== "pending"}
                        style={
                          item.delivered !== "pending"
                            ? { cursor: "not-allowed", opacity: "0.5" }
                            : {}
                        }
                        onClick={() =>
                          updateOrderStatus(item._id, "Cancelled", item.paymentId)
                        }
                      >
                        Cancel Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
        
        {(!data || data.length === 0) && (
          <div className="empty-cart">
            <img src={EmptyImage} alt="empty-cart" />
            <p>No orders have been placed yet.</p>
          </div>
        )}
      </div>
      
      {totalPages > 0 && (
        <Pagination
          totalPageCount={totalPages}
          previousPage={() => setPage(page - 1)}
          canPreviousPage={canPreviousPage}
          nextPage={() => setPage(page + 1)}
          canNextPage={canNextPage}
          gotoPage={gotoPage}
          pageIndex={page - 1}
        />
      )}
    </div>
  );
};

export default AdminOrders;