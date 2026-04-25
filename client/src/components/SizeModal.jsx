import React, { useRef, useState } from "react";
import MultiSelectBox from "./MultiSelectBox";
import { toast } from "react-toastify";
import Axios from "../Axios";
import useAuth from "../../hooks/useAuth";

const SizeModal = ({ id, size, onClose }) => {
  const { auth, setAuth } = useAuth();
  const modelRef = useRef();
  const [loading, setLoading] = useState(false);
  
  const closeModal = (e) => {
    if (modelRef.current === e.target) {
      onClose();
    }
  };
  
  const sizeOptions = size.map((item) => ({
    value: item.size,
    label: item.size,
  }));
  
  const [sizeSelected, setSizeSelected] = useState("");
  
  const requestData = async () => {
    try {
      if (sizeSelected === "") {
        toast.error("Please select a valid size");
        return;
      }
      
      setLoading(true);
      
      // Get token from localStorage (check both keys)
      let token = localStorage.getItem("token");
      if (!token) {
        token = localStorage.getItem("jwt");
      }
      
      if (!token) {
        toast.error("Please login again");
        onClose();
        return;
      }
      
      // Clean token (remove Bearer prefix if present)
      const cleanToken = token.replace(/^Bearer\s+/i, "");
      
      console.log("Size Selected: ", Number(sizeSelected.value));
      console.log("Product ID: ", id);
      console.log("Token being used:", cleanToken.substring(0, 20) + "...");
      
      // FIX: Add /api/v1/ prefix to the endpoint
      const response = await Axios.post(
        "/api/v1/cart/add",
        {
          productId: id,
          qty: 1,
          size: Number(sizeSelected.value),
        },
        {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        }
      );
      
      console.log("Add to cart response:", response.data);
      
      if (response.data.success === true) {
        toast.success(response?.data?.message || "Added to cart successfully");
        
        // Update cart size in auth context
        if (setAuth && auth) {
          setAuth({ ...auth, cartSize: (auth.cartSize || 0) + 1 });
        } else if (setAuth) {
          // If auth is null, fetch updated cart size
          const cartResponse = await Axios.get("/api/v1/cart", {
            headers: { Authorization: `Bearer ${cleanToken}` }
          });
          if (cartResponse.data) {
            setAuth({ cartSize: cartResponse.data.items?.length || 0 });
          }
        }
        
        onClose();
      } else {
        toast.error(response?.data?.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again");
        localStorage.removeItem("token");
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        onClose();
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Invalid request");
      } else {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={modelRef}
      onClick={closeModal}
      style={{
        background: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(1.5px)",
        boxShadow: "20px 20px 30px rgba(0, 0, 0, 0.06)",
      }}
      className="modal"
    >
      <div className="modal-container">
        <div className="modal-div">
          <h4>Choose Your Perfect Fit Size:</h4>
        </div>
        <div className="modal-div">
          <div className="select-main-box">
            <MultiSelectBox
              multiple={false}
              options={sizeOptions}
              value={sizeSelected}
              onChange={(e) => setSizeSelected(e)}
            />
          </div>
        </div>
        <div className="modal-div">
          <div className="filter-modal-btn">
            <button
              className="btn-filter"
              onClick={() => {
                onClose();
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-filter"
              onClick={() => {
                requestData();
              }}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeModal;