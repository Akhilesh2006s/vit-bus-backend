const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    imageType: {
        type: String,
        enum: ['profile', 'other'],
        default: 'profile'
    },
    originalName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Create indexes for efficient queries
imageSchema.index({ userId: 1, imageType: 1 });
imageSchema.index({ fileName: 1 });

module.exports = mongoose.model('Image', imageSchema);
