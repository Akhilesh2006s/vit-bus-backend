const StudentFees = require('../models/StudentFees');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/csv');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${uuidv4()}-${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload and process CSV file
exports.uploadCSV = async (req, res) => {
    try {
        upload.single('csvFile')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ 
                    success: false, 
                    error: err.message 
                });
            }

            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'No CSV file provided' 
                });
            }

            const { uploadedBy } = req.body;
            if (!uploadedBy) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Uploader information is required' 
                });
            }

            const results = [];
            const errors = [];

            // Read and parse CSV file
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => {
                    // Validate and clean data
                    const studentData = {
                        semester: data.Semester || data.semester || '',
                        name: data.Name || data.name || '',
                        regNumber: data.RegNumber || data.regNumber || '',
                        dues: parseInt(data.Dues || data.dues || 0),
                        prevPaid: data.PrevPaid || data.prevPaid || 'No',
                        thisSemPaidOrNotPaid: data.ThisSemPaidOrNotPaid || data.thisSemPaidOrNotPaid || 'Not Paid',
                        uploadedBy: uploadedBy
                    };

                    // Basic validation
                    if (!studentData.regNumber || !studentData.name) {
                        errors.push(`Invalid data for row: ${JSON.stringify(data)}`);
                        return;
                    }

                    results.push(studentData);
                })
                .on('end', async () => {
                    try {
                        let successfulInsertions = 0;
                        let duplicateErrors = 0;
                        let otherErrors = 0;

                        // Process each record individually to handle duplicates gracefully
                        for (const studentData of results) {
                            try {
                                // Check if student already exists
                                const existingStudent = await StudentFees.findOne({ 
                                    regNumber: studentData.regNumber 
                                });

                                if (existingStudent) {
                                    // Update existing record
                                    await StudentFees.findOneAndUpdate(
                                        { regNumber: studentData.regNumber },
                                        {
                                            semester: studentData.semester,
                                            name: studentData.name,
                                            dues: studentData.dues,
                                            prevPaid: studentData.prevPaid,
                                            thisSemPaidOrNotPaid: studentData.thisSemPaidOrNotPaid,
                                            uploadedBy: studentData.uploadedBy,
                                            uploadDate: new Date()
                                        },
                                        { new: true }
                                    );
                                    successfulInsertions++;
                                } else {
                                    // Insert new record
                                    await StudentFees.create(studentData);
                                    successfulInsertions++;
                                }
                            } catch (recordError) {
                                console.error('Error processing record:', recordError);
                                if (recordError.code === 11000) {
                                    duplicateErrors++;
                                    errors.push(`Duplicate registration number: ${studentData.regNumber}`);
                                } else {
                                    otherErrors++;
                                    errors.push(`Error processing ${studentData.regNumber}: ${recordError.message}`);
                                }
                            }
                        }

                        // Clean up uploaded file
                        if (fs.existsSync(req.file.path)) {
                            fs.unlinkSync(req.file.path);
                        }

                        res.json({
                            success: true,
                            message: `Successfully processed ${results.length} records`,
                            summary: {
                                totalRecords: results.length,
                                successfulInsertions: successfulInsertions,
                                errors: errors.length,
                                duplicates: duplicateErrors,
                                otherErrors: otherErrors
                            },
                            errors: errors.length > 0 ? errors : null
                        });
                    } catch (insertError) {
                        console.error('Error inserting data:', insertError);
                        
                        // Clean up uploaded file on error
                        if (req.file && fs.existsSync(req.file.path)) {
                            fs.unlinkSync(req.file.path);
                        }
                        
                        res.status(500).json({ 
                            success: false, 
                            error: 'Failed to insert data into database',
                            details: insertError.message
                        });
                    }
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error);
                    res.status(500).json({ 
                        success: false, 
                        error: 'Failed to parse CSV file' 
                    });
                });
        });
    } catch (error) {
        console.error('CSV upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload CSV file' 
        });
    }
};

// Get all student fees data with pagination and filters
exports.getStudentFees = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            semester, 
            paymentStatus, 
            search,
            sortBy = 'uploadDate',
            sortOrder = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;
        let query = {};

        // Apply filters
        if (semester) {
            query.semester = semester;
        }

        if (paymentStatus) {
            query.thisSemPaidOrNotPaid = paymentStatus;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { regNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const students = await StudentFees.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await StudentFees.countDocuments(query);

        res.json({
            success: true,
            data: students,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                recordsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching student fees:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch student fees data' 
        });
    }
};

// Get dashboard summary statistics
exports.getDashboardSummary = async (req, res) => {
    try {
        const totalStudents = await StudentFees.countDocuments();
        const paidStudents = await StudentFees.countDocuments({ thisSemPaidOrNotPaid: 'Paid' });
        const unpaidStudents = await StudentFees.countDocuments({ thisSemPaidOrNotPaid: 'Not Paid' });
        
        const totalDues = await StudentFees.aggregate([
            { $group: { _id: null, total: { $sum: '$dues' } } }
        ]);

        const semesterStats = await StudentFees.aggregate([
            { $group: { _id: '$semester', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const paymentStats = await StudentFees.aggregate([
            { $group: { _id: '$thisSemPaidOrNotPaid', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            summary: {
                totalStudents,
                paidStudents,
                unpaidStudents,
                totalDues: totalDues[0]?.total || 0,
                paymentRate: totalStudents > 0 ? ((paidStudents / totalStudents) * 100).toFixed(2) : 0
            },
            semesterStats,
            paymentStats
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch dashboard summary' 
        });
    }
};

// Get student by registration number
exports.getStudentByRegNumber = async (req, res) => {
    try {
        const { regNumber } = req.params;
        
        const student = await StudentFees.findOne({ regNumber });
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                error: 'Student not found' 
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch student data' 
        });
    }
};

// Update student payment status
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { regNumber } = req.params;
        const { thisSemPaidOrNotPaid } = req.body;

        if (!thisSemPaidOrNotPaid || !['Paid', 'Not Paid'].includes(thisSemPaidOrNotPaid)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid payment status' 
            });
        }

        const student = await StudentFees.findOneAndUpdate(
            { regNumber },
            { thisSemPaidOrNotPaid },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ 
                success: false, 
                error: 'Student not found' 
            });
        }

        res.json({
            success: true,
            data: student,
            message: 'Payment status updated successfully'
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update payment status' 
        });
    }
};

// Export multer upload for use in routes
exports.upload = upload;

