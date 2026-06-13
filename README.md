# Pulse VR

## Overview
As a junior designer, I developed a static website for Pulse VR, a high-end virtual reality gaming centre. The purpose of the website is to promote the VR experience and provide users with an easy way to explore games, view pricing, and make bookings.

The target audience for the website includes teenagers, young adults, and casual users who may be new to VR. The website features a home page that highlights the immersive gaming experience, a game library with detailed descriptions and images, a booking system for scheduling sessions, and information about pricing and membership options. 

Additionally, the website incorporates accessibility features to ensure an inclusive experience for all users. 

See more at [Pulse VR Gaming Centre](https://rylvion.github.io/pulse-vr/)

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+) [.mjs & .js]
- Git for version control
- Github for hosting
- Github Pages for deployment
- Unsplash/Pexels/Pixabay APIs for image sourcing
- Local JSON files for game data storage
- Favicon generated using https://favicon.io/favicon-generator/ 
 - text: "PV"
 - background: Rounded
 - font: "Leckerli One"
 - Font Variant: Regular 400 Normal
 - Font Size: 90px
 - Font Colour: #FFF
 - Background Colour: #80F

## Features
- Browse VR games with detailed descriptions and images
- Check available session times and book directly through the site
- Responsive design for optimal viewing on various devices
- Game Library with pagination for easy navigation through a large selection of games
- Dynamic content loading for improved performance and user experience
- Integration with Unsplash, Pexels, and Pixabay APIs for high-quality images
- Local JSON files for efficient data management and retrieval
- Accessibility features to ensure an inclusive user experience

### Optimisation Techniques
- responsive images use `srcset` and `sizes` attributes
- it uses `.AVIF` with `.WEBP` and `.JPG` fallbacks for browser compatibility and optimal performance. (placeholder use `placehold.co/` with the same format and dimensions as the original image to maintain layout stability while loading)
- the website is further optimised with minified CSS/JS/JSON and HTML files for web performance
- Placeholder images used during loading to prevent Cumulative Layout Shift (CLS) and improve perceived performance.
- Pagination implemented for game library, home page, and bookings page to improve load times and user experience by loading content in smaller chunks.


## Installation and Usage
To run the website locally, follow these steps:
1. Clone the repository: `git clone https://github.com/rylvion/pulse-vr.git`
2. Navigate to the project directory: `cd pulse-vr`
3. Open `docs/index.html` in your web browser to view the website or install/use Live Server extension in VS Code to run the website with a local development server for better performance and to avoid CORS issues when fetching data.


### Data Management and Image Optimisation
The project includes scripts for managing game data and optimising images. To use these scripts, follow the instructions below:

1. Navigate to the `scripts/` directory: `cd scripts`
2. Run `npm install` to install any necessary dependencies.
3. Configure API keys in .env (required for fetcher.mjs only)

#### Available Scripts:
 - `node fetcher.mjs` - Fetches and updates image meta data and images from APIs. Outputs to assets/data/assets.json.
 - `python excel-converter.py` - Converts `assets.json` for visualisation of asset in human-readable format in excel. The output file will be saved as `../assets/data/assets.xlsx` in the same directory.
 - `node optimise-images.mjs` - Compresses, Optimises, and converts the images in `../assets/images/` for web use, itll create 3 versions of each image in `.AVIF`, `.WEBP`, and `.JPG` formats for optimal performance and  browser compatibility. The optimised images will be saved in `../assets/images/optimised/` with the same filename as the original image but with the appropriate extension for each format.

 To access Pulse VR gaming center website online visit: [https://rylvion.github.io/pulse-vr/](https://rylvion.github.io/pulse-vr/)