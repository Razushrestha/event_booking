const GenRes = require('../../utils/router/GenRes');
const Service = require('./service.model');
const path = require('path');
const fs = require('fs');
const { compressImage } = require('../../utils/compressImages');
// Ensure uploads/services directory exists
const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'services');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const createService = async (req, res) => {
    try {
        const requestedUser = req.user;
        if (!requestedUser || requestedUser.role !== 'admin') {
            return res.status(401).json(GenRes(401, null, null, 'Unauthorized'), req.url);
        }

        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json(GenRes(400, null, null, 'Service name is required'), req.url);
        }

        const existingService = await Service.findOne({ name: name.toLowerCase() });
        if (existingService) {
            return res.status(409).json(GenRes(409, null, null, 'Service already exists'), req.url);
        }

        let imageUrl = null;

        if (req.files && req.files.image) {
            const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];

            if (files.length > 0) {
                const file = files[0];

                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.mimetype)) {
                    return res.status(400).json(
                        GenRes(400, null, null, 'Only JPEG, PNG, and WebP images are allowed'),
                        req.url
                    );
                }

                // Validate file size (10MB limit)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    return res.status(400).json(
                        GenRes(400, null, null, 'Image size must be less than 10MB'),
                        req.url
                    );
                }

                try {
                    // Compress the image
                    const compressionResult = await compressImage(file.buffer, 85, 1920, 1080);

                    // Generate filename
                    const sanitizedName = file.originalname.replace(/\s+/g, '_');
                    const shortRandom = Math.random().toString(36).substring(2, 6);
                    const fileExtension = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                    const fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${sanitizedName.split('.')[0]}.${fileExtension}`;

                    // Save compressed image
                    const filePath = path.join(uploadsDir, fileName);
                    fs.writeFileSync(filePath, compressionResult.buffer);

                    imageUrl = `/uploads/services/${fileName}`;

                    // Optional: Log compression stats
                    console.log(`Image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);

                } catch (compressionError) {
                    console.error('Image compression failed:', compressionError);
                    return res.status(500).json(
                        GenRes(500, null, compressionError, 'Failed to process image'),
                        req.url
                    );
                }
            }
        }

        const service = new Service({
            name: name.toLowerCase(),
            description: description || null,
            image: imageUrl
        });

        await service.save();

        return res.status(201).json(
            GenRes(201, service, null, 'Service created successfully'),
            req.url
        );

    } catch (err) {
        console.error('Service creation error:', err);
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
};

const editService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { name, description } = req.body;

        if (!serviceId) {
            return res.status(400).json(GenRes(400, null, null, 'Service ID is required'), req.url);
        }

        const service = await Service.findOne({ serviceId });
        if (!service) {
            return res.status(404).json(GenRes(404, null, null, 'Service not found'), req.url);
        }

        let imageUrl;

        if (req.files && req.files.image) {
            const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];

            if (files.length > 0) {
                const file = files[0];

                try {
                    // Compress the image
                    const compressionResult = await compressImage(file.buffer, 85, 1920, 1080);

                    // Generate filename
                    const sanitizedName = file.originalname.replace(/\s+/g, '_');
                    const shortRandom = Math.random().toString(36).substring(2, 6);
                    const fileExtension = compressionResult.format === 'jpeg' ? 'jpg' : compressionResult.format;
                    const fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${sanitizedName.split('.')[0]}.${fileExtension}`;

                    // Delete old image if it exists
                    if (service.image) {
                        const oldImagePath = path.join(__dirname, '..', '..', '..', service.image);
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }

                    // Save compressed image
                    const filePath = path.join(uploadsDir, fileName);
                    fs.writeFileSync(filePath, compressionResult.buffer);

                    imageUrl = `/uploads/services/${fileName}`;

                    // Optional: log compression stats
                    console.log(`Image compressed: ${compressionResult.originalSize} -> ${compressionResult.compressedSize} bytes (${compressionResult.compressionRatio}% reduction)`);

                } catch (compressionError) {
                    console.error('Image compression failed:', compressionError);
                    return res.status(500).json(
                        GenRes(500, null, compressionError, 'Failed to process image'),
                        req.url
                    );
                }
            }
        }

        if (name) {
            service.name = name.toLowerCase();
        }
        if (description) {
            service.description = description;
        }
        if (imageUrl) {
            service.image = imageUrl;
        }

        await service.save();
        return res.status(200).json(GenRes(200, service, null, 'Service updated successfully'), req.url);

    } catch (err) {
        console.error('Service update error:', err);
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
};

const getAllServices = async (req, res) => {
    try {
        const services = await Service.find({});
        return res.status(200).json(GenRes(200, services, null, 'Services retrieved successfully'), req.url);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
}

const deleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        if (!serviceId) {
            return res.status(400).json(GenRes(400, null, null, 'Service ID is required'), req.url);
        }

        const service = await Service.findOne({ serviceId });
        if (!service) {
            return res.status(404).json(GenRes(404, null, null, 'Service not found'), req.url);
        }

        // Delete associated image if it exists
        if (service.image) {
            const imagePath = path.join(__dirname, '..', '..', '..', service.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Service.findOneAndDelete({ serviceId });
        return res.status(200).json(GenRes(200, service, null, 'Service deleted successfully'), req.url);
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, err.message), req.url);
    }
}

module.exports = {
    createService,
    getAllServices,
    editService,
    deleteService
}
