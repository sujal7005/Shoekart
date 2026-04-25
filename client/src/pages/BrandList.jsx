import React, { useEffect, useState } from "react";
import CustomerTable from "../components/CustomerTable";
import { toast } from "react-toastify";
import Axios from "../Axios";
import TriangleLoader from "../components/TriangleLoader";

const BrandList = () => {
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
      
      const response = await Axios.get("/api/v1/brands", {
        headers: {
          Authorization: `Bearer ${token}`,  // Add Bearer prefix
        },
      });
      console.log(response.data);
      if (response.data.success) {
        setData(response.data.brands);
      }
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch brands");
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
      Header: "Email",
      accessor: "email",
    },
    {
      Header: "Active Products",
      accessor: "activeProducts",
    },
    {
      Header: "Total Products",
      accessor: "totalProducts",
    },
  ];

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    email: "",
    isActivate: true,
  });

  const handleChange = (row) => {
    setFormData({
      id: row._id,
      name: row.name,
      description: row.description,
      email: row.email,
      isActivate: row.isActivate,
    });
  };
  
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      email: "",
      isActivate: true,
    });
  };

  const handleUpdate = (id) => async () => {
    try {
      if (!id) {
        toast.error("Please select a brand to update.");
        return;
      }
      
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied.");
        return;
      }
      
      token = token.replace(/^Bearer\s+/i, "");
      
      const response = await Axios.put(
        `/api/v1/brands/${id}`,
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Add Bearer prefix
          },
        }
      );
      
      toast.success(response.data.message);
      setData(response.data.brands);
      resetForm();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Failed to update brand");
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
      if (!formData.name || !formData.description || !formData.email) {
        toast.error("Please fill all the fields.");
        return;
      }
      
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied.");
        return;
      }
      
      token = token.replace(/^Bearer\s+/i, "");
      
      const response = await Axios.post(
        "/api/v1/brands",
        { ...formData },
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Add Bearer prefix
          },
        }
      );
      
      toast.success(response.data.message);
      fetch(); // Refresh the list
      resetForm();
    } catch (error) {
      console.error("Create error:", error);
      toast.error(error?.response?.data?.message || "Failed to create brand");
    }
  };
  
  // Add delete functionality if needed
  const deleteBrand = async (id) => {
    try {
      if (!id) {
        toast.error("Please select a brand to delete.");
        return;
      }
      
      let token = localStorage.getItem("jwtAdmin");
      if (!token) {
        toast.error("Access denied.");
        return;
      }
      
      token = token.replace(/^Bearer\s+/i, "");
      
      const response = await Axios.delete(`/api/v1/brands/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      toast.success(response.data.message);
      fetch(); // Refresh the list
      resetForm();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete brand");
    }
  };
  
  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="dashboardMain">
      <h1>Brands</h1>
      <div className="dashOverview dash-forms">
        <form onSubmit={handleFormSubmit}>
          <div className="inputs">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                placeholder="Enter brand name"
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
                placeholder="Enter brand description"
                onChange={handleInputChange}
                value={formData.description}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter brand email"
                onChange={handleInputChange}
                value={formData.email}
              />
            </div>
            <div className="form-group">
              <label htmlFor="isActivate">Status</label>
              <select
                className="form-control"
                id="isActivate"
                onChange={handleInputChange}
                value={formData.isActivate}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="inputs-btn">
            <button type="button" onClick={handleUpdate(formData.id)}>
              Update
            </button>
            <button type="button" onClick={() => deleteBrand(formData.id)}>
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

export default BrandList;