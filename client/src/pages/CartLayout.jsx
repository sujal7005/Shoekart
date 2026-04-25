import "../styles/cartlayout.css";
import CartItems from "../components/CartItems";
import { useCallback, useEffect, useState } from "react";
import Axios from "../Axios";
import useAuth from "../../hooks/useAuth";
import TriangleLoader from "../components/TriangleLoader";
import { toast } from "react-toastify";
import EmptyImage from "../Images/empty-cart.png";

const CartLayout = () => {
  const { auth, setAuth } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);

  // Use "token" instead of "jwt" based on your login code
  const token = localStorage.getItem("token");
  
  const updateData = useCallback(async (e) => {
    setData(e);
  }, []);
  
  const deleteItem = async (id, qty) => {
    try {
      const response = await Axios.delete(`/api/v1/cart/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success === true) {
        toast.success("Product removed from cart successfully");
        setData(response.data.cart);
        if (setAuth && auth) {
          setAuth({ ...auth, cartSize: (auth.cartSize || 0) - qty });
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await Axios.get("/api/v1/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Cart data:", response.data);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Fetch cart error:", error);
      setLoading(false);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  };
  
  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to checkout");
        return;
      }
      
      const response = await Axios.post(
        "/api/v1/payment/create-checkout-session",
        { coupon: appliedCoupon ? couponCode.toUpperCase() : "" },
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );
      console.log(response);

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error?.response?.data?.message || "Checkout failed");
    }
  };
  
  const applyCoupon = (coupon) => {
    if (!data || !data.items || data.items.length <= 0) {
      return toast.error("Cart is empty.");
    }
    console.log(coupon.toUpperCase());
    const listOfCoupons = ["SUMILSUTHAR197", "NIKE2024"];
    if (listOfCoupons.includes(coupon.toUpperCase())) {
      setCouponCode(coupon);
      setAppliedCoupon(true);
      toast.success("Coupon applied successfully!");
    } else {
      toast.error("Invalid coupon code.");
    }
  };
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token === null) {
      setLoading(false);
      return;
    }
    console.log("cart layout");
    fetchData();
  }, []);
  
  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="cartMainContainer">
      <h1 className="cHeader">Shopping Cart</h1>
      <div className="cartContainer">
        <div className="cart-container-1">
          <table className="cart-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Product</th>
                <th className="cart-subheader">Size</th>
                <th className="cart-subheader">Quantity</th>
                <th className="cart-subheader">Total Price</th>
              </tr>
            </thead>
            <tbody className="cart-table-tbody">
              {data && data.items && data.items.length > 0 ? (
                data.items.map((item) => {
                  return (
                    <CartItems
                      key={item._id}
                      cartId={item._id}
                      data={item.productId}
                      qty={item.qty}
                      size={item.size}
                      updateData={updateData}
                      deleteItem={() => deleteItem(item._id, item.qty)}
                    />
                  );
                })
              ) : null}
            </tbody>
          </table>
          
          {(!data || !data.items || data.items.length <= 0) && (
            <div className="empty-cart">
              <img src={EmptyImage} alt="empty-cart" />
              <p>Looks like you haven't added any items to the cart yet.</p>
            </div>
          )}
        </div>
        <div className="cart-container-2">
          <div className="cartSummary">
            <h3 className="summaryHeader">Order Summary</h3>
            <div className="summaryInfo">
              <p>
                <span>Sub Total</span>
                <span>
                  ₹{" "}
                  {((data?.totalPrice || 0) - (data?.totalPrice || 0) * 0.12).toFixed(2)}
                </span>
              </p>
              <p>
                <span>Tax</span>
                <span>₹ {((data?.totalPrice || 0) * 0.12).toFixed(2)}</span>
              </p>
              <p>
                <span>Shipping Charge</span>
                <span>Free</span>
              </p>
              <p>
                <span>Giftcard/Discount code</span>
              </p>
              <div className="couponInput">
                <input
                  type="text"
                  name="couponCode"
                  id="couponCode"
                  value={couponCode}
                  disabled={appliedCoupon}
                  className={appliedCoupon ? "disabled" : ""}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon Code"
                />
                <button
                  type="button"
                  disabled={appliedCoupon}
                  className={appliedCoupon ? "disabledBtn" : ""}
                  onClick={() => applyCoupon(couponCode)}
                >
                  Apply
                </button>
              </div>
              <p className="cart-total">
                <span>Total</span>
                <span>₹ {(data?.totalPrice || 0).toFixed(2)}</span>
              </p>
            </div>
            <button
              onClick={() => handleCheckout()}
              type="submit"
              className={
                !data || !data.items || data.items.length <= 0 || !auth
                  ? "checkout-btn disabled"
                  : "checkout-btn"
              }
              disabled={!data || !data.items || data.items.length <= 0 || !auth}
            >
              checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartLayout;