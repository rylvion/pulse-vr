-- ignore the file extension its just for syntax highlighting purposes, this is not actual SQL code
START
    IF document is still loading THEN
        WAIT for DOMContentLoaded
    ELSE
        CALL initHomePage()
    END IF


    DECLARE GLOBAL homeIndex = 0
    DECLARE CONSTANT PAGE_SIZE = 4
    DECLARE GLOBAL homeGames = EMPTY LIST
    DECLARE GLOBAL activeGame = NULL


    FUNCTION initHomePage()

        IF element '#game-cards' DOES NOT EXIST THEN
            RETURN
        END IF

        CALL loadGamesDatabase()
            FETCH '/assets/data/games.json'
            RETURN list of games
        END CALL

        CALL attachImagePaths(games)
            FOR EACH game IN games DO
                RESOLVE image format (JPG / WEBP / AVIF)
                SET game.imagePath
            END FOR
        END CALL

        SET homeGames TO processed games list

        CALL renderHomeBatch()
        CALL setupCarouselControls()
        CALL setupCardClickHandler()

    END FUNCTION


    FUNCTION renderHomeBatch()

        SET track TO element '#game-cards'
        IF track DOES NOT EXIST THEN
            RETURN
        END IF

        SET start TO homeIndex
        SET end TO homeIndex + PAGE_SIZE
        SET visibleGames TO SUBLIST homeGames FROM start TO end

        REMOVE all game-card elements from track
        PRESERVE navigation arrow elements

        FOR EACH game IN visibleGames DO
            CREATE card WITH:
                image = game.imagePath
                title = game.title
                genre = FIRST ITEM IN game.genre OR "VR"
                rating = CALL buildStarString(game.rating)
            ADD card TO track
        END FOR

        ENSURE navigation arrows remain inside track

    END FUNCTION

    FUNCTION setupCarouselControls()

        SET track TO element '#game-cards'
        SET leftArrow TO left navigation button
        SET rightArrow TO right navigation button

        WHEN leftArrow CLICKED DO
            SET homeIndex TO homeIndex - PAGE_SIZE
            IF homeIndex < 0 THEN
                SET homeIndex TO 0
            END IF

            CALL renderHomeBatch()
        END WHEN


        WHEN rightArrow CLICKED DO

            SET homeIndex TO homeIndex + PAGE_SIZE
            SET maxIndex TO (length of homeGames - PAGE_SIZE)

            IF homeIndex > maxIndex THEN
                SET homeIndex TO maxIndex
            END IF

            CALL renderHomeBatch()
        END WHEN

    END FUNCTION


    FUNCTION setupCardClickHandler()

        WHEN user clicks inside '#game-cards' DO

            SET clickedCard TO nearest '.game-card'
            IF clickedCard DOES NOT EXIST THEN
                RETURN
            END IF
            SET gameId TO ATTRIBUTE "game-id" OF clickedCard
            FIND game IN homeGames WHERE game.id == gameId

            IF game EXISTS THEN
                CALL openGameModal(game)
            END IF
        END WHEN
    END FUNCTION


    FUNCTION openGameModal(game)

        SET activeGame TO game
        SET modal TO element '#game-preview-modal'
        BUILD modal content INCLUDING:
            image (game.imagePath)
            title
            short description
            genre
            difficulty
            player range
            duration
            rating
            accessibility information
        DISPLAY modal
        WHEN close button CLICKED THEN
            CALL closeGameModal()
        END WHEN

        WHEN backdrop CLICKED THEN
            CALL closeGameModal()
        END WHEN

        WHEN ESC key PRESSED THEN
            CALL closeGameModal()
        END WHEN

        WHEN "See Details" CLICKED THEN
            REDIRECT TO "game.html?id=" + game.id + "&redir=currentPage"
        END WHEN
    END FUNCTION


    FUNCTION closeGameModal()
        HIDE modal
        CLEAR modal content
        SET activeGame TO NULL
    END FUNCTION

    FUNCTION buildStarString(value)
        SET rating TO NUMBER(value)

        IF rating IS NOT VALID THEN
            SET rating TO 0
        END IF

        IF rating < 0 THEN SET rating TO 0
        IF rating > 5 THEN SET rating TO 5

        SET fullStars TO FLOOR(rating)
        SET halfStar TO 1 IF (rating - fullStars >= 0.5) ELSE 0
        SET emptyStars TO 5 - fullStars - halfStar

        RETURN:
            "★" repeated fullStars +
            (IF halfStar == 1 THEN "⯪" ELSE "") +
            "☆" repeated emptyStars
    END FUNCTION
END