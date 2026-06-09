# Pulse VR

## Overview
As a junior designer, I developed a static website for Pulse VR, a high-end virtual reality gaming centre. The purpose of the website is to promote the VR experience and provide users with an easy way to explore games, view pricing, and make bookings.

The target audience for the website includes teenagers, young adults, and casual users who may be new to VR. The website features a home page that highlights the immersive gaming experience, a game library with detailed descriptions and images, a booking system for scheduling sessions, and information about pricing and membership options. 

Additionally, the website incorporates accessibility features to ensure an inclusive experience for all users.

## Technologies Used
- HTML5
- CSS3
- JavaScript (ES6+) [.mjs & .js]
- Git for version control
- Github for hosting
- Github Pages for deployment
- Unsplash/Pexels/Pixabay APIs for image sourcing
- Local JSON files for game data storage
- Responsive design techniques for mobile compatibility
- Accessibility best practices for inclusive design

## Features
- Browse VR games with detailed descriptions and images
- Check available session times and book directly through the site
- Responsive design for optimal viewing on various devices
- Blog section for news and updates about VR gaming
- Contact page for customer support and inquiries
- Integration with Unsplash, Pexels, and Pixabay APIs for high-quality images
- Local JSON files for efficient data management and retrieval
- Accessibility features to ensure an inclusive user experience

### Optimisation notes
- images use `srcset` and `sizes` with lazy loading.
- it uses `.AVIF` with `.WEBP` and `.JPG` fallbacks for browser compatibility and optimal performance. (placeholder use `placehold.co/` with the same format and dimensions as the original image to maintain layout stability while loading)
- the website is further optimised with minified CSS/JS/JSON and HTML files, and the images can be optimised with the provided script for web use.


## Installation and Usage
To run the website locally, follow these steps:
1. Clone the repository: `git clone https://github.com/rylvion/pulse-vr.git`
2. Navigate to the project directory: `cd pulse-vr`
3. Open `docs/index.html` in your web browser to view the website.
4. Install/Use Live Server extension in VS Code to run the website with a local development server for better performance and to avoid CORS issues when fetching data.


### Data Management and Image Optimisation
The project includes scripts for managing game data and optimising images. To use these scripts, follow the instructions below:

1. Navigate to the `scripts/` directory: `cd scripts`
2. Run `npm install` to install any necessary dependencies.
3. Fill out `.env` with your API keys for Unsplash, Pexels, and Pixabay, if adding or updating images. Only `fetcher.mjs` requires these keys, the other scripts can be run without them.
4. Run any desired scripts like
 - `node fetcher.mjs` to fetch and update game data and images from the APIs. The output will be saved in `../assets/data/assets.json` in the same directory.
 - `excel-converter.py` to convert `assets.json` for visualisation of asset in human-readable format in excel. The output file will be saved as `../assets/data/assets.xlsx` in the same directory.
 - `optimise-images.mjs` to optimise the images in `../assets/images/` for web use. The output will go into a new folder in the same directory called `../assets/images/optimised/`. You can then replace the original images with the optimised ones in your project.

 To access Pulse VR gaming center website online visit: [https://rylvion.github.io/pulse-vr/](https://rylvion.github.io/pulse-vr/)