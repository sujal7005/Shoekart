import React, { useEffect, useState } from "react";
import "../styles/adminDashboard.css";
import DashCard from "../components/DashCard";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import Axios from "../Axios";
import { toast } from "react-toastify";
import TriangleLoader from "../components/TriangleLoader";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
  ArcElement,
  Legend
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bar1: { labels: [], data: [] },
    bar2: { labels: [], data: [] },
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalSales: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("jwtAdmin");
        
        if (!token) {
          toast.error("Access denied. Please login first.");
          setLoading(false);
          return;
        }
        
        // Clean token (remove Bearer prefix if present)
        const cleanToken = token.replace(/^Bearer\s+/i, "");
        
        const res = await Axios.get("/api/v1/admin/info", {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        });
        
        console.log("Dashboard API response:", res.data);
        
        // Check if response has the expected structure
        if (res.data && res.data.success === true) {
          // Handle different possible response structures
          const dashboardData = res.data;
          
          // Safely extract bar1 data
          const bar1Labels = dashboardData.bar1?.labels || [];
          const bar1Data = dashboardData.bar1?.data || [];
          
          // Safely extract bar2 data
          const bar2Labels = dashboardData.bar2?.labels || [];
          const bar2Data = dashboardData.bar2?.data || [];
          
          setData({
            bar1: { 
              labels: bar1Labels, 
              data: bar1Data.map(item => Number(item)) 
            },
            bar2: { 
              labels: bar2Labels, 
              data: bar2Data.map(item => Number(item)) 
            },
            totalUsers: dashboardData.totalUsers || 0,
            totalOrders: dashboardData.totalOrders || 0,
            totalProducts: dashboardData.totalProducts || 0,
            totalSales: dashboardData.totalSales || 0,
          });
        } else if (res.data && !res.data.success) {
          toast.error(res.data.message || "Failed to fetch dashboard data");
        } else {
          // If response doesn't have success property but has data directly
          setData({
            bar1: { 
              labels: res.data.bar1?.labels || [], 
              data: res.data.bar1?.data?.map(item => Number(item)) || [] 
            },
            bar2: { 
              labels: res.data.bar2?.labels || [], 
              data: res.data.bar2?.data?.map(item => Number(item)) || [] 
            },
            totalUsers: res.data.totalUsers || 0,
            totalOrders: res.data.totalOrders || 0,
            totalProducts: res.data.totalProducts || 0,
            totalSales: res.data.totalSales || 0,
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          localStorage.removeItem("jwtAdmin");
          localStorage.removeItem("adminInfo");
          window.location.href = "/adminLogin";
        } else {
          toast.error(error.response?.data?.message || "Something went wrong");
        }
        
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Prepare chart data with fallbacks
  const data1 = {
    labels: data.bar1.labels || [],
    datasets: [
      {
        data: data.bar1.data || [],
        backgroundColor: "#28A745",
        label: "Amount",
      },
    ],
  };
  
  const data2 = {
    labels: data.bar2.labels || [],
    datasets: [
      {
        data: data.bar2.data || [],
        backgroundColor: ["#FFC107", "#28A745", "red", "#DC3545"],
        label: "No of Orders",
      },
    ],
  };
  
  const options1 = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Monthly Sales Amount for the Current Year",
      },
    },
  };
  
  const options2 = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Percentage Distribution of Order Status for Current Month",
      },
    },
  };
  
  if (loading) return <TriangleLoader height="500px" />;
  
  return (
    <div className="dashboardMain">
      <h1>Dashboard</h1>
      <div className="dashOverview">
        <DashCard title="Total Users" amount={data.totalUsers} />
        <DashCard title="Total Orders" amount={data.totalOrders} />
        <DashCard title="Total Products" amount={data.totalProducts} />
        <DashCard title="Total Sales" amount={`₹${data.totalSales}`} />
      </div>
      <div className="graphBox">
        <div className="graph-box box-1">
          <Doughnut data={data2} options={options2} />
        </div>
        <div className="graph-box box-2">
          <Bar data={data1} options={options1} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;