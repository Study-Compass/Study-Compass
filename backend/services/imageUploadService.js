const path = require('path');
const s3 = require('../aws-config');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

const uploadImageToS3 = async (file, folderName) => {
    if (!file) {
        throw new Error('No file provided.');
    }

    const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${folderName}/${Date.now()}_${path.basename(file.originalname)}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    try {
        // Upload image to S3
        const s3Response = await s3.upload(s3Params).promise();
        return s3Response.Location; // Return the URL of the uploaded image
    } catch (error) {
        console.error('Error uploading image to S3:', error);
        throw new Error('Failed to upload image to S3.');
    }
};

const deleteAndUploadImageToS3 = async (file, folderName, existingImageUrl) => {
    if (!file) {
        throw new Error('No file provided.');
    }

    const fileName = `${folderName}/${Date.now()}_${path.basename(file.originalname)}`;
    const s3ParamsUpload = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
    };

    try {
        //if an existing image URL is provided, delete it
        if (existingImageUrl) {
            const existingKey = existingImageUrl.split(`${process.env.AWS_S3_BUCKET_NAME}/`)[1];
            if (existingKey) {
                const s3ParamsDelete = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: existingKey,
                };

                await s3.deleteObject(s3ParamsDelete).promise();
                console.log(`Deleted existing image: ${existingKey}`);
            }
        }

        //upload the new image
        const s3Response = await s3.upload(s3ParamsUpload).promise();
        return s3Response.Location; // Return the URL of the uploaded image
    } catch (error) {
        console.error('Error deleting or uploading image to S3:', error);
        throw new Error('Failed to delete or upload image to S3.');
    }
};

module.exports = { uploadImageToS3, deleteAndUploadImageToS3 };
