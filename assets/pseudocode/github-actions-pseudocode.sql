-- ignore the file extension its just for syntax highlighting purposes, this is not actual SQL code
START
    IF (event = "push" AND branch = "main") OR event = "manual_trigger" THEN -- manual_trigger is workflow_dispatch
        CALL deploymentWorkflow()
    END IF

    CALL deploymentWorkflow()

    FUNCTION deploymentWorkflow()
        SET permissions AS
            contents = "read"
            pages = "write"
            id-token = "write"
        END SET

        SET concurrency AS
            group = "pages"
            cancel-in-progress = TRUE
        END SET

        SET environment AS
            OS = "ubuntu-latest"
        END SET


        CALL checkoutRepository()
        CALL setupNodeEnvironment(nodeVersion = 18)
        CALL installDependencies(directory = "/scripts")
        CALL buildDeploymentAssets()
        CALL configurePages()
        CALL uploadArtifact(path = "dist")
        CALL deployToPages()
    END FUNCTION

    FUNCTION checkoutRepository()
        USE actions/checkout@v4
        CLONE repository into runner
        LOAD project structure
    END FUNCTION

    FUNCTION setupNodeEnvironment(nodeVersion)
        USE actions/setup-node@v4 WITH nodeVersion
        INSTALL Node.js runtime
        CONFIGURE npm environment
    END FUNCTION



    FUNCTION installDependencies(directory)
        SET workingDirectory TO directory
        RUN command "npm install --no-fund --no-audit"
        READ package.json
        INSTALL dependencies:
            clean-css
            terser
            html-minifier-terser
            sharp
        END INSTALL
    END FUNCTION



    FUNCTION buildDeploymentAssets()
        RUN command "npm run build:deploy-assets"
        CALL buildSiteProcess()
    END FUNCTION



    FUNCTION buildSiteProcess()

        IF "dist/" EXISTS THEN
            DELETE "dist/" recursively
        END IF

        COPY "docs/" TO "dist/"
        COPY "assets/" TO "dist/assets/"
        COPY "css/" TO "dist/css/"
        COPY "js/" TO "dist/js/"

        CALL minifyCSS()
        CALL minifyJSFiles()
        CALL minifyJSONFiles()
        CALL minifyHTMLFiles()
        CALL generateSitemap()

        PRINT "Deployment assets built successfully"
    END FUNCTION



    FUNCTION minifyCSS()
        IF "dist/css/styles.css" EXISTS THEN
            READ file
            APPLY CleanCSS level 2 optimisation
            IF errors EXIST THEN
                TERMINATE function WITH error
            END IF
            WRITE minified CSS back
        END IF
    END FUNCTION



    FUNCTION minifyJSFiles()
        SET jsFiles TO all .js files in "dist/js/"
        
        FOR EACH file IN jsFiles DO
            READ file
            APPLY Terser:
                compress = TRUE
                mangle = TRUE
            WRITE file
        END FOR
    END FUNCTION


    FUNCTION minifyJSONFiles()

        SET jsonFiles TO all .json files in "dist/"

        FOR EACH file IN jsonFiles DO
            READ JSON file
            PARSE content
            STRINGIFY minified
            WRITE file
        END FOR
    END FUNCTION


    FUNCTION minifyHTMLFiles()
        SET htmlFiles TO all .html files in "dist/"
        
        FOR EACH file IN htmlFiles DO
            READ file

            CALCULATE depth:
                IF file = "index.html" THEN
                    depth = 0
                ELSE
                    SPLIT path into folders
                    REMOVE filename
                    depth = number of folders
                END IF
            END CALCULATE

            REWRITE asset paths for CSS and JS

            APPLY HTML minification WITH
                collapseWhitespace = TRUE
                removeComments = TRUE
                removeRedundantAttributes = TRUE
                removeScriptTypeAttributes = TRUE
                removeStyleLinkTypeAttributes = TRUE
                useShortDoctype = TRUE
            END APPLY
            WRITE file
        END FOR

    END FUNCTION


    FUNCTION generateSitemap()
        SET htmlFiles TO all .html files in "dist/"
        SET today TO current ISO date
        SET excludedPages TO ["game.html"]

        SET seoConfig to DICTIONARY:
            "": { priority: 1.0, changefreq: "weekly" },
            "about/": { priority: 0.7, changefreq: "monthly" },
            "account/": { priority: 0.7, changefreq: "monthly" },
            "pricing/": { priority: 0.7, changefreq: "monthly" },
            "game-library/": { priority: 0.7, changefreq: "monthly" },
            "bookings/": { priority: 0.9, changefreq: "weekly" },
            "bookings/group-size/": { priority: 0.9, changefreq: "weekly" },
            "bookings/confirm/": { priority: 0.9, changefreq: "weekly" },
            "bookings/summary/": { priority: 0.9, changefreq: "weekly" },
            "bookings/success/": { priority: 0.4, changefreq: "yearly" },
            

        FOR EACH file IN htmlFiles DO
            CONVERT file path TO route

            IF file IN excludedPages THEN
                CONTINUE
            END IF

            IF file = "index.html" THEN
                route = "/"
            ELSE IF file ENDS WITH "/index.html" THEN
                route = folder path
            ELSE
                route = file path WITHOUT ".html"
            END IF

            SET priority = 0.5
            SET changefreq = "monthly"
            ADD route TO sitemap list
        END FOR

        GENERATE sitemap.xml
        WRITE "dist/sitemap.xml"
    END FUNCTION

    FUNCTION uploadArtifact(path)
        USE actions/upload-pages-artifact@v3
        PACKAGE path
        UPLOAD artifact
    END FUNCTION

    FUNCTION deployToPages()
        USE actions/deploy-pages@v4
        FETCH artifact
        DEPLOY to GitHub Pages
        REPLACE previous deployment
    END FUNCTION

END