const Order = require("../models/orderModel");

const computeTotals = (items, discountType, discountValue, taxPercent) => {
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const discount =
    discountType === "percent"
      ? (subtotal * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const taxable = subtotal - safeDiscount;
  const tax = (taxable * Number(taxPercent || 0)) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(safeDiscount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((taxable + tax) * 100) / 100,
  };
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addOrder = async (req, res) => {
  try {
    const {
      table,
      server,
      guests,
      items,
      orderType,
      customer,
      notes,
      discount,
      discountType,
      taxPercent,
      paymentMethod,
      splitWays,
      time,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    const type = orderType || "dine-in";
    if (type === "dine-in" && !table) {
      return res.status(400).json({ error: "Select a table for dine-in orders" });
    }

    const lastOrder = await Order.findOne({ userId: req.user.id }).sort({ orderId: -1 });
    const orderId = lastOrder ? lastOrder.orderId + 1 : 1001;

    const orderItems = items.map((i) => ({
      name: i.name,
      qty: Number(i.qty) || 1,
      variant: i.variant || "",
      price: Number(i.price) || 0,
      status: "pending",
    }));

    const totals = computeTotals(orderItems, discountType, discount, taxPercent);

    const settled = paymentMethod === "cash" || paymentMethod === "card";

    const order = new Order({
      userId: req.user.id,
      orderId,
      invoiceNo: `INV-${orderId}`,
      table: type === "takeaway" ? "Takeaway" : table,
      server: server || "",
      guests: Number(guests) || 1,
      orderType: type,
      customer: {
        name: customer?.name || "Walk-in",
        phone: customer?.phone || "",
      },
      items: orderItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      discountType: discountType || "",
      tax: totals.tax,
      taxPercent: Number(taxPercent) || 0,
      total: totals.total,
      notes: notes || "",
      paymentMethod: settled ? paymentMethod : "",
      status: settled ? "settled" : "active",
      splitWays: Number(splitWays) || 1,
      time:
        time ||
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      settledAt: settled ? new Date() : null,
    });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error("Add Order Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const order = await Order.findOne({ _id: id, userId: req.user.id });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (updates.items && Array.isArray(updates.items)) {
      const items = updates.items.map((i) => ({
        name: i.name,
        qty: Number(i.qty) || 1,
        variant: i.variant || "",
        price: Number(i.price) || 0,
        status: i.status || "pending",
      }));
      const totals = computeTotals(
        items,
        updates.discountType !== undefined ? updates.discountType : order.discountType,
        updates.discount !== undefined ? updates.discount : order.discount,
        updates.taxPercent !== undefined ? updates.taxPercent : order.taxPercent
      );
      updates.items = items;
      updates.subtotal = totals.subtotal;
      updates.discount = totals.discount;
      updates.tax = totals.tax;
      updates.total = totals.total;
    }

    if (updates.discount !== undefined || updates.discountType !== undefined) {
      const discountType = updates.discountType !== undefined ? updates.discountType : order.discountType;
      const discountValue = updates.discount !== undefined ? updates.discount : order.discount;
      const totals = computeTotals(
        order.items,
        discountType,
        discountValue,
        updates.taxPercent !== undefined ? updates.taxPercent : order.taxPercent
      );
      updates.discount = totals.discount;
      updates.discountType = discountType;
      updates.subtotal = totals.subtotal;
      updates.tax = totals.tax;
      updates.total = totals.total;
    }

    if (updates.status === "settled") {
      updates.paymentMethod = updates.paymentMethod || order.paymentMethod || "cash";
      updates.settledAt = new Date();
    }

    if (updates.status && updates.status !== "settled" && updates.status !== "cancelled") {
      updates.settledAt = null;
    }

    Object.assign(order, updates);
    await order.save();

    res.status(200).json(order);
  } catch (err) {
    console.error("Update Order Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete Order Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getOrders, addOrder, updateOrder, deleteOrder };
