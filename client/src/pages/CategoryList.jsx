import React, { useEffect, useState } from "react";
import CustomerTable from "../components/CustomerTable";
import { toast } from "react-toastify";
import Axios from "../Axios";
import TriangleLoader from "../components/TriangleLoader";

const CategoryList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetch = async () => {
    try {
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied. Please login first.");
        setLoading(false);
        return;
      }
      
      // Clean token (remove Bearer prefix if present)
      token = token.replace(/^Bearer\s+/i, "");
      
      // FIX: Remove '/admin' from the path - use '/api/v1/category'
      const response = await Axios.get("/api/v1/category", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      if (response.data.success) {
        setData(response.data.categories || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch categories");
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetch();
  }, []);
  
  const columns = [
    {
      Header: "Name",
      accessor: "name",
    },
    {
      Header: "Description",
      accessor: "description",
    },
  ];

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
  });

  const handleChange = (row) => {
    setFormData({ id: row._id, name: row.name, description: row.description });
  };
  
  const resetForm = () => {
    setFormData({ id: "", name: "", description: "" });
  };

  const handleUpdate = (id) => async () => {
    try {
      if (!id) {
        toast.error("Please select a category to update.");
        return;
      }
      
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied.");
        return;
      }
      
      token = token.replace(/^Bearer\s+/i, "");
      
      // FIX: Remove '/admin' from the path
      const response = await Axios.put(
        `/api/v1/category/${id}`,
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success(response.data.message);
      setData(response.data.categories);
      resetForm();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Failed to update category");
      resetForm();
    }
  };

  const handleInputChange = (event) => {
    setFormData({
      ...formData,
      [event.target.id]: event.target.value,
    });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!formData.name || !formData.description) {
        toast.error("Please fill all the fields.");
        return;
      }
      
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied.");
        return;
      }
      
      token = token.replace(/^Bearer\s+/i, "");
      
      // FIX: Remove '/admin' from the path
      const response = await Axios.post(
        "/api/v1/category",
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast.success(response.data.message);
      fetch(); // Refresh the list
      resetForm();
    } catch (error) {
      console.error("Create error:", error);
      toast.error(error?.response?.data?.message || "Failed to create category");
    }
  };
  
  const deleteCategory = async (id) => {
    try {
      if (!id) {
        toast.error("Please select a category to delete.");
        return;
      }
      
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied.");
        return;
      }
      
      token = token.replace(/^Bearer\s+/i, "");
      
      // FIX: Remove '/admin' from the path
      const response = await Axios.delete(`/api/v1/category/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      toast.success(response.data.message);
      fetch(); // Refresh the list
      resetForm();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete category");
    }
  };
  
  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="dashboardMain">
      <h1>Category</h1>
      <div className="dashOverview dash-forms">
        <form onSubmit={handleFormSubmit}>
          <div className="inputs">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                placeholder="Enter category name"
                onChange={handleInputChange}
                value={formData.name}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                className="form-control"
                id="description"
                placeholder="Enter category description"
                onChange={handleInputChange}
                value={formData.description}
              />
            </div>
          </div>
          <div className="inputs-btn">
            <button type="button" onClick={handleUpdate(formData.id)}>
              Update
            </button>
            <button type="button" onClick={() => deleteCategory(formData.id)}>
              Delete
            </button>
            <button type="submit">Add</button>
          </div>
        </form>
      </div>
      <div className="dashOverview" style={{ overflow: "auto" }}>
        <CustomerTable
          columns={columns}
          data={data}
          handleChange={handleChange}
        />
      </div>
    </div>
  );
};

export default CategoryList;