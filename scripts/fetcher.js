// This script fetches image metadata from Pixabay, Pexels, and Unsplash based on URLs listed in img-sources.txt. It builds a structured JSON file (assets.json) with the relevant metadata for each image, including local image paths if available. It also saves the raw API responses in dump.json for reference.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load API keys from environment variables (ignored .env via .gitignore so you'll have to manually create a .env file with the keys if you want to run this script)
const PIXABAY_KEY = process.env.PIXABAY_KEY;
const PEXELS_KEY = process.env.PEXELS_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Set up file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.resolve(__dirname, "../assets/images");
const ASSETS_OUTPUT_DIR = path.resolve(__dirname, "../assets/data");
const ASSETS_OUTPUT_FILE = path.join(ASSETS_OUTPUT_DIR, "assets.json");
const DUMP_OUTPUT_FILE = path.join(ASSETS_OUTPUT_DIR, "dump.json");
const URLS_FILE = path.join(ASSETS_OUTPUT_DIR, "img-sources.txt");

if (!PIXABAY_KEY || !PEXELS_KEY || !UNSPLASH_KEY) {
  console.error("Missing API keys");
  process.exit(1);
}

/**
 * Loads image URLs from a text file, where each line is expected to contain a single URL. The function reads the file, splits it into lines, trims whitespace, and filters out any empty lines, returning an array of valid URLs to be processed.
 * @param {string} filePath - the path to the text file containing the image URLs.
 * @return {string[]} - an array of image URLs extracted from the file, with whitespace trimmed and empty lines removed.
 */
function loadsUrlsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  } catch (err) {
    console.warn(`Could not read URLs from img-sources.txt: ${err.message}`);
    return [];
  }
}

const urls = loadsUrlsFromFile(URLS_FILE);

// Object to store raw API responses for debugging/reference
const rawDump = {
  pixabay: [],
  pexels: [],
  unsplash: []
};

/**
 * Builds a local index of existing images in the assets/images directory. It reads the directory, extracts the base name of each file (without extension), and maps it to the file name. 
 * @param {string} imagesDir - the path to the directory containing the local images.
 * @return {Map<string, string>} - a Map where the keys are the base names of the image files (e.g., "A001") and the values are the corresponding file names (e.g., "A001.jpg"). This index is used to link fetched metadata with existing local images when generating the assets.json file.
*/
function buildLocalImageIndex(imagesDir) {
  const index = new Map();

  try {
    const files = fs.readdirSync(imagesDir);

    for (const file of files) {
      const id = file.split("-")[0]?.toUpperCase();
      if (!/^A\d{3}$/.test(id)) continue;

      if (!index.has(id)) {
        index.set(id, file);
      }
    }
  } catch {
    return index;
  }

  return index;
}

const localImageIndex = buildLocalImageIndex(IMAGES_DIR);

/**
 * Determines the platform (Pixabay, Pexels, Unsplash) based on the image URL.
 * @param {string} url - The URL of the image.
 * @return {string|null} - The platform name or null if not recognized.
 */
function getPlatform(url) {
  if (url.includes("pixabay")) return "pixabay";
  if (url.includes("pexels")) return "pexels";
  if (url.includes("unsplash")) return "unsplash";
  return null;
}

/**
 * Extracts the image ID from a Pixabay URL using a regular expression. It looks for a pattern of a hyphen followed by digits at the end of the URL path.
 * @param {string} url - The URL of the Pixabay image.
 * @return {string|null} - The extracted image ID or null if the pattern is not found.
*/
function getPixabayId(url) {
  return url.match(/-(\d+)\/?$/)?.[1];
}

/**
 * Extracts the image ID from a Pexels URL using a regular expression. It looks for a pattern of a hyphen followed by digits after the "/photo/" segment.
 * @param {string} url - The URL of the Pexels image.
 * @return {string|null} - The extracted image ID or null if the pattern is not found.
 */
function getPexelsId(url) {
  return url.match(/photo\/.*-(\d+)/)?.[1];
}

function getUnsplashId(url) {
  const slugOrId = url.split("?")[0].replace(/\/$/, "").split("/").pop();
  return slugOrId?.split("-").pop();
}

/**
 * Extracts the file extension from a URL by looking for a dot followed by alphanumeric characters at the end of the URL path (ignoring query parameters). If no valid extension is found, it defaults to "JPG".
 * @param {string} url - The URL from which to extract the file extension.
 * @return {string} - The extracted file extension in uppercase (e.g., "JPG", "PNG"), or "JPG" if no valid extension is found.
 */
function getExtensionFromUrl(url) {
  if (!url) return "JPG";

  const match = String(url).split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toUpperCase() || "JPG";
}

/**
 * Copies a directory and its contents from a source path to a target path. It recursively copies all files and subdirectories, creating the target directory if it does not exist.
 * @param {string} sourceDir - the path of the source directory to copy.
 * @param {string} targetDir - the path of the target directory where the contents should be copied to.
 */
function getApiErrorMessage(data) {
  if (Array.isArray(data?.errors)) return data.errors.join(", ");
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  return "missing image data";
}

/**
 * Recursively copies a directory and its contents from a source path to a target path. It checks if the target directory exists and creates it if necessary, then iterates through each entry in the source directory. If an entry is a directory, it calls copyDir recursively; if it's a file, it copies it directly to the target location.
 * @param {string} sourceDir - the path of the source directory to copy.
 * @param {string} targetDir - the path of the target directory where the contents should be copied to.
 * @remarks - This function uses fs.readdirSync with the { withFileTypes: true } option to get directory entries as Dirent objects, allowing it to easily check if each entry is a file or a directory. It also uses fs.copyFileSync for efficient file copying.
*/
function humanFileSize(bytes) {
  if (bytes === null || bytes === undefined) return null;
  if (bytes < 1024) return `${bytes} B`;

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`;

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}


/**
 * Converts a string to title case (first letter capitalized, rest lowercase).
 * @param {string} value - The string to convert.
 * @returns {string} - The title-cased string.
 */
function toTitleCase(value) {
  if (!value) return "Photo";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Calculates the greatest common divisor (GCD) of two numbers.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} - The GCD of the two numbers.
 */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Builds a simplified aspect ratio string from two dimensions.
 * @param {number} w - The width.
 * @param {number} h - The height.
 * @returns {string} - The simplified aspect ratio (e.g., "16:9").
 */
function buildAspectRatio(w, h) {
  const div = gcd(w, h);
  return `${w / div}:${h / div}`;
}

/**
 * Returns the current date in YYYY-MM-DD format.
 * @returns {string} - The current date.
 */
function today() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Fetches image data from the Pixabay API by ID.
 * @param {string} id - The ID of the image to fetch.
 * @returns {Promise<Object>} - A promise resolving to the image data.
 */
async function fetchPixabay(id) {
  const res = await fetch(
    `https://pixabay.com/api/?key=${PIXABAY_KEY}&id=${id}`
  );
  return await res.json();
}

/**
 * Fetches image data from the Pexels API by ID.
 * @param {string} id - The ID of the image to fetch.
 * @returns {Promise<Object>} - A promise resolving to the image data.
 */
async function fetchPexels(id) {
  const res = await fetch(`https://api.pexels.com/v1/photos/${id}`, {
    headers: { Authorization: PEXELS_KEY }
  });
  return await res.json();
}

/**
 * Fetches image data from the Unsplash API by ID.
 * @param {string} id - The ID of the image to fetch.
 * @returns {Promise<Object>} - A promise resolving to the image data.
 */
async function fetchUnsplash(id) {
  const res = await fetch(`https://api.unsplash.com/photos/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Client-ID ${UNSPLASH_KEY}`
    }
  });
  return await res.json();
}

/**
 * Builds a structured asset object from the provided metadata fields. This function serves as a central point for creating asset objects with consistent formatting and default values. It takes in various parameters related to the image asset, such as its ID, name, type, platform, source URL, license information, author details, original format and resolution, aspect ratio, file name and format, file size, alt text, publication date, platform-specific ID, and direct image URL. It also looks up the local image path from the localImageIndex using the assetId. The resulting object includes all these fields along with a dateAccessed field set to the current date and a notes field initialized to null.
 * @param {Object} params - An object containing all the metadata fields for the asset.
 * @return {Object} - A structured asset object with the provided metadata and additional fields for local image path and notes.
 * @remarks - This function ensures that all asset objects are created with a consistent structure and includes logic to handle missing or optional fields. It also integrates the local image path based on the assetId, allowing for easy linking between the metadata and the actual image files in the assets/images directory.
 */
function buildAsset({
  assetId,
  assetName,
  assetType,
  platform,
  sourceUrl,
  license,
  author,
  originalFormat,
  originalResolution,
  aspectRatio,
  fileName,
  fileFormat,
  fileSize,
  altText,
  datePublished,
  platformId,
  directImageUrl
}) {

  return {
    assetId,
    assetName,
    assetType,
    platform,
    sourceUrl,
    license,
    author,
    originalFormat,
    originalResolution,
    aspectRatio,
    fileName,
    fileFormat,
    fileSize,
    altText,
    datePublished,
    dateAccessed: today(),
    directImageUrl,
    platformId,
    localImagePath: localImageIndex.get(assetId) || null,
    notes: null
  };
}

/**
 * Formats the raw API response from Pixabay into a structured asset object.
 * @param {Object} data - the raw API response from Pixabay for a specific photo.
 * @param {string} url - the original URL of the image on Pixabay, used for reference and linking back to the source.
 * @param {number} i - a sequential index used to generate a unique asset ID for the image.
 * @returns {Object|null} - a structured asset object containing metadata about the image, or null if the data is invalid or incomplete.
 */
function formatPixabay(data, url, i) {
  const img = data.hits?.[0];
  if (!img) return null;

  const fileFormat = getExtensionFromUrl(img.largeImageURL);

  return buildAsset({
    assetId: `A${String(i).padStart(3, "0")}`,
    assetName: `${img.user}-${img.id}`,
    assetType: toTitleCase(img.type),
    platform: "Pixabay",
    sourceUrl: url,
    license: {
      name: "Pixabay License",
      url: "https://pixabay.com/service/license-summary/"
    },
    author: {
      name: `${img.user} (${img.user_id})`,
      url: img.userURL
    },
    originalFormat: fileFormat,
    originalResolution: `${img.imageWidth} x ${img.imageHeight}`,
    aspectRatio: buildAspectRatio(img.imageWidth, img.imageHeight),
    fileName: `${img.user}-${img.id}.${fileFormat.toLowerCase()}`,
    fileFormat,
    fileSize: humanFileSize(img.imageSize),
    altText: img.tags || img.name || img.user,
    datePublished: null,
    platformId: img.id,
    directImageUrl: img.largeImageURL
  });
}
/**
 * Formats the raw API response from Pexels into a structured asset object. It extracts relevant metadata such as the photographer's name, image dimensions, and license information, and constructs an asset object that can be used in our assets.json file. If the necessary data is missing or invalid, it logs a warning and returns null to indicate that the asset could not be created.
 * @param {Object} data - the raw API response from Pexels for a specific photo.
 * @param {string} url - the original URL of the image on Pexels, used for reference and linking back to the source.
 * @param {number} i - a sequential index used to generate a unique asset ID for the image.
 * @returns {Object|null} - a structured asset object containing metadata about the image, or null if the data is invalid or incomplete.
 * @remarks - The function checks for the presence of a direct image URL in the API response and logs a warning if it is missing. It then builds an asset object with standardized fields such as assetId, assetName, assetType, platform, sourceUrl, license, author, originalFormat, originalResolution, aspectRatio, fileName, fileFormat, fileSize, altText, datePublished, platformId, and directImageUrl. The assetId is generated using the provided index to ensure uniqueness.
 */
function formatPexels(data, url, i) {
  const directImageUrl = data.src?.original;
  if (!directImageUrl) {
    console.warn(`Skipping Pexels URL "${url}": ${getApiErrorMessage(data)}`);
    return null;
  }

  const fileFormat = getExtensionFromUrl(directImageUrl);

  return buildAsset({
    assetId: `A${String(i).padStart(3, "0")}`,
    assetName: `${data.photographer}-${data.id}`,
    assetType: toTitleCase(data.asset_type),
    platform: "Pexels",
    sourceUrl: url,
    license: {
      name: "Pexels License",
      url: "https://www.pexels.com/license/"
    },
    author: {
      name: data.photographer,
      url: data.photographer_url
    },
    originalFormat: fileFormat,
    originalResolution: `${data.width} x ${data.height}`,
    aspectRatio: buildAspectRatio(data.width, data.height),
    fileName: `${data.id}.${fileFormat.toLowerCase()}`,
    fileFormat,
    fileSize: null,
    altText: data.alt || `${data.photographer} photo`,
    datePublished: null,
    platformId: data.id,
    directImageUrl
  });
}

/**
 * Formats the raw API response from Unsplash into a structured asset object.
 * @param {Object} data - the raw API response from Unsplash for a specific photo.
 * @param {string} url - the original URL of the image on Unsplash, used for reference and linking back to the source.
 * @param {number} i - a sequential index used to generate a unique asset ID for the image.
 * @returns {Object|null} - a structured asset object containing metadata about the image, or null if the data is invalid or incomplete.
 */
function formatUnsplash(data, url, i) {
  const directImageUrl = data.urls?.full || data.urls?.raw || data.links?.download;
  if (!directImageUrl) {
    console.warn(`Skipping Unsplash URL "${url}": ${getApiErrorMessage(data)}`);
    return null;
  }

  const fileFormat = getExtensionFromUrl(directImageUrl);

  return buildAsset({
    assetId: `A${String(i).padStart(3, "0")}`,
    assetName: `unsplash-${data.id}`,
    assetType: toTitleCase(data.asset_type),
    platform: "Unsplash",
    sourceUrl: url,
    license: {
      name: "Unsplash License",
      url: "https://unsplash.com/license"
    },
    author: {
      name: data.user?.name || data.user?.username || "Unknown",
      url: data.user?.links?.html || "https://unsplash.com"
    },
    originalFormat: fileFormat,
    originalResolution: `${data.width} x ${data.height}`,
    aspectRatio: buildAspectRatio(data.width, data.height),
    fileName: `${data.slug || data.id}.${fileFormat.toLowerCase()}`,
    fileFormat,
    fileSize: null,
    altText: data.alt_description || data.description || data.slug || data.id,
    datePublished: data.created_at,
    platformId: data.id,
    directImageUrl
  });
}


/**
 * Optimises a single image file by resizing it to a maximum of 1920x1080 and converting it to AVIF and WebP formats. It saves the optimised images in the output directory with the same base name and appropriate extensions.
 * @param {string} file - the name of the image file to optimise, which should be located in the input directory.
 * @returns {Promise<void>} - a promise that resolves when the optimisation process for the image is complete.
 * @remarks - The function first checks if the file is a source image and if optimised versions already exist. If not, it uses the Sharp library to read the image, rotate it based on EXIF data, resize it to fit within the target dimensions while maintaining aspect ratio, and then saves the optimised versions in AVIF and WebP formats with specified quality settings.
*/
async function build() {
  const assets = [];

  let i = 1;

  for (const url of urls) {
    const platform = getPlatform(url);

    if (platform === "pixabay") {
      const id = getPixabayId(url);
      const raw = await fetchPixabay(id);

      rawDump.pixabay.push(raw);

      const asset = formatPixabay(raw, url, i);
      if (asset) {
        assets.push(asset);
        i++;
      }
    } else if (platform === "pexels") {
      const id = getPexelsId(url);
      const raw = await fetchPexels(id);

      rawDump.pexels.push(raw);

      const asset = formatPexels(raw, url, i);
      if (asset) {
        assets.push(asset);
        i++;
      }
    } else if (platform === "unsplash") {
      const id = getUnsplashId(url);
      const raw = await fetchUnsplash(id);

      rawDump.unsplash.push(raw);

      const asset = formatUnsplash(raw, url, i);
      if (asset) {
        assets.push(asset);
        i++;
      }
    }
  }

  return { assets };
}
// The script is executed immediately, and upon completion, it writes the generated assets.json and dump.json files to the specified output directory. 
(async () => {
  const result = await build();

  fs.mkdirSync(ASSETS_OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(
    ASSETS_OUTPUT_FILE,
    JSON.stringify(result, null, 2)
  );

  fs.writeFileSync(
    DUMP_OUTPUT_FILE,
    JSON.stringify(rawDump, null, 2)
  );

  console.log(`${ASSETS_OUTPUT_FILE} generated`);
  console.log(`${DUMP_OUTPUT_FILE} generated (grouped raw API data)`);
})();
