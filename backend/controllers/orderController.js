import Order from '../models/orderModel.js';

export const createOrder = async (req, res) => {
  try {
    const payload = req.body || {};
    const clientOrderId = payload.id || payload.clientOrderId || `ORD-${Date.now()}`;

    const order = await Order.create({
      clientOrderId,
      status: payload.status || 'new',
      paid: !!payload.paid,
      paymentId: payload.paymentId,
      paidAt: payload.paidAt ? new Date(payload.paidAt) : undefined,
      description: payload.description,
      gridTemplate: payload.gridTemplate,
      members: (payload.members || []).map((m, i) => ({
        id: m.id || m.memberRollNumber || `member-${i}-${Date.now()}`,
        name: m.name,
        memberRollNumber: m.memberRollNumber,
        photo: m.photo,
        vote: m.vote,
        joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
        size: m.size,
        phone: m.phone || undefined,
      })),
      shipping: payload.shipping,
      settings: payload.settings,
    });

    return res.status(201).json(order.toJSON());
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(400).json({ message: err.message || 'Failed to create order' });
  }
};

export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paid,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (paid !== undefined) {
      if (paid === 'true' || paid === true) query.paid = true;
      if (paid === 'false' || paid === false) query.paid = false;
    }
    if (search) {
      const s = String(search);
      query.$or = [
        { clientOrderId: { $regex: s, $options: 'i' } },
        { 'shipping.name': { $regex: s, $options: 'i' } },
        { 'shipping.email': { $regex: s, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(limitNum).lean({ virtuals: true }),
      Order.countDocuments(query),
    ]);

    // Map to client Order type
    const orders = data.map((o) => ({
      ...o,
      id: o.clientOrderId || String(o._id),
    }));

    return res.json({ orders, total });
  } catch (err) {
    console.error('getOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Build query based on id format
    let query;
    if (isValidObjectId) {
      query = { $or: [{ clientOrderId: id }, { _id: id }] };
    } else {
      // If not a valid ObjectId, only search by clientOrderId
      query = { clientOrderId: id };
    }
    
    const order = await Order.findOne(query).lean({ virtuals: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json({ ...order, id: order.clientOrderId || String(order._id) });
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ message: 'Failed to fetch order' });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    if (updates.id) delete updates.id;
    if (updates.clientOrderId) delete updates.clientOrderId;

    // Normalize nested fields if provided
    if (updates.members) {
      updates.members = updates.members.map((m) => ({
        id: m.id,
        name: m.name,
        memberRollNumber: m.memberRollNumber,
        photo: m.photo,
        vote: m.vote,
        joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
        size: m.size,
      }));
    }

    if (updates.paidAt) updates.paidAt = new Date(updates.paidAt);
    
    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Build query based on id format
    let query;
    if (isValidObjectId) {
      query = { $or: [{ clientOrderId: id }, { _id: id }] };
    } else {
      // If not a valid ObjectId, only search by clientOrderId
      query = { clientOrderId: id };
    }

    const updated = await Order.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, lean: true }
    );

    if (!updated) return res.status(404).json({ message: 'Order not found' });
    return res.json({ ...updated, id: updated.clientOrderId || String(updated._id) });
  } catch (err) {
    console.error('updateOrder error:', err);
    return res.status(400).json({ message: err.message || 'Failed to update order' });
  }
};

export const exportOrdersCsv = async (req, res) => {
  try {
    const ids = (req.query.ids || '').toString().split(',').filter(Boolean);
    if (!ids.length) return res.status(400).json({ message: 'No order ids provided' });

    const orders = await Order.find({ $or: [{ clientOrderId: { $in: ids } }, { _id: { $in: ids } }] })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    const header = ['Order ID','Customer Name','Status','Paid','Created At','Member Count'];
    const csvEscape = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    const lines = [header.join(',')];
    for (const o of orders) {
      const row = [
        o.clientOrderId || String(o._id),
        o.shipping?.name || '',
        o.status || '',
        o.paid ? 'true' : 'false',
        o.createdAt ? new Date(o.createdAt).toISOString() : '',
        Array.isArray(o.members) ? o.members.length : 0,
      ].map(csvEscape);
      lines.push(row.join(','));
    }
    const csv = lines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error('exportOrdersCsv error:', err);
    return res.status(500).json({ message: 'Failed to export orders' });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // Build query based on id format
    let query;
    if (isValidObjectId) {
      query = { $or: [{ clientOrderId: id }, { _id: id }] };
    } else {
      // If not a valid ObjectId, only search by clientOrderId
      query = { clientOrderId: id };
    }
    
    const deleted = await Order.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: 'Order not found' });
    return res.status(204).send();
  } catch (err) {
    console.error('deleteOrder error:', err);
    return res.status(500).json({ message: 'Failed to delete order' });
  }
};
