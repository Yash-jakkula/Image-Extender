const fs = require('fs');
const sharp = require('sharp');
const { OpenAI } = require('openai');
const shortId = require('shortid');
const https = require('https');

// Replace with your OpenAI API key
//const apiKey = 'api-key';

const downloadImage = async (url, outputPath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => resolve(outputPath));
      fileStream.on('error', reject);
    }).on('error', reject);
  });
};

const mergeImages = async (originalImagePath, extendedImagePath, outputImagePath) => {
  try {
    const [originalImage, extendedImage] = await Promise.all([
      sharp(originalImagePath),
      sharp(extendedImagePath),
    ]);

    // Get original image metadata
    const originalMetadata = await originalImage.metadata();
    const originalWidth = originalMetadata.width;
    const originalHeight = originalMetadata.height;

    // Ensure both images have the same height (adjust if necessary)
    const extendedImageMetadata = await extendedImage.metadata();
    if (extendedImageMetadata.height !== originalHeight) {
      await extendedImage.resize(null, originalHeight); // Resize extended image to match height
    }

    // Create a new image with combined dimensions
    const mergedImage = sharp({
      create: {
        width: originalWidth + extendedImageMetadata.width, // Combine image widths
        height: originalHeight,
        channels: 4, // Assuming RGBA format
        background: { r: 255, g: 255, b: 255, alpha: 0.0 }
    },
    });

    // Compose the original and extended images
    await mergedImage
      .composite([
        { input: originalImage, top: 0, left: 0 }, // Place original at top-left
        { input: extendedImage, top: 0, left: originalWidth }, // Place extended image on right
        
    ])
      .toFile(outputImagePath);

    console.log('Images merged successfully:', outputImagePath);
  } catch (error) {
    console.error('Error merging images:', error);
    throw error; // Re-throw the error for proper handling
  }
};

const getExtendedImage = async (req, res, next) => {
  try {
    const { croppedImage } = req.body;
    const { originalImage } = req.body; // Assuming original image path is also sent

    const shortUrl = shortId.generate();
    const croppedImagePath = `${__dirname}/croppedimages/${shortUrl}.png`; // Adjust path
    const outputImagePath = `${__dirname}/editedImage/${shortUrl}.png`;
    const extendedImagePath = `${__dirname}/mergedimages/${shortUrl}.png`; // Adjust path

    // Decode the Base64 image data
    const base64Image = croppedImage.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Save the decoded cropped image to a file
    fs.writeFileSync(croppedImagePath, imageBuffer);

    // Perform image extension using OpenAI
    const client = new OpenAI({ apiKey });
    const response = await client.images.edit({
      image: fs.createReadStream(croppedImagePath),
      model: "dall-e-2",
      prompt: "extend the image with appropriate content in the transparent area of the image",
      n: 1,
      size: "1024x1024"
    });

    const extendedImageUrl = response.data[0].url;

    // Download the extended image and use it for merging
    const downloadedImagePath = await downloadImage(extendedImageUrl, extendedImagePath);
    await mergeImages("D:/React/openAi/open-ai-backend/controllers/cat.png", downloadedImagePath, outputImagePath);

    // Return the merged image path
    return res.status(200).json({
      imgData: outputImagePath, // Send the path to the merged image
      success: true
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Internal Server Error'
    });
  }
};

module.exports = { getExtendedImage };
