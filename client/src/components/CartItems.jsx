// client/src/components/CartItems.jsx
import { AiFillDelete, AiFillHeart } from "react-icons/ai";
import { HiMinusCircle, HiPlusCircle } from "react-icons/hi";
import { Link } from "react-router-dom";
import { memo, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Axios from "../Axios";
import useAuth from "../../hooks/useAuth";

const CartItems = ({ cartId, data, qty, size, deleteItem, updateData }) => {
  const [currentQty, setCurrentQty] = useState(qty);
  const [debounceQty, setDebounceQty] = useState(null);
  const { auth, setAuth } = useAuth();
  const firstUpdate = useRef(true);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      console.log("debounce");
      if (firstUpdate.current) {
        firstUpdate.current = false;
        return;
      }
      setDebounceQty(currentQty);
    }, 450);
    return () => {
      clearTimeout(handler);
    };
  }, [currentQty]);
  
  const changeQty = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }
      
      const cleanToken = token.replace(/^Bearer\s+/i, "");
      
      const response = await Axios.put(
        `/api/v1/cart/update/${cartId}`, // Added /api/v1/ prefix
        {
          qty: debounceQty,
        },
        {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        }
      );
      
      console.log(response.data);
      updateData(response.data.cart);
      toast.success("Quantity updated successfully");
      
      if (setAuth && auth) {
        setAuth({ ...auth, cartSize: (auth.cartSize || 0) - qty + debounceQty });
      }
    } catch (error) {
      console.error("Update quantity error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };
  
  useEffect(() => {
    if (debounceQty !== null) {
      changeQty();
    }
  }, [debounceQty]);
  
  return (
    <tr>
      <td>
        <div className="cart-product-cont">
          <div className="cart-image-cont">
            <Link
              to={`/product/${data.slug}`}
              style={{ textDecoration: "none" }}
            >
              <img src={data.image} alt="cart-img" />
            </Link>
          </div>
          <div className="cart-name-cont">
            <p style={{ textAlign: "left" }}>
              {data.brand} {data.name}
            </p>
            <div className="cart-name-cont-btn">
              <button onClick={deleteItem}>
                <AiFillDelete /> delete item
              </button>
              <button>
                <AiFillHeart /> move to favorite
              </button>
            </div>
          </div>
        </div>
        <div className="cart-mobile-info">
          <p>Size: {size}</p>
          <p>Quantity: {qty}</p> {/* Fixed: was showing size instead of qty */}
          <p>Price: ₹ {data.price}/item</p>
        </div>
      </td>
      <td className="cart-subheader">
        <p>{size}</p>
      </td>
      <td className="td-qty cart-subheader">
        <div>
          <button
            onClick={() =>
              setCurrentQty((prev) => (prev > 0 ? prev - 1 : prev))
            }
          >
            <HiMinusCircle />
          </button>
          <p>{currentQty}</p>
          <button onClick={() => setCurrentQty((prev) => prev + 1)}>
            <HiPlusCircle />
          </button>
        </div>
      </td>
      <td className="cart-subheader">
        <p>₹ {qty * data.price}</p>
      </td>
    </tr>
  );
};

export default memo(CartItems);