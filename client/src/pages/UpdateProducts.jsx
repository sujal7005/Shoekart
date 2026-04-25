import React, { useEffect, useState } from "react";
import ProductForm from "../components/ProductForm";
import Axios from "../Axios";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import TriangleLoader from "../components/TriangleLoader";

const UpdateProducts = () => {
  const { slug } = useParams();
  const [data, setData] = useState({
    name: "",
    desc: "",
    sku: "",
    price: "",
    color: "",
    brand: "",
    material: "",
    category: "",
    featured: "false",
  });
  const [link, setLink] = useState(null);
  const [fields, setFields] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // FIX: Add /api/v1/ prefix to the endpoint
        const response = await Axios.get(`/api/v1/product/${slug}`);
        console.log("Product data:", response.data);
        
        const productData = response.data.data || response.data;
        
        setLink(productData.image);
        
        const newFields = [];
        if (productData.sizeQuantity && productData.sizeQuantity.length > 0) {
          productData.sizeQuantity.forEach((field) => {
            const sizeIndex = field.size - 3;
            if (sizeIndex >= 0 && sizeIndex < 12) {
              newFields[sizeIndex] = {
                size: field.size,
                quantity: field.quantity,
              };
            }
          });
        }
        setFields(newFields);
        
        setData({
          name: productData.name || "",
          desc: productData.description || productData.desc || "",
          sku: productData.sku || "",
          price: productData.price || "",
          color: productData.color || "",
          brand: productData.brand || "",
          material: productData.material || "",
          category: productData.category || "",
          featured: productData.isFeatured ? "true" : "false",
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Fetch product error:", error);
        toast.error(error?.response?.data?.message || "Failed to fetch product", {
          position: "bottom-right",
        });
        navigate("/admin/products");
      }
    };
    
    fetchProduct();
  }, [slug, navigate]);

  const changeFields = (e) => {
    setFields(e);
  };

  const changeLink = (e) => {
    setLink(e);
  };
  
  const changeCategory = (e) => {
    setData({ ...data, category: e });
  };
  
  const handleInputChange = (event) => {
    setData({ ...data, [event.target.id]: event.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied. Please login again.");
        navigate("/adminLogin");
        return;
      }
      
      // Clean token
      token = token.replace(/^Bearer\s+/i, "");
      
      const validFields = fields.filter((field) => field && field.quantity > 0);
      
      console.log("Submitting product update:", { 
        ...data, 
        sizeQuantity: validFields, 
        image: link 
      });
      
      if (validFields.length === 0) {
        toast.error("Please add at least one size with quantity");
        return;
      }
      
      if (!data.name || !data.desc || !data.sku || !data.price || 
          !data.color || !data.brand || !data.material || !link) {
        toast.error("Please fill all the fields.");
        return;
      }

      // FIX: Add /api/v1/ prefix to the endpoint
      const response = await Axios.put(
        `/api/v1/product/update/${slug}`,
        { 
          ...data, 
          sizeQuantity: validFields, 
          image: link,
          description: data.desc,
          isFeatured: data.featured === "true"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log("Update response:", response);
      
      if (response.data.success) {
        toast.success(response.data.message || "Product updated successfully");
        navigate("/admin/products");
      } else {
        toast.error(response.data.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };
  
  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="orderMainContainer">
      <h1
        className="cHeader"
        style={{ textAlign: "left", marginBottom: "1rem" }}
      >
        Update Product
      </h1>
      <div className="dashOverview">
        <ProductForm
          link={link}
          changeLink={changeLink}
          data={data}
          handleInputChange={handleInputChange}
          fields={fields}
          changeFields={changeFields}
          name="Update Product"
          changeCategory={changeCategory}
          handleSubmit={handleSubmit}
          handleCancel={() => navigate("/admin/products")}
        />
      </div>
    </div>
  );
};

export default UpdateProducts;