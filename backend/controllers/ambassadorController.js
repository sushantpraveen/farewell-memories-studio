import mongoose from "mongoose";
import Ambassador from "../models/ambassadorModel.js";
import AmbassadorReward from "../models/ambassadorRewardModel.js";
import Group from "../models/groupModel.js";
import { getAmbassadorStats } from "../services/statsService.js";
import { listRewardsByAmbassador } from "../services/rewardService.js";

// List ambassadors with aggregated reward totals (admin)
export const listAmbassadors = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } }
      ];
    }

    // Basic ambassador list with search
    const items = await Ambassador.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Ambassador.countDocuments(searchQuery);

    // Collect IDs for reward aggregation
    const ids = items.map(a => a._id.toString());

    // ---------- REWARDS AGGREGATION (PAID + PENDING) ----------
    // Convert ObjectIds to ObjectId instances for $in query
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    
    const rewardsAgg = await AmbassadorReward.aggregate([
      { $match: { ambassadorId: { $in: objectIds } } },
      {
        $group: {
          _id: "$ambassadorId",
          rewardsPaid: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: "$status" }, ["paid"]] },
                "$rewardAmount",
                0
              ]
            }
          },
          rewardsPending: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: "$status" }, ["pending"]] },
                "$rewardAmount",
                0
              ]
            }
          }
        }
      }
    ]);

    // Create lookup map → ambassadorId → totals
    const rewardMap = new Map(
      rewardsAgg.map(r => [
        r._id.toString(),
        {
          rewardsPaid: r.rewardsPaid || 0,
          rewardsPending: r.rewardsPending || 0
        }
      ])
    );

    // ---------- FINAL RESPONSE MAPPING ----------
    const mapped = items.map(a => ({
      id: a._id.toString(),
      name: a.name,
      email: a.email,
      phone: a.phone,
      college: a.college,
      city: a.city,
      referralCode: a.referralCode,
      referralLink:
        (process.env.FRONTEND_ORIGIN || "http://localhost:8080") +
        "/ref/" +
        a.referralCode,
      upiId: a.payoutMethod?.upiId ?? a.upiId,
      createdAt: a.createdAt,

      // FIX → Now frontend receives `totals`
      totals: rewardMap.get(a._id.toString()) || {
        rewardsPaid: 0,
        rewardsPending: 0
      }
    }));

    return res.json({
      items: mapped,
      total: totalCount,
      totalCount, // Keep for backward compatibility
      page,
      limit,
      hasMore: skip + mapped.length < totalCount,
      pages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("Error listing ambassadors:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new ambassador (public)
export const createAmbassador = async (req, res) => {
  try {
    const { name, email, phone, college, city, state, graduationYear, upiId } = req.body || {};

    console.log('[createAmbassador] Request received:', { name, email, phone, college, city, state, graduationYear, upiId });

    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Name, email and phone are required" });
    }

    // Check for duplicate email or phone before creating
    const existingAmbassador = await Ambassador.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { phone: phone.trim() }
      ]
    });

    if (existingAmbassador) {
      const duplicateField = existingAmbassador.email === email.toLowerCase().trim() ? 'email' : 'phone';
      return res.status(409).json({ 
        message: `Ambassador with this ${duplicateField} already exists`,
        field: duplicateField
      });
    }

    const ambassador = await Ambassador.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      college: college?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      graduationYear: graduationYear?.trim(),
      upiId: upiId?.trim()
    });

    // Ensure virtuals (referralLink) are included
    const json = ambassador.toJSON();

    console.log('[createAmbassador] Ambassador created successfully:', json._id.toString());

    return res.status(201).json({
      ambassador: {
        id: json._id.toString(),
        name: json.name,
        email: json.email,
        phone: json.phone,
        referralCode: json.referralCode,
        referralLink: json.referralLink,
        upiId: json.payoutMethod?.upiId ?? json.upiId
      }
    });
  } catch (error) {
    console.error("Error creating ambassador:", error);
    console.error("Error stack:", error.stack);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: errors,
        error: error.message 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ 
        message: `Ambassador with this ${field} already exists`,
        field: field,
        error: error.message 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Get ambassador basic profile by id (public)
export const getAmbassadorById = async (req, res) => {
  try {
    const { id } = req.params;
    const ambassador = await Ambassador.findById(id).lean({ virtuals: true });

    if (!ambassador) {
      return res.status(404).json({ message: "Ambassador not found" });
    }

    return res.json({
      id: ambassador._id.toString(),
      name: ambassador.name,
      email: ambassador.email,
      phone: ambassador.phone,
      referralCode: ambassador.referralCode,
      referralLink: ambassador.referralLink,
      upiId: ambassador.payoutMethod?.upiId ?? ambassador.upiId
    });
  } catch (error) {
    console.error("Error getting ambassador:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update ambassador basic profile (admin or self – auth checked in middleware)
export const updateAmbassador = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    const allowedFields = ["name", "email", "phone", "college", "city", "state", "graduationYear"];

    for (const field of allowedFields) {
      if (field in req.body) {
        update[field] = req.body[field];
      }
    }

    const ambassador = await Ambassador.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean({ virtuals: true });

    if (!ambassador) {
      return res.status(404).json({ message: "Ambassador not found" });
    }

    return res.json({
      id: ambassador._id.toString(),
      name: ambassador.name,
      email: ambassador.email,
      phone: ambassador.phone,
      referralCode: ambassador.referralCode,
      referralLink: ambassador.referralLink,
      upiId: ambassador.payoutMethod?.upiId ?? ambassador.upiId
    });
  } catch (error) {
    console.error("Error updating ambassador:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update payout method (UPI) for ambassador (public – used from dashboard)
export const updatePayoutMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, upiId } = req.body || {};

    if (type !== "upi" || !upiId) {
      return res.status(400).json({ message: "Payout type 'upi' and valid upiId are required" });
    }

    const ambassador = await Ambassador.findById(id);
    if (!ambassador) {
      return res.status(404).json({ message: "Ambassador not found" });
    }

    ambassador.upiId = upiId;
    ambassador.payoutMethod = {
      type: "upi",
      upiId,
      updatedAt: new Date()
    };
    await ambassador.save();

    const json = ambassador.toJSON();

    return res.json({
      id: json._id.toString(),
      name: json.name,
      email: json.email,
      phone: json.phone,
      referralCode: json.referralCode,
      referralLink: json.referralLink,
      upiId: json.payoutMethod?.upiId ?? json.upiId
    });
  } catch (error) {
    console.error("Error updating payout method:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get detailed stats for ambassador (wraps statsService)
export const getAmbassadorStatsEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await getAmbassadorStats(id);
    return res.json(stats);
  } catch (error) {
    console.error("Error getting ambassador stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get ambassador summary (totals + pending payouts list)
export const getAmbassadorSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Total groups and members
    const groups = await Group.find({ ambassadorId: id })
      .select("members name")
      .lean();

    const totalGroups = groups.length;
    const totalMembers = groups.reduce(
      (sum, g) => sum + (Array.isArray(g.members) ? g.members.length : 0),
      0
    );

    // Rewards summary
    const rewards = await AmbassadorReward.find({ ambassadorId: id }).lean();
    const totalPaid = rewards
      .filter(r => r.status === "paid" || r.status === "Paid")
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    const totalPending = rewards
      .filter(r => r.status === "pending" || r.status === "Pending")
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    // Pending payouts list
    const pendingRewards = rewards.filter(
      r => r.status === "pending" || r.status === "Pending"
    );

    const pendingPayouts = pendingRewards.map(r => ({
      id: r._id.toString(),
      groupId: r.groupId?.toString?.() || "",
      groupName: r.groupNameSnapshot,
      members: r.memberCountSnapshot,
      amount: r.rewardAmount,
      status: r.status,
      createdAt: r.createdAt
    }));

    return res.json({
      totalGroups,
      totalMembers,
      totalRewards: {
        paid: totalPaid,
        pending: totalPending
      },
      pendingPayouts
    });
  } catch (error) {
    console.error("Error getting ambassador summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Paginated rewards for an ambassador
export const getAmbassadorRewards = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { items, pagination } = await listRewardsByAmbassador(id, { page, limit });

    return res.json({
      items,
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
      hasMore: pagination.hasMore
    });
  } catch (error) {
    console.error("Error getting ambassador rewards:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Paginated groups for an ambassador
export const getAmbassadorGroups = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Group.find({ ambassadorId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Group.countDocuments({ ambassadorId: id })
    ]);

    const mapped = items.map(g => ({
      id: g._id.toString(),
      name: g.name,
      yearOfPassing: g.yearOfPassing,
      totalMembers: Array.isArray(g.members) ? g.members.length : 0,
      currentMemberCount: Array.isArray(g.members) ? g.members.length : 0,
      gridTemplate: g.gridTemplate,
      createdAt: g.createdAt
    }));

    return res.json({
      items: mapped,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + items.length < total
    });
  } catch (error) {
    console.error("Error getting ambassador groups:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
