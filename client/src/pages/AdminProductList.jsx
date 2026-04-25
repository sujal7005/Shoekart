import "../styles/order.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TriangleLoader from "../components/TriangleLoader";
import EmptyImage from "../Images/empty-cart.png";
import Axios from "../Axios";
import { toast } from "react-toastify";
import Pagination from "./Pagination";
import { FiSearch } from "react-icons/fi";

const AdminProductList = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debounce, setDebounce] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();
  
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
        navigate("/adminLogin");
        setLoading(false);
        return;
      }
      
      // Match the backend expected parameters
      const response = await Axios.get("/api/v1/admin/products", {
        params: { 
          page: page, 
          limit: limit, 
          searchTerm: debounce || ""  // Send empty string if no search term
        }
      });

      console.log("API Response:", response.data);
      
      // Check if response has the expected structure
      if (response.data.success === true) {
        setData(response.data.products || []);
        setTotalPages(Math.ceil(response.data.count / limit));
      } else {
        setData([]);
        setTotalPages(0);
        toast.error(response.data?.message || "Failed to fetch products");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setData([]);
      setTotalPages(0);
      setLoading(false);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("jwtAdmin");
        navigate("/adminLogin");
      } else {
        toast.error(error?.response?.data?.message || "Error fetching products");
      }
    }
  };

  const updateProductStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const response = await Axios.put(`/api/v1/admin/product/${id}`);
      
      if (response.data.success === true) {
        // Update the local state
        const updatedData = data.map((item) => {
          if (item._id === id) {
            return { ...item, status: newStatus };
          }
          return item;
        });
        setData(updatedData);
        toast.success(response.data.message || "Product status updated");
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Error updating product status");
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounce(searchTerm);
      setPage(1); // Reset to first page when searching
    }, 700);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [page, debounce]);

  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="orderMainContainer">
      <h1 className="cHeader" style={{ textAlign: "left" }}>
        Product List
      </h1>
      <div className="searchBar adminSearchBar">
        <div className="searchForm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="What shoes are you looking for ?"
          />
          <div>
            <FiSearch />
          </div>
        </div>
        <button
          style={{ margin: "0" }}
          onClick={() => navigate("/admin/product/add")}
          className="open-modal cart-delete-btn"
          type="button"
        >
          Add Product
        </button>
      </div>
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
              <th className="order-subheader order-th ">Brand</th>
              <th className="order-subheader order-th ">Size(UK)</th>
              <th className="order-subheader order-th ">Status</th>
              <th className="order-subheader order-th ">Price</th>
              <th className="order-subheader order-th ">Action</th>
            </tr>
          </thead>
          <tbody className="order-table-tbody">
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item._id || index}>
                  <td className="order-td">
                    <div className="order-td-div">
                      <div className="cart-product-cont">
                        <div className="cart-image-cont">
                          <img
                            src={item.image}
                            alt={item.name || "product"}
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
                            {item.name}
                          </p>
                          <p className="cart-desc-cont">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="order-td">{item.brand || "N/A"}</td>
                  <td className="order-td">
                    {item.size ? item.size.split(", ").map((s, i) => (
                      <div key={i}>{s}</div>
                    )) : "N/A"}
                  </td>
                  <td className="order-td">
                    <span style={{
                      color: item.status === "Active" ? "green" : "red",
                      fontWeight: "bold"
                    }}>
                      {item.status || "Inactive"}
                    </span>
                  </td>
                  <td className="order-td">₹{item.price}</td>
                  <td className="order-td">
                    <div
                      className="order-btn-cont"
                      style={{ flexDirection: "column", gap: "5px" }}
                    >
                      <button
                        className="cart-delete-btn"
                        onClick={() =>
                          navigate(`/admin/product/update/${item.slug}`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="cart-delete-btn"
                        onClick={() => updateProductStatus(item._id, item.status)}
                      >
                        {item.status === "Active" ? "Deactivate" : "Activate"}
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
            <p>No products have been added yet. Start adding some!</p>
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

export default AdminProductList;