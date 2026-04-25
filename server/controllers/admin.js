const user = require("../models/user");
const asyncErrorHandler = require("../middleware/asyncErrorHandler");
const errorHandler = require("../utils/errorHandler");
const order = require("../models/order");
const product = require("../models/product");
const Stripe = require("stripe");
const brands = require("../models/brands");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const getAllUsers = asyncErrorHandler(async (req, res) => {
  const users = await user
    .find({ role: "user" })
    .select("name email createdAt");
  const maxIndex = Math.max(users.length, 100);
  const usersWithFormattedDate = users.map((user) => ({
    ...user._doc,
    createdAt: new Date(user.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    index: `#${(users.indexOf(user) + 1)
      .toString()
      .padStart(maxIndex.toString().length, "0")}`,
  }));
  res.status(200).json({
    success: true,
    users: usersWithFormattedDate,
  });
});

const getAllOrders = asyncErrorHandler(async (req, res) => {
  console.log("Fetching all orders");
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const orders = await order
    .find()
    .populate({
      path: "userId",
      select: "name email",
    })
    .populate({
      path: "products.productId",
      select: "name price brand image slug color",
    })
    .sort("-createdAt")
    .skip(skip)
    .limit(parseInt(limit));

  const count = await order.countDocuments();
  
  // Safely map orders with null checks
  const ordersWithFormattedDate = orders.map((orderItem) => {
    // Safely get user name with fallback
    const userName = orderItem.userId?.name || "Deleted User";
    
    // Safely map products
    const productsList = orderItem.products?.map((product) => {
      // Check if productId exists (not null)
      if (!product.productId) {
        return {
          _id: product._id,
          name: "Product Unavailable",
          desc: `Size: UK ${product.size}, Quantity: ${product.quantity}`,
          image: "/placeholder-image.png",
          slug: "#",
        };
      }
      
      return {
        _id: product._id,
        name: `${product.productId.brand || ""} ${product.productId.name || "Product"}`.trim(),
        desc: `${product.productId.color || "N/A"}, UK ${product.size}, ${product.quantity} unit`,
        image: product.productId.image || "/placeholder-image.png",
        slug: product.productId.slug || "#",
      };
    }) || [];
    
    return {
      _id: orderItem._id,
      user: userName,
      products: productsList,
      total: orderItem.total || 0,
      delivered: orderItem.delivery_status || "pending",
      paymentId: orderItem.paymentIntentId || "",
      createdAt: orderItem.createdAt ? new Date(orderItem.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) : "N/A",
    };
  });
  
  res.status(200).json({
    success: true,
    orders: ordersWithFormattedDate,
    count,
  });
});

const updateOrderStatus = asyncErrorHandler(async (req, res) => {
  const { id, status, paymentId } = req.body;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
  }
  
  const updatedOrder = await order.findByIdAndUpdate(
    id, 
    { delivery_status: status },
    { new: true }
  );
  
  if (!updatedOrder) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }
  
  if (status === "Cancelled" && paymentId) {
    try {
      await stripe.refunds.create({ payment_intent: paymentId });
    } catch (error) {
      console.error("Refund failed:", error);
      // Continue even if refund fails
    }
  }

  res.status(200).json({
    success: true,
    message: "Order status updated successfully.",
  });
});

const getCoupons = asyncErrorHandler(async (req, res) => {
  const coupons = await stripe.coupons.list({
    limit: 100,
  });
  data = coupons.data.map((coupon) => ({
    id: coupon.id,
    percent_off: coupon.percent_off,
    duration:
      coupon.duration == "repeating"
        ? coupon.duration_in_months
        : coupon.duration,
    duration_in_months: coupon.duration_in_months,
    max_redemptions: coupon.max_redemptions || 999,
    redemption_left: `${coupon.times_redeemed}/${
      coupon.max_redemptions || "∞"
    }`,
  }));

  res.status(200).json({
    success: true,
    data,
  });
});

const createCoupon = asyncErrorHandler(async (req, res) => {
  const {
    name,
    discount: percent_off,
    duration,
    duration_in_months,
    max_redemptions,
  } = req.body.formData;
  const couponData = {
    id: name.toUpperCase(),
    name: name.toUpperCase(),
    duration: duration === "forever" ? "forever" : "repeating",
    percent_off,
    max_redemptions,
  };

  if (duration !== "forever") {
    couponData.duration_in_months = duration_in_months;
  }

  await stripe.coupons.create(couponData);
  res.status(200).json({
    success: true,
    message: "Coupon created successfully.",
  });
});

const deleteCoupon = asyncErrorHandler(async (req, res) => {
  await stripe.coupons.del(req.params.id);
  res.status(200).json({
    success: true,
    message: "Coupon deleted successfully.",
  });
});

const getAllProducts = asyncErrorHandler(async (req, res) => {
  const { page, limit, searchTerm } = req.query;
  const products = await product
    .find({ name: { $regex: searchTerm, $options: "i" } })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort("brand name");

  const count = await product.countDocuments({
    name: { $regex: searchTerm, $options: "i" },
  });

  const formattedList = products.map((product) => ({
    _id: product._id,
    image: product.image,
    name: product.name,
    desc: `${(product.ratingScore / product.ratings.length || 0).toFixed(
      1
    )} stars, ${product.color}`,
    size: product.sizeQuantity
      .map((size) => `${size.size} (${size.quantity} unit)`)
      .join(", "),
    brand: product.brand,
    status: product.isActive ? "Active" : "Inactive",
    price: product.price,
    slug: product.slug,
  }));
  res.status(200).json({
    success: true,
    count,
    products: formattedList,
  });
});

const productStatus = asyncErrorHandler(async (req, res) => {
  const currentProduct = await product.findById(req.params.id);
  const productBrand = await brands.findOne({ name: currentProduct.brand });
  productBrand.activeProducts += currentProduct.isActive ? -1 : 1;
  currentProduct.isActive = !currentProduct.isActive;
  await currentProduct.save();
  await productBrand.save();
  res.status(200).json({
    success: true,
    message: "Product status updated successfully.",
  });
});

const getAdminDetails = asyncErrorHandler(async (req, res) => {
  const label1 = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const data1 = [];
  const label2 = ["Pending", "Delivered", "Cancelled"];
  const data2 = [];
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );
  
  // Get orders data for the year
  const ordersData = await order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalSales: { $sum: "$total" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Fill data for all 12 months
  Array.from({ length: 12 }, (_, i) => {
    const monthData = ordersData.find((data) => data._id === i + 1);
    if (monthData) {
      data1.push(Number(monthData.totalSales).toFixed(2));
    } else {
      data1.push(0);
    }
  });

  // Get order status counts for current month
  const orderUpdate = await order.aggregate([
    {
      $match: {
        createdAt: {
          $gt: firstDayOfMonth,
          $lte: firstDayOfNextMonth,
        },
      },
    },
    {
      $group: {
        _id: "$delivery_status",
        count: { $sum: 1 },
      },
    },
  ]);

  label2.forEach((status) => {
    const matchingOrderUpdate = orderUpdate.find(
      (data) => data._id && data._id.toLowerCase() === status.toLowerCase()
    );

    if (matchingOrderUpdate) {
      data2.push(matchingOrderUpdate.count);
    } else {
      data2.push(0);
    }
  });
  
  // Get total counts with fallbacks
  const totalUsers = await user.countDocuments({ role: "user" }) || 0;
  const totalOrders = await order.countDocuments() || 0;
  const totalProducts = await product.countDocuments() || 0;
  
  // Get total sales with proper error handling
  const totalSales = await order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$total" },
      },
    },
  ]);
  
  // FIX: Check if totalSales array has data before accessing
  const totalSalesValue = totalSales && totalSales.length > 0 && totalSales[0].total 
    ? totalSales[0].total.toFixed(2) 
    : "0.00";
  
  res.status(200).json({
    success: true,
    bar1: { labels: label1, data: data1 },
    bar2: { labels: label2, data: data2 },
    totalUsers,
    totalOrders,
    totalProducts,
    totalSales: totalSalesValue,
  });
});

module.exports = {
  getAllUsers,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  productStatus,
  getAdminDetails,
};
