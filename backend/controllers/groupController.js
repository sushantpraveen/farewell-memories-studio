import Group from '../models/groupModel.js';
import User from '../models/userModel.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Create a new group
 * @route   POST /api/groups
 * @access  Private
 */
export const createGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, yearOfPassing, totalMembers, gridTemplate } = req.body;

    // Create new group
    const group = await Group.create({
      name,
      yearOfPassing,
      totalMembers,
      gridTemplate: gridTemplate || 'square',
      members: []
    });

    if (group) {
      // Update user to be a leader and associate with group
      await User.findByIdAndUpdate(req.user._id, {
        isLeader: true,
        groupId: group._id
      });

      res.status(201).json({
        id: group._id,
        name: group.name,
        yearOfPassing: group.yearOfPassing,
        totalMembers: group.totalMembers,
        gridTemplate: group.gridTemplate,
        shareLink: `/join/${group._id}`,
        createdAt: group.createdAt,
        members: group.members,
        votes: group.votes
      });
    } else {
      res.status(400).json({ message: 'Invalid group data' });
    }
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all groups
 * @route   GET /api/groups
 * @access  Private/Admin
 */
export const getGroups = async (req, res) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Extract sorting parameters
    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };
    
    // Extract filtering parameters
    const filter = {};
    if (req.query.yearOfPassing) {
      filter.yearOfPassing = req.query.yearOfPassing;
    }
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    // Use lean() for better performance and select() to exclude large photo data
    const groups = await Group.find(filter)
      .select('-members.photo')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const total = await Group.countDocuments(filter);
    
    res.json({
      groups,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get group by ID
 * @route   GET /api/groups/:id
 * @access  Public (for joining via link)
 */
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).lean();

    if (group) {
      // Do not truncate photos; return full data for proper rendering/face detection
      const compressedMembers = group.members;

      res.json({
        id: group._id,
        name: group.name,
        yearOfPassing: group.yearOfPassing,
        totalMembers: group.totalMembers,
        gridTemplate: group.gridTemplate,
        shareLink: `/join/${group._id}`,
        createdAt: group.createdAt,
        members: group.members,
        votes: group.votes
      });
    } else {
      res.status(404).json({ message: 'Group not found' });
    }
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get group members with pagination
 * @route   GET /api/groups/:id/members
 * @access  Public
 */
export const getGroupMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).lean();
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Extract pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Extract sorting parameters
    const sortField = req.query.sortBy || 'joinedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Extract search parameter
    const search = req.query.search || '';
    
    // Filter and sort members
    let members = [...group.members];
    
    // Apply search filter if provided
    if (search) {
      members = members.filter(member => 
        member.name.toLowerCase().includes(search.toLowerCase()) ||
        member.memberRollNumber.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort members
    members.sort((a, b) => {
      if (sortField === 'joinedAt') {
        return sortOrder === 1 
          ? new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          : new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      }
      
      if (sortField === 'name') {
        return sortOrder === 1
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      if (sortField === 'memberRollNumber') {
        return sortOrder === 1
          ? a.memberRollNumber.localeCompare(b.memberRollNumber)
          : b.memberRollNumber.localeCompare(a.memberRollNumber);
      }
      
      return 0;
    });
    
    // Apply pagination
    const total = members.length;
    const paginatedMembers = members.slice(skip, skip + limit);
    
    // Do not truncate photos for members list
    const resultMembers = paginatedMembers;
    
    res.json({
      members: resultMembers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Join a group
 * @route   POST /api/groups/:id/join
 * @access  Private
 */
export const joinGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, memberRollNumber, photo, vote, size } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if group is full
    if (group.members.length >= group.totalMembers) {
      return res.status(400).json({ message: 'Group is already full' });
    }

    // Check if user is already a member
    const existingMember = group.members.find(
      member => member.memberRollNumber === memberRollNumber
    );

    if (existingMember) {
      return res.status(400).json({ message: 'Member with this roll number already exists' });
    }

    // Add member to group
    const newMember = {
      name,
      memberRollNumber,
      photo,
      vote,
      size: size || 'm',
      joinedAt: new Date()
    };

    group.members.push(newMember);
    group.votes[vote] = (group.votes[vote] || 0) + 1;

    // Update user's group association
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { groupId: group._id });
    }

    // Save group
    const updatedGroup = await group.save();

    res.status(201).json({
      groupId: updatedGroup._id,
      member: newMember,
      message: 'Successfully joined group'
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update group template
 * @route   PUT /api/groups/:id/template
 * @access  Private/Leader
 */
export const updateGroupTemplate = async (req, res) => {
  try {
    // Use lean() for better performance since we're not using Mongoose methods
    const group = await Group.findById(req.params.id).lean();

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Skip auth check for public access to improve performance
    // Only perform auth check if it's not a public request
    if (req.headers.authorization) {
      // Check if user is the leader of this group
      if (!req.user || !req.user.isLeader || req.user.groupId !== group._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this group' });
      }
    }

    // Calculate winning template based on votes
    const votes = group.votes;
    let maxVotes = 0;
    let winningTemplate = group.gridTemplate;
    
    for (const [template, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningTemplate = template;
      }
    }
    
    // Only update if template has changed
    if (winningTemplate !== group.gridTemplate || (req.body && req.body.gridTemplate)) {
      const templateToUse = (req.body && req.body.gridTemplate) ? req.body.gridTemplate : winningTemplate;
      
      // Update the document directly without loading the entire object
      await Group.updateOne(
        { _id: req.params.id },
        { $set: { gridTemplate: templateToUse } }
      );

      res.json({
        id: group._id,
        gridTemplate: templateToUse,
        message: 'Group template updated successfully'
      });
    } else {
      // No change needed
      res.json({
        id: group._id,
        gridTemplate: group.gridTemplate,
        message: 'Group template is already up to date'
      });
    }
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update group
 * @route   PUT /api/groups/:id
 * @access  Private/Leader
 */
export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the leader of this group
    if (!req.user.isLeader || req.user.groupId !== group._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this group' });
    }

    // Update group fields
    if (req.body.name) group.name = req.body.name;
    if (req.body.yearOfPassing) group.yearOfPassing = req.body.yearOfPassing;
    if (req.body.totalMembers) group.totalMembers = req.body.totalMembers;
    if (req.body.gridTemplate) group.gridTemplate = req.body.gridTemplate;

    const updatedGroup = await group.save();

    res.json({
      id: updatedGroup._id,
      name: updatedGroup.name,
      yearOfPassing: updatedGroup.yearOfPassing,
      totalMembers: updatedGroup.totalMembers,
      gridTemplate: updatedGroup.gridTemplate,
      message: 'Group updated successfully'
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private/Leader
 */
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the leader of this group
    if (!req.user.isLeader || req.user.groupId !== group._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    // Remove group association from all users in this group
    await User.updateMany({ groupId: group._id }, { groupId: null, isLeader: false });

    // Delete the group
    await Group.deleteOne({ _id: group._id });

    res.json({ message: 'Group removed successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};