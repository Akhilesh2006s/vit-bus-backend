const mongoose = require('mongoose');

const studentFeesSchema = new mongoose.Schema({
    semester: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    regNumber: {
        type: String,
        required: true
    },
    dues: {
        type: Number,
        default: 0
    },
    prevPaid: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    thisSemPaidOrNotPaid: {
        type: String,
        enum: ['Paid', 'Not Paid'],
        default: 'Not Paid'
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: String,
        required: true
    }
});

// Create indexes for efficient queries
studentFeesSchema.index({ regNumber: 1 });
studentFeesSchema.index({ semester: 1 });
studentFeesSchema.index({ thisSemPaidOrNotPaid: 1 });
studentFeesSchema.index({ uploadDate: -1 });

module.exports = mongoose.model('StudentFees', studentFeesSchema);

