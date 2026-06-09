// This script builds the static site by copying files from the docs/ directory to dist/, minifying CSS and JS assets, rewriting asset paths in HTML files AND generating a sitemap.xml file based on the site's structure.
// It uses CleanCSS for CSS minification, html-minifier-terser for HTML minification, and terser for JavaScript minification.
//
// The script is designed to be run with Node.js and assumes a specific project structure where source files are located in the docs/ directory and assets are in separate css/ and js/ directories at the root level.
// After running this script, the dist/ directory will contain the optimised version of the site ready for deployment.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import CleanCSS from "clean-css";
import { minify as minifyHtml } from "html-minifier-terser";
import { minify as minifyJs } from "terser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDocsDir = path.join(rootDir, "docs");
const distDir = path.join(rootDir, "dist");
const siteUrl = "https://rylvion.github.io/pulse-vr";

/**
 * Removes a directory and all its contents.
 * @param {string} targetDir The directory to remove.
 */
function removeDir(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

/**
 * Copies a directory and all its contents to a new location.
 * @param {string} sourceDir The directory to copy from.
 * @param {string} targetDir The directory to copy to.
 */
function copyDir(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * Retrieves all files in a directory that match a given predicate.
 * @param {string} dir The directory to search.
 * @param {Function} predicate The function to test each file against.
 * @returns {string[]} An array of file paths that match the predicate.
 */
function getFiles(dir, predicate) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...getFiles(fullPath, predicate));
      continue;
    }

    if (entry.isFile() && predicate(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Generates a sitemap.xml file based on the site's structure.
 */
function generateSiteMap() {
  const htmlFiles = getFiles(distDir, (name) => name.endsWith(".html"));

  const today = new Date().toISOString().split("T")[0];

  const excluded = new Set([
    "game.html",
  ]);

  const seoConfig = {
    "": { priority: "1.0", changefreq: "weekly" },
    "about/": { priority: "0.7", changefreq: "monthly" },
    "account/": { priority: "0.6", changefreq: "monthly" },
    "pricing/": { priority: "0.8", changefreq: "monthly" },
    "game-library/": { priority: "0.8", changefreq: "weekly" },
    "bookings/": { priority: "0.9", changefreq: "weekly" },
    "bookings/date-time/": { priority: "0.9", changefreq: "weekly" },
    "bookings/group-size/": { priority: "0.9", changefreq: "weekly" },
    "bookings/confirm/": { priority: "0.9", changefreq: "weekly" },
    "bookings/summary/": { priority: "0.9", changefreq: "weekly" },
    "bookings/success/": { priority: "0.4", changefreq: "yearly" },
  };

  const urls = htmlFiles
    .map((file) => {
      let relativePath = path.relative(distDir, file).replace(/\\/g, "/");

      if (excluded.has(relativePath)) return null;

      if (relativePath === "index.html") {
        relativePath = "";
      } else if (relativePath.endsWith("/index.html")) {
        relativePath = relativePath.replace(/index\.html$/, "");
      }

      const config = seoConfig[relativePath] || {
        priority: "0.5",
        changefreq: "monthly",
      };

      return {
        loc: `${siteUrl}/${relativePath}`,
        lastmod: today,
        changefreq: config.changefreq,
        priority: config.priority,
      };
    })
    .filter(Boolean);

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map((u) =>
        `  <url>
              <loc>${u.loc}</loc>
              <lastmod>${u.lastmod}</lastmod>
              <changefreq>${u.changefreq}</changefreq>
              <priority>${u.priority}</priority>
           </url>`,
      ).join("\n")}
    </urlset>`;

  fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemapContent, "utf8");
}

/**
 * Provides options for HTML minification to optimize the output while preserving necessary whitespace and attributes for correct rendering.
 * @returns {Object} The HTML minification options.
 */
function htmlOptions() {
  return {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
  };
}

/**
 * Rewrites asset paths in the HTML source to point to the correct locations in the distribution directory.
 * @param {string} htmlSource The HTML source code.
 * @param {number} depth The depth of the current file in the directory structure.
 * @param {string} folderName The name of the folder containing the assets.
 * @returns {string} The HTML source code with rewritten asset paths.
 */
function rewriteAssetPaths(htmlSource, depth, folderName) {
  const sourcePrefix = `${"../".repeat(depth + 1)}${folderName}/`;
  const distPrefix = `${depth === 0 ? "./" : "../".repeat(depth)}${folderName}/`;
  return htmlSource.split(sourcePrefix).join(distPrefix);
}

/**
 * Builds the site by copying files, minifying assets, and generating the sitemap.
 * @returns {Promise<void>} A promise that resolves when the build is complete.
 */
async function build() {
  removeDir(distDir);
  copyDir(sourceDocsDir, distDir);

  const sourceAssetsDir = path.join(rootDir, "assets");
  const sourceCssDir = path.join(rootDir, "css");
  const sourceJsDir = path.join(rootDir, "js");

  if (fs.existsSync(sourceAssetsDir))
    copyDir(sourceAssetsDir, path.join(distDir, "assets"));
  if (fs.existsSync(sourceCssDir))
    copyDir(sourceCssDir, path.join(distDir, "css"));
  if (fs.existsSync(sourceJsDir))
    copyDir(sourceJsDir, path.join(distDir, "js"));

  const cssFile = path.join(distDir, "css", "styles.css");
  if (fs.existsSync(cssFile)) {
    const cssSource = fs.readFileSync(cssFile, "utf8");
    const cssOutput = new CleanCSS({ level: 2 }).minify(cssSource);
    if (cssOutput.errors.length > 0) {
      throw new Error(cssOutput.errors.join("\n"));
    }
    fs.writeFileSync(cssFile, cssOutput.styles, "utf8");
  }

  const jsFiles = getFiles(path.join(distDir, "js"), (name) =>
    name.endsWith(".js"),
  );
  for (const jsFile of jsFiles) {
    const jsSource = fs.readFileSync(jsFile, "utf8");
    const result = await minifyJs(jsSource, {
      compress: true,
      mangle: true,
      format: {
        comments: false,
      },
    });

    fs.writeFileSync(jsFile, result.code || "", "utf8");
  }

  const jsonFiles = getFiles(distDir, (name) => name.endsWith(".json"));

  for (const jsonFile of jsonFiles) {
    const jsonSource = fs.readFileSync(jsonFile, "utf8");

    const minifiedJson = JSON.stringify(JSON.parse(jsonSource));

    fs.writeFileSync(jsonFile, minifiedJson, "utf8");
  }

  const htmlFiles = getFiles(distDir, (name) => name.endsWith(".html"));
  for (const htmlFile of htmlFiles) {
    const htmlSource = fs.readFileSync(htmlFile, "utf8");
    const relativeHtmlPath = path.relative(distDir, htmlFile);
    const depth =
      relativeHtmlPath === "index.html"
        ? 0
        : path
          .dirname(relativeHtmlPath)
          .split(path.sep)
          .filter((segment) => segment && segment !== ".").length;
    let rewrittenHtml = rewriteAssetPaths(htmlSource, depth, "css");
    rewrittenHtml = rewriteAssetPaths(rewrittenHtml, depth, "js");
    const htmlOutput = await minifyHtml(rewrittenHtml, {
      ...htmlOptions(),
      minifyCSS: false,
      minifyJS: false,
    });
    fs.writeFileSync(htmlFile, htmlOutput, "utf8");
  }

  console.log(
    `Built ${htmlFiles.length} HTML files, ${jsFiles.length} JS files and 1 CSS file into dist/`,
  );
  generateSiteMap();
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
