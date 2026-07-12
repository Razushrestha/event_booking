const GenRes = require("../../utils/router/GenRes");
const path = require("path");
const fs = require("fs");

const PaymentMethod = require("./paymentMethod.model");

const uploadsDir = path.join(__dirname, "..", "..", "..", "uploads", "payment-methods");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const getAllPaymentMethods = async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find().sort({ name: 1 });
        return res.status(200).json(GenRes(200, paymentMethods, null, "Payment methods fetched successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, "Failed to fetch payment methods", req.url));
    }
};

const addPaymentMethod = async (req, res) => {
    try {
        const { name } = req.body;

        let imageUrl = null;
        if (req.files && req.files.image) {
            const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
            if (files.length > 0) {
                const file = files[0];
                file.originalname = file.originalname.replace(/\s+/g, '_');
                const shortRandom = Math.random().toString(36).substring(2, 6);
                const fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${file.originalname.slice(-15)}`;
                const filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, file.buffer);
                imageUrl = `/uploads/payment-methods/${fileName}`;
            }
        }

        const newPaymentMethod = new PaymentMethod({
            name,
            image: imageUrl
        });

        await newPaymentMethod.save();
        return res.status(201).json(GenRes(201, newPaymentMethod, null, "Payment method added successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, "Failed to add payment method", req.url));
    }
};

const updatePaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.params;
        const { name } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json(GenRes(400, null, null, "Name is required", req.url));
        }

        // Define uploads directory
        const uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads', 'payment-methods');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Handle image upload
        let imageUrl = null;
        if (req.files && req.files.image) {
            const files = Array.isArray(req.files.image) ? req.files.image : [req.files.image];
            if (files.length > 0) {
                const file = files[0];
                file.originalname = file.originalname.replace(/\s+/g, '_');
                const shortRandom = Math.random().toString(36).substring(2, 6);
                const fileName = `${Date.now().toString().slice(-8)}_${shortRandom}_${file.originalname.slice(-15)}`;
                const filePath = path.join(uploadsDir, fileName);
                fs.writeFileSync(filePath, file.buffer);
                imageUrl = `/uploads/payment-methods/${fileName}`;
            }
        }

        // Build update data, only include image if a new one is uploaded
        const updateData = { name };
        if (imageUrl) {
            updateData.image = imageUrl; // Only update image if a new one is provided
        }

        const updatedPaymentMethod = await PaymentMethod.findOneAndUpdate(
            { paymentMethodId },
            updateData,
            { new: true }
        );

        if (!updatedPaymentMethod) {
            return res.status(404).json(GenRes(404, null, null, "Payment method not found", req.url));
        }

        return res.status(200).json(GenRes(200, updatedPaymentMethod, null, "Payment method updated successfully", req.url));
    } catch (err) {
        return res.status(500).json(GenRes(500, null, err, "Failed to update payment method", req.url));
    }
};

const deletePaymentMethod = async (req, res) => {
    try {
        const { paymentMethodId } = req.params;

        const deletedPaymentMethod = await PaymentMethod.findOneAndDelete({ paymentMethodId });

        if (!deletedPaymentMethod) {
            return res.status(404).json(GenRes(404, null, null, "Payment method not found", req.url));
        }

        // Delete associated image file if it exists
        if (deletedPaymentMethod.image) {
            const imagePath = path.join(__dirname, '..', '..', '..', deletedPaymentMethod.image);
            if (fs.existsSync(imagePath) && !fs.lstatSync(imagePath).isDirectory()) {
                fs.unlinkSync(imagePath);
            }
        }

        return res.status(200).json(GenRes(200, deletedPaymentMethod, null, "Payment method deleted successfully", req.url));
    } catch (err) {
        console.error('Error deleting payment method:', err);
        return res.status(500).json(GenRes(500, null, err, "Failed to delete payment method", req.url));
    }
};

module.exports = {
    getAllPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
};