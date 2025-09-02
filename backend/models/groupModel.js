import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  memberRollNumber: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String,
    required: true
  },
  vote: {
    type: String,
    enum: ['hexagonal', 'square', 'circle'],
    default: 'square'
  },
  size: {
    type: String,
    enum: ['s', 'm', 'l', 'xl', 'xxl'],
    default: 'm'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true
    },
    yearOfPassing: {
      type: String,
      required: [true, 'Year of passing is required'],
      trim: true
    },
    totalMembers: {
      type: Number,
      required: [true, 'Total members is required'],
      min: [1, 'Total members must be at least 1']
    },
    gridTemplate: {
      type: String,
      enum: ['hexagonal', 'square', 'circle'],
      default: 'square'
    },
    shareLink: {
      type: String,
      default: function() {
        return `/join/${this._id}`;
      }
    },
    members: [memberSchema],
    votes: {
      hexagonal: {
        type: Number,
        default: 0
      },
      square: {
        type: Number,
        default: 0
      },
      circle: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for frequently queried fields
groupSchema.index({ createdAt: -1 }); // For sorting by creation date
groupSchema.index({ yearOfPassing: 1 }); // For filtering by year
groupSchema.index({ 'members.memberRollNumber': 1 }); // For finding members by roll number

// Virtual for calculating current member count
groupSchema.virtual('currentMemberCount').get(function() {
  return this.members.length;
});

// Method to check if group is full
groupSchema.methods.isFull = function() {
  return this.members.length >= this.totalMembers;
};

// Method to add a new member
groupSchema.methods.addMember = function(memberData) {
  if (this.isFull()) {
    throw new Error('Group is already full');
  }
  
  this.members.push(memberData);
  this.votes[memberData.vote]++;
  
  return this;
};

// Method to update grid template based on votes
groupSchema.methods.updateGridTemplate = function() {
  const votes = this.votes;
  let maxVotes = 0;
  let winningTemplate = this.gridTemplate;
  
  for (const [template, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      winningTemplate = template;
    }
  }
  
  this.gridTemplate = winningTemplate;
  return this;
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
