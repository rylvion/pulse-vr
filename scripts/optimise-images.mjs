// This script optimises images in the assets/images folder by resizing them to a maximum of 1920x1080 and converting them to AVIF and WebP formats.
// The optimised images are saved in the assets/images/optimised folder.
// The script uses the Sharp library for image processing and supports JPEG and PNG input formats.
// It checks for existing optimised versions before processing to avoid redundant work.
// The script is executed from the command line and logs its progress to the console.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

const inputDir = path.join(rootDir, "assets/images");
const outputDir = path.join(rootDir, "assets/images/optimised");

const TARGET_WIDTH = 1920;
const TARGET_HEIGHT = 1080;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(inputDir)) {
  console.error("Images folder not found");
  process.exit(1);
}

const files = fs.readdirSync(inputDir);

/***
 * Gets the base name of a file without its extension. For example, "image.jpg" would return "image".
 * @param {string} name - the name of the file to get the base from.
 * @returns {string} - the base name of the file without its extension.
 * @remarks - This function uses the path.parse method to parse the file name and extract the name property, which is the base name without the extension.
 */
function getBase(name) {
  return path.parse(name).name;
}

/***
 * Checks if a given file is a source image that should be processed. It returns true if the file has a .jpg, .jpeg, or .png extension (case-insensitive), and false otherwise.
 * @param {string} file - the name of the file to check.
 * @returns {boolean} - true if the file is a source image with a .jpg, .jpeg, or .png extension, and false otherwise.
 * @remarks - The function uses the path.extname method to get the file extension and checks if it is one of the allowed image formats.
 * */
function isSourceImage(file) {
  return [".jpg", ".jpeg", ".png"].includes(path.extname(file).toLowerCase());
}

/***
 * Checks if optimised versions of an image already exist in the output directory. It looks for files with the same base name and .avif and .webp extensions.
 * @param {string} base - the base name of the image file (without extension) to check for optimised versions.
 * @returns {boolean} - true if both the .avif and .webp optimised versions of the image exist in the output directory, and false otherwise.
 * @remarks - The function constructs the expected file paths for the .avif and .webp versions of the image using the provided base name and checks if both files exist using fs.existsSync.
 */
function hasOptimisedVersions(base) {
  return (
    fs.existsSync(path.join(outputDir, `${base}.avif`)) &&
    fs.existsSync(path.join(outputDir, `${base}.webp`))
  );
}

/**
 * Optimises a single image file by resizing it to a maximum of 1920x1080 and converting it to AVIF and WebP formats. It saves the optimised images in the output directory with the same base name and appropriate extensions.
 * @param {string} file - the name of the image file to optimise, which should be located in the input directory.
 * @returns {Promise<void>} - a promise that resolves when the optimisation process for the image is complete.
 * @remarks - The function first checks if the file is a source image and if optimised versions already exist. If not, it uses the Sharp library to read the image, rotate it based on EXIF data, resize it to fit within the target dimensions while maintaining aspect ratio, and then saves the optimised versions in AVIF and WebP formats with specified quality settings.
 */
async function optimiseImage(file) {
  if (!isSourceImage(file)) return;

  const inputPath = path.join(inputDir, file);
  const base = getBase(file);

  if (hasOptimisedVersions(base)) {
    console.log(`Skipping ${file} (already optimised)`);
    return;
  }

  console.log(`Processing ${file}`);

  const image = sharp(inputPath).rotate().resize({
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    fit: "cover",
    position: "centre",
    withoutEnlargement: true,
  });

  try {
    const ext = path.extname(file).toLowerCase();

    if (ext === ".jpg" || ext === ".jpeg") {
      await image
        .clone()
        .jpeg({
          quality: 80,
          mozjpeg: true,
          progressive: true,
        })
        .toFile(path.join(outputDir, `${base}.jpg`));
    }

    if (ext === ".png") {
      await image
        .clone()
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          palette: true,
        })
        .toFile(path.join(outputDir, `${base}.png`));
    }

    await image
      .clone()
      .avif({ quality: 45 })
      .toFile(path.join(outputDir, `${base}.avif`));

    await image
      .clone()
      .webp({ quality: 70 })
      .toFile(path.join(outputDir, `${base}.webp`));

    console.log(`✓ Finished ${file}`);
  } catch (err) {
    console.error(`✗ Failed ${file}`, err);
  }
}

/***
 * Runs the image optimisation process for all files in the input directory. It iterates over each file, checks if it is a source image, and if so, calls the optimiseImage function to process it. The function logs the progress to the console and handles any errors that occur during the optimisation process.
 * @returns {Promise<void>} - a promise that resolves when all images have been processed.
 * @remarks - The function uses a for...of loop to iterate over the files and awaits the optimiseImage function for each file to ensure that they are processed sequentially. It also logs a completion message once all images have been optimised.
 */
async function run() {
  for (const file of files) {
    await optimiseImage(file);
  }

  console.log("Image optimisation complete (16:9 outputs in /optimised)");
}

// Execute the run function and catch any unhandled errors, logging them to the console and exiting with a non-zero status code to indicate failure.
run().catch((err) => {
  console.error(err);
  process.exit(1);
});