const Image = require('../models/Image');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
    try {
        // Use multer middleware
        upload.single('image')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ 
                    success: false, 
                    error: err.message 
                });
            }

            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No image file provided' 
                });
            }

            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'User ID is required' 
                });
            }

            // Deactivate previous profile images for this user
            await Image.updateMany(
                { userId: userId, imageType: 'profile', isActive: true },
                { isActive: false }
            );

            // Create new image record
            const image = new Image({
                userId: userId,
                imageType: 'profile',
                originalName: req.file.originalname,
                fileName: req.file.filename,
                filePath: req.file.path,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            });

            await image.save();

            // Return the image URL
            const imageUrl = `${req.protocol}://${req.get('host')}/api/images/${image.fileName}`;

            res.json({
                success: true,
                image: {
                    id: image._id,
                    url: imageUrl,
                    fileName: image.fileName,
                    fileSize: image.fileSize,
                    uploadDate: image.uploadDate
                }
            });
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload image' 
        });
    }
};

// Get image by filename
exports.getImage = async (req, res) => {
    try {
        const { filename } = req.params;
        
        const image = await Image.findOne({ fileName: filename, isActive: true });
        if (!image) {
            return res.status(404).json({ 
                success: false, 
                error: 'Image not found' 
            });
        }

        const imagePath = path.join(__dirname, '../uploads', filename);
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Image file not found' 
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', image.mimeType);
        res.setHeader('Content-Length', image.fileSize);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Send the file
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Image retrieval error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve image' 
        });
    }
};

// Get user's profile image
exports.getUserProfileImage = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const image = await Image.findOne({ 
            userId: userId, 
            imageType: 'profile', 
            isActive: true 
        }).sort({ uploadDate: -1 });

        if (!image) {
            return res.status(404).json({ 
                success: false, 
                error: 'Profile image not found' 
            });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/api/images/${image.fileName}`;

        res.json({
            success: true,
            image: {
                id: image._id,
                url: imageUrl,
                fileName: image.fileName,
                fileSize: image.fileSize,
                uploadDate: image.uploadDate
            }
        });
    } catch (error) {
        console.error('Profile image retrieval error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve profile image' 
        });
    }
};

// Delete image
exports.deleteImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        
        const image = await Image.findById(imageId);
        if (!image) {
            return res.status(404).json({ 
                success: false, 
                error: 'Image not found' 
            });
        }

        // Delete file from filesystem
        const imagePath = path.join(__dirname, '../uploads', image.fileName);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Delete from database
        await Image.findByIdAndDelete(imageId);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete image' 
        });
    }
};

// Export multer upload for use in routes
exports.upload = upload;





