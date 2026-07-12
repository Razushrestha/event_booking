const sharp = require('sharp');

const compressImage = async (inputBuffer, targetQuality = 85, maxWidth = 1920, maxHeight = 1080) => {
    try {
        // Get image metadata
        const metadata = await sharp(inputBuffer).metadata();

        // Keep original format unless conversion is beneficial
        let outputFormat = metadata.format;

        // Convert PNG to JPEG only if it doesn't have transparency and is large
        if (metadata.format === 'png' && !metadata.hasAlpha && inputBuffer.length > 500000) {
            outputFormat = 'jpeg';
        }

        // Don't process if image is already small and well-compressed
        const isSmallFile = inputBuffer.length < 100000; // Less than 100KB
        const needsResize = metadata.width > maxWidth || metadata.height > maxHeight;

        if (isSmallFile && !needsResize) {
            return {
                buffer: inputBuffer,
                format: metadata.format,
                originalSize: inputBuffer.length,
                compressedSize: inputBuffer.length,
                compressionRatio: '0.00',
                wasProcessed: false
            };
        }

        // Create sharp instance
        let sharpInstance = sharp(inputBuffer);

        // Resize if necessary
        if (needsResize) {
            sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Apply smart compression
        let compressedBuffer;

        if (outputFormat === 'jpeg' || metadata.format === 'jpeg') {
            // For JPEG, try different quality levels and pick the best
            const qualities = [targetQuality, targetQuality - 10, targetQuality - 20];
            let bestBuffer = null;
            let bestSize = inputBuffer.length;

            for (const quality of qualities) {
                const testBuffer = await sharpInstance
                    .jpeg({
                        quality: quality,
                        progressive: true,
                        mozjpeg: true
                    })
                    .toBuffer();

                if (testBuffer.length < bestSize) {
                    bestBuffer = testBuffer;
                    bestSize = testBuffer.length;
                }
            }

            compressedBuffer = bestBuffer || inputBuffer;

        } else if (outputFormat === 'png') {
            // For PNG, try different compression levels
            const pngBuffer = await sharpInstance
                .png({
                    compressionLevel: 9,
                    adaptiveFiltering: true,
                    palette: metadata.channels === 1 || metadata.channels === 2 // Use palette for grayscale
                })
                .toBuffer();

            compressedBuffer = pngBuffer.length < inputBuffer.length ? pngBuffer : inputBuffer;

        } else if (outputFormat === 'webp') {
            // For WebP, use lossless for small images, lossy for large
            const webpBuffer = await sharpInstance
                .webp({
                    quality: inputBuffer.length > 500000 ? targetQuality : 100,
                    lossless: inputBuffer.length <= 500000
                })
                .toBuffer();

            compressedBuffer = webpBuffer.length < inputBuffer.length ? webpBuffer : inputBuffer;

        } else {
            // For other formats, just resize if needed
            compressedBuffer = needsResize ? await sharpInstance.toBuffer() : inputBuffer;
        }

        // Only use compressed version if it's actually smaller
        const finalBuffer = compressedBuffer.length < inputBuffer.length ? compressedBuffer : inputBuffer;
        const finalFormat = finalBuffer === inputBuffer ? metadata.format : outputFormat;

        return {
            buffer: finalBuffer,
            format: finalFormat,
            originalSize: inputBuffer.length,
            compressedSize: finalBuffer.length,
            compressionRatio: ((inputBuffer.length - finalBuffer.length) / inputBuffer.length * 100).toFixed(2),
            wasProcessed: finalBuffer !== inputBuffer
        };

    } catch (error) {
        console.error('Image compression error:', error);
        // Return original buffer if compression fails
        return {
            buffer: inputBuffer,
            format: 'original',
            originalSize: inputBuffer.length,
            compressedSize: inputBuffer.length,
            compressionRatio: '0.00',
            wasProcessed: false,
            error: error.message
        };
    }
};

module.exports = {
    compressImage
};