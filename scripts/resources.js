// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
};

const projectsData = {
    people: {
        title: "INFLUENTIAL PEOPLE",
        items: [
            {
                id: "swartz",
                name: "Aaron Swartz",
                role: "Programmer and Political Activist",
                description: `My biggest inspiration <3 and celebrity crush!!<br><br>
                    
                    <img src="../images/resources/people/aaron2.png" style="width:60%" alt="Aaron S."><br><br>
                    Please take the time to familiarize yourself with him:<br><br>
                    
                
                    • <a href="https://www.youtube.com/watch?v=9vz06QO3UkQ" target="_blank" 
                    class="text-green-600 hover:underline">The Internet's Own Boy</a> A great documentary about Aaron's life<br>
                
                    • <a href="https://www.newyorker.com/magazine/2013/03/11/requiem-for-a-dream" target="_blank" 
                    class="text-green-600 hover:underline">A Good New Yorker Article</a><br><br>
                    
                    <img src="../images/resources/people/aaron.png" style="width:40%" alt="Aaron S."><br><br>
                
                   He was just a kid!! And he would have never given up like this.. 
                   `,
                image: "../images/resources/people/aaron3.jpg"
            },
            {
                id: "ilya",
                name: "Ilya Zhitomirskiy",
                role: "Programmer, Whistleblower",
                description: `

                        <br><br>
                        
                    <img src="../images/resources/people/ilya.jpg" style="width: 80%" alt="Ilya Z."><br><br>
                
                    • <a href="https://en.wikipedia.org/wiki/Ilya_Zhitomirskiy" target="_blank" 
                    class="text-green-600 hover:underline">About</a><br>
                    
                    `,
                image: "../images/resources/people/ilya.jpg"
            },

            {
                id: "assange",
                name: "Julian Assange",
                role: "Founder of WikiLeaks",
                description: `

                   <img src="../images/resources/people/julian.png" style="width: 80%" alt="Assange"><br><br>

                
                    • <a href="https://www.youtube.com/watch?v=mLI-tzJB540" target="_blank" 
                    class="text-green-600 hover:underline">Julian Assange & WikiLeaks</a><br>
                    • <a href="https://www.reddit.com/user/_JulianAssange/" target="_blank" 
                    class="text-green-600 hover:underline">Q&A Transcripts</a><br>
                
                    `,
                image: "../images/resources/people/julian.png"
            },

            {
                id: "gardner",
                name: "Martin Gardner",
                role: "Mathematical Games Columnist & Science Writer",
                description: `Martin Gardner is one of the best lecturers and writers when it comes to
                    complex subjects. He makes math and science as interesting as a fantasy novel! My
                    father introduced me to him, he used to read him as a little boy (translated in
                    Russian)<br><br>
                    
                    <img src="../images/resources/people/Martin_Gardner.jpg" style="width: 80%; margin: 0 auto" alt="Gardner"><br><br>
                
                    • <a href="https://www.youtube.com/watch?v=eqHZY7FYwx0" target="_blank" 
                    class="text-green-600 hover:underline">Celebrating Mind: The Legacy of Martin Gardner</a><br>
                
                    • <a href="https://www.gathering4gardner.org/" target="_blank" 
                    class="text-green-600 hover:underline">Gathering 4 Gardner Foundation</a><br><br>
                    
                    • <a href="https://ia801004.us.archive.org/17/items/martingardnerthecolossalbookofmathematics/Martin%20Gardner%20-%20The%20Colossal%20Book%20Of%20Mathematics.pdf" target="_blank" 
                    class="text-green-600 hover:underline">PDF of The Colossal Book of Mathematics</a><br><br>
                
                    His mathematical puzzles and games have inspired generations of 
                    mathematicians and enthusiasts. Some of his most famous works include 
                    "Hexaflexagons", "The Scientific American Book of Mathematical Puzzles 
                    and Diversions", and "The Annotated Alice".<br><br>
                
                    Gardner's work bridged recreational mathematics with serious mathematical 
                    concepts, making complex ideas accessible to the general public. His 
                    influence continues today through events like the Gathering 4 Gardner 
                    (G4G) conferences.`,
                image: "../images/resources/people/Martin_Gardner.jpg"
            },

            {
                id: "shannon",
                name: "Claude Elwood Shannon",
                role: "American mathematician and electrical engineer\n",
                description: `

                        <br><br>
                        
                        <img src="../images/resources/people/shannon.png" style="width: 80%; margin: 0 auto" alt="Shannon"><br><br>
                
                    • <a href="https://www.youtube.com/watch?v=z2Whj_nL-x8" target="_blank" 
                    class="text-green-600 hover:underline">Video: Father of the Information Age</a><br>
                
                    `,
                image: "../images/resources/people/shannon.png"
            },

            {
                id: "terence",
                name: "Terence Tao",
                role: "Mathematician",
                description: `

                        <br><br>
                        <img src="../images/resources/people/terence.jpg" style="width: 80%; margin: 0 auto" alt="Terence"><br><br>
                
                    • <a href="https://www.youtube.com/watch?v=MXJ-zpJeY3E" target="_blank" 
                    class="text-green-600 hover:underline">Video: The Worlds Best Mathematician</a><br>
                    • <a href="https://www.math.ucla.edu/~tao/arrow.pdf" target="_blank" 
                    class="text-green-600 hover:underline">Arrow's Theorem</a><br>
                 
                
                    `,
                image: "../images/resources/people/terence.jpg"
            },

            {
                id: "curtis",
                name: "Adam Curtis",
                role: "English Documentary Filmmaker",
                description: `

                        <br><br>
                        <img src="../images/resources/people/adam.png" style="width: 80%; margin: 0 auto" alt="Curtis"><br><br>
                
                    • <a href="https://thoughtmaybe.com/by/adam-curtis/" target="_blank" 
                    class="text-green-600 hover:underline">Documentaries</a><br>
                    • <a href="https://www.youtube.com/watch?v=Gr7T07WfIhM&pp=ygUeaHlwZXJub3JtYWxpc2F0aW9uIGRvY3VtZW50YXJ5">Hypernormalisation</a><br>
                
                    `,
                image: "../images/resources/people/adam.png"
            },



            {
                id: "zbi",
                name: "Zbigniew Rybczyński",
                role: "Polish Filmmaker",
                description: `
                        Best experimental animated / multimedia artist!
                        <br><br>
                        Videos: <br><br>
                        <img src="../images/resources/people/zbi.jpg" style="width: 80%; margin: 0 auto" alt="Zbigniew"><br><br>
                
                    • <a href="https://www.youtube.com/watch?v=z27z7oLQb3o" target="_blank" 
                    class="text-green-600 hover:underline">Tango</a><br>
                    • <a href="https://www.youtube.com/watch?v=ihqdvT-iaC0" target="_blank" 
                    class="text-green-600 hover:underline">The Orchestra</a><br>
                    • <a href="https://www.youtube.com/watch?v=jhQftemBkF8" target="_blank" 
                    class="text-green-600 hover:underline">Steps</a><br>
                
                    `,
                image: "../images/resources/people/zbi.jpg"
            },

            {
                id: "barley",
                name: "Scott Barley",
                role: "Filmmaker and artist",
                description: `
                     <br><br>
                      
                    <img src="../images/resources/people/barley.png" style="width: 80%; margin: 0 auto" alt="Barley"><br><br>
                
                    Videos: <br><br>
                    • <a href="https://scottbarley.com/" target="_blank" 
                    class="text-green-600 hover:underline">Scott Barley</a><br>
                    • <a href="https://www.youtube.com/watch?v=uZPePp3byRU" target="_blank" 
                    class="text-green-600 hover:underline">Film: Sleep Has Her House</a><br>
                    `,
                image: "../images/resources/people/barley.png"
            },

            {
                id: "banuel",
                name: "Luis Buñuel",
                role: "Spanish-Mexican filmmaker",
                description: `
                        <br><br>
                        <img src="../images/resources/people/banuel.jpg" style="width: 80%; margin: 0 auto" alt="Banuel"><br><br>
                        Videos: <br><br>
                
                    • <a href="https://www.youtube.com/watch?v=btSMeU5knuM" target="_blank" 
                    class="text-green-600 hover:underline">Who is Luis Buñuel?</a><br>
                
                    `,
                image: "../images/resources/people/banuel.jpg"
            },

            {
                id: "heidegger",
                name: "Martin Heidegger",
                role: "German philosopher",
                description: `
                        <br><br>
                        <img src="../images/resources/people/heidegger.png" style="width: 80%; margin: 0 auto" alt="Heideggar"><br><br>
                        Videos: <br><br>
                
                    • <a href="https://en.m.wikipedia.org/wiki/Martin_Heidegger" target="_blank" 
                    class="text-green-600 hover:underline">About</a><br>
                
                    `,
                image: "../images/resources/people/heidegger.png"
            },

            {
                id: "land",
                name: "Nick Land",
                role: "Philosopher",
                description: `
                        <br><br>
                        <img src="../images/resources/people/land.png" style="width: 80%; margin: 0 auto" alt="Land"><br><br>
                        Videos: <br><br>
                
                    • <a href="https://www.youtube.com/watch?v=TJISIwit0tk" target="_blank" 
                    class="text-green-600 hover:underline">Accelerationism</a><br>
                    
                    • <a href="https://www.youtube.com/watch?v=W1qEhkr9k8c" target="_blank" 
                    class="text-green-600 hover:underline">At Theory Underground</a><br>
                
                    `,
                image: "../images/resources/people/land.png"
            },

            {
                id: "nomi",
                name: "Klaus Nomi",
                role: "Musician / Vocalizer",
                description: `
                        <br><br>
                        <img src="../images/resources/people/nomi.jpg" style="width: 80%; margin: 0 auto" alt="Nomi"><br><br>
                        Videos: <br><br>
                
                    • <a href="https://zabakdaz.com/" target="_blank" 
                    class="text-green-600 hover:underline">Site: ZABAKDAZ !</a><br>
                
                    `,
                image: "../images/resources/people/nomi.jpg"
            },

            {
                id: "fennesz",
                name: "Fennesz",
                role: "Guitarist",
                description: `
                        <br><br>
                        <img src="../images/resources/people/fennesz.jpg" style="width: 80%; margin: 0 auto" alt="Fennesz"><br><br>
                
                    • <a href="https://www.fennesz.com/" target="_blank" 
                    class="text-green-600 hover:underline">Personal Page</a><br>
                    • <a href="https://fenneszreleases.bandcamp.com/" target="_blank" 
                    class="text-green-600 hover:underline">Bandcamp</a><br>
                    • <a href="https://www.youtube.com/watch?v=skygudx8Rrs" target="_blank" 
                    class="text-green-600 hover:underline">Endless Summer (full Album)</a><br>
                
                    `,
                image: "../images/resources/people/fennesz.jpg"
            },

            {
                id: "basinski",
                name: "William Basinski",
                role: "Composer",
                description: `
                        <br><br>
                        I got to see him play at the Nature Conservatory surrounded by plants :) it was breathtaking.
                        <img src="../images/resources/people/basinski.jpg" style="width: 80%; margin: 0 auto" alt="Basinski"><br><br>
                        Videos: <br><br>
                
                    • <a href="https://www.mmlxii.com/" target="_blank" 
                    class="text-green-600 hover:underline">Works</a><br>
                    • <a href="https://williambasinski.bandcamp.com/" target="_blank" 
                    class="text-green-600 hover:underline">Bandcamp</a><br>
                
                    `,
                image: "../images/resources/people/basinski.jpg"
            },

            {
                id: "sakamoto",
                name: "Ryuichi Sakamoto",
                role: "Composer and Keyboard Player",
                description: `
                        <br><br>
                        <img src="../images/resources/people/sakamoto.jpg" style="width: 80%; margin: 0 auto" alt="Sakamoto"><br><br>
                        Videos: <br><br>
                
                    • <a href="https://www.sitesakamoto.com/" target="_blank" 
                    class="text-green-600 hover:underline">sitesakamoto</a><br>
                    • <a href="https://www.youtube.com/watch?v=fjo54TiJlYE/" target="_blank" 
                    class="text-green-600 hover:underline">Remembering Sakamoto</a><br>
                
                    `,
                image: "../images/resources/people/sakamoto.jpg"
            },

            {
                id: "momus",
                name: "Momus",
                role: "Musician and Writer",
                description: `
                        <br><br>
                        <img src="../images/resources/people/momus.jpg" style="width: 80%; margin: 0 auto" alt="Momus"><br><br>
                
                    • <a href="https://momus.ca/" target="_blank" 
                    class="text-green-600 hover:underline">momus.ca</a><br>
                    • <a href="https://www.youtube.com/channel/UCwH79Z9-WQe2jwaHCK_Cgpg" target="_blank" 
                    class="text-green-600 hover:underline">momusu channel</a><br>
                
                    `,
                image: "../images/resources/people/momus.jpg"
            },

            {
                id: "monk",
                name: "Meredith Monk",
                role: "Composer and Performer",
                description: `
                        <br><br>
                        <img src="../images/resources/people/monk.jpg" style="width: 80%; margin: 0 auto" alt="Monk"><br><br>
                                
                    • <a href="https://www.meredithmonk.org/" target="_blank" 
                    class="text-green-600 hover:underline">meridethmonk.org</a><br>
                
                    `,
                image: "../images/resources/people/monk.jpg"
            },

            {
                id: "anderson",
                name: "Laurie Anderson",
                role: "Artist and Musician",
                description: `
                        <br><br>
                        <img src="../images/resources/people/anderson.png" style="width: 80%; margin: 0 auto" alt="Anderson"><br><br>
                
                    • <a href="https://laurieanderson.com/" target="_blank" 
                    class="text-green-600 hover:underline">Website</a><br>
                    • <a href="https://www.youtube.com/watch?v=Vkfpi2H8tOE" target="_blank" 
                    class="text-green-600 hover:underline">O Superman</a><br>
                    • <a href="https://daily.redbullmusicacademy.com/2015/06/laurie-anderson-feature" target="_blank" 
                    class="text-green-600 hover:underline">Good Interview</a><br>
                
                    `,
                image: "../images/resources/people/anderson.png"
            },

            {
                id: "mizer",
                name: "Malice Mizer",
                role: "Rock Band",
                description: `
                        <br><br>
                        <img src="../images/resources/people/mizer.jpg" style="width: 80%; margin: 0 auto" alt="Mizer"><br><br>
                
                    • <a href="https://www.youtube.com/watch?v=z0pn0M1VIYI" target="_blank" 
                    class="text-green-600 hover:underline">au revoir PV</a><br>
                
                    `,
                image: "../images/resources/people/mizer.jpg"
            },

        ]
            },
    links: {
        title: "COOL LINKS",
        items: [
            {
                id: "streaming",
                name: "Pirate Moment ! Arggg (shhh)",
                category: "Streaming",
                description: `

                        Click at your own risk !! I don't take responsibility for viruses..<br><br>
                        <img src="../images/resources/links/lock.png" style="width: 25%; margin-right: 30px; float: left; position: relative;" alt="Private">

                
                    Downloads:<br>
                    • <a href="https://www.pirateproxy-bay.com/" target="_blank" 
                    class="text-green-600 hover:underline">The Pirate Bay</a><br>
                    • <a href="https://nyaa.si/" target="_blank" 
                    class="text-green-600 hover:underline">Download Anime</a><br><br>
                    
                    Streaming:<br>
                    • <a href="https://dopebox.to/" target="_blank" 
                    class="text-green-600 hover:underline">Dopebox</a><br>
                    • <a href="https://putlocker-sb.lol/stream/" target="_blank" 
                    class="text-green-600 hover:underline">Putlocker</a><br>
                    • <a href="https://www.lookmovie2.to/" target="_blank" 
                    class="text-green-600 hover:underline">LookMovie</a><br><br>
                    
                    
                    Extra: Pass the Popcorn (need someone to recommend you..)<br><br>
                    <br><br>Computer Angel Charm for you:<br><br>
                    <img src="../images/resources/links/comp_angel.jpg" style="width: 30%; margin-left: 40px; float: left;" alt="Computer Angel">

                    
                    `,
                url: "https://dopebox.to/",
                image: "../images/resources/links/folder_p.png"
            },
            {
                id: "websites",
                name: "Cool Websites",
                category: "misc",
                description: `
                        <img src="../images/resources/links/web.jpg"  alt="Computer"><br><br>

                        Cooool Websites that I love to explore<br><br>
                
                    • <a href="https://handbook.org/?fbclid=PAZXh0bgNhZW0CMTEAAaaQylPAjTxGpwqPfKkNctnr_sIB1SAknMxt6dY7HLotKY749yxULEuIMEo_aem_SVIZL-919tYkl6eBXZ_zdg" target="_blank" 
                    class="text-green-600 hover:underline">Hans Witschi</a><br>
                    • <a href="https://n10.as/" target="_blank" 
                    class="text-green-600 hover:underline">A Digital Gallery</a><br>
                    • <a href="https://samlubicz.com/selected-works" target="_blank" 
                    class="text-green-600 hover:underline">Samlubicz Selected Works</a><br>
                    • <a href="https://erikloyer.com/index.php" target="_blank" 
                    class="text-green-600 hover:underline">Eric Loyer: Media Tech + creative Tech (Erik Loyer)</a><br>
                    
                    • <a href="https://www.police.pref.hokkaido.lg.jp/" target="_blank" 
                    class="text-green-600 hover:underline">Real Japanese Police Records</a><br>
                    • <a href="https://readonlymemory.com/" target="_blank" 
                    class="text-green-600 hover:underline">Read Only Memory: Cool book publications (tech centered)</a><br>
                
                    • <a href="https://britneyspears.ac/lasers.htm" target="_blank" 
                    class="text-green-600 hover:underline">Britney Spears Physics</a><br>
                    
                    • <a href="https://i-land.online/" target="_blank" 
                    class="text-green-600 hover:underline">Cute Walkthrough Game</a><br>
                    
                    • <a href="https://plutonist.neocities.org/" target="_blank" 
                    class="text-green-600 hover:underline">Art Website</a><br>
                    
                    • <a href="https://3laine.cargo.site/" target="_blank" 
                    class="text-green-600 hover:underline">Elaine Yue: Video, Animation, Sound</a><br>
                
                    `,
                url: "#",
                image: "../images/resources/links/folder_gd.png"
            },

            {
                id: "music",
                name: "Music Websites / Resources",
                category: "misc",
                description: `
                        Music Resources!!<br><br>
                        <img src="../images/resources/links/music.jpg" style="width: 70%" alt="Music"><br><br>
                
                    General<br><br>
                    • <a href="https://rateyourmusic.com/" target="_blank"
                    class="text-green-600 hover:underline">Rate Your Music: Discover new music</a><br>
                    • <a href="https://rateyourmusic.com/" target="_blank" 
                    class="text-green-600 hover:underline">Discogs: Buy and Sell Music</a><br><br>
                    
                    <img src="../images/resources/links/player.jpg" style="width: 20%;" alt="Music"><br><br>
                    
                    Cool Audio Projects<br><br>
                    • <a href="https://everynoise.com/engenremap.html" target="_blank" 
                    class="text-green-600 hover:underline">Music of Every Genre</a><br>
                    • <a href="https://www.chriskorda.com/software.html" target="_blank" 
                    class="text-green-600 hover:underline">Chris Korda: Music Projects and Software</a><br>
                    • <a href="https://oklou.com/" target="_blank" 
                    class="text-green-600 hover:underline">Oklou: Music portfolio</a><br>
                    • <a href="https://www.chriskorda.com/software.html" target="_blank" 
                    class="text-green-600 hover:underline">fendoap: Music Projects and Software</a><br><br>
                    
                    <img src="../images/resources/links/music_cat.jpg" style="width: 40%" alt="Music Cat"><br><br>
                    
                    Learning Resources<br><br>
                    • <a href="https://www.youtube.com/watch?v=lIeP5nbnpeE&list=PLEETnX-uPtBVpZvp-R2daNfy9k3-L-Q3u&ab_channel=thebennybox" target="_blank" 
                    class="text-green-600 hover:underline">Audio Programming Tutorial</a><br>
                    • <a href="https://docs.cycling74.com/learn/" target="_blank" 
                    class="text-green-600 hover:underline">Learn MaxMSP</a><br><br>
                    
                    Music I Like<br><br>
                    • <a href="https://givemetwentyminutes.bandcamp.com/?fbclid=PAZXh0bgNhZW0CMTEAAabhcWbPDsdkN9SO6nk4velaDSXuJFofHLh34GBt2qXIiKgu99gR0b8zVkU_aem_ASejy179pZAl6XLoO1UEEyGmVOL9GpzSC2hlOzlhtAUsb4RByhTN_YICw1DqoZrvZ0zAz6oWpYmrbNTEGWCfrY3O" target="_blank" 
                    class="text-green-600 hover:underline">Cool bandcamp</a><br>
                    • <a href="https://m.soundcloud.com/ciel_dj/baihui-mix-1" target="_blank" 
                    class="text-green-600 hover:underline">Cool Mix</a><br>
                
                    `,
                url: "#",
                image: "../images/resources/links/folder_music.png"
            },

            {
                id: "resources1",
                name: "Helpful Links",
                category: "Resources",
                description: `
                        <img src="../images/resources/links/yay.JPG" style="width: 50%" alt="Helpful">
                
                    • <a href="https://archive.ph/" target="_blank" 
                    class="text-green-600 hover:underline">Archive</a><br>
                    • <a href="https://marginalia-search.com/" target="_blank" 
                    class="text-green-600 hover:underline">Marginalia Search Engine: Prioritizes non-commercial content</a><br>
                    
                    • <a href="https://www.webdesignmuseum.org/flash-websites" target="_blank" 
                    class="text-green-600 hover:underline">Flash Website Archive</a><br>
                    • <a href="https://backgroundchecks.org/justdeleteme/#" target="_blank" 
                    class="text-green-600 hover:underline">JustDeleteMe: Delete your account from web services</a><br>
                    • <a href="https://www.pirateproxy-bay.com/" target="_blank" 
                    class="text-green-600 hover:underline">The Pirate Bay</a><br>
                    • <a href="https://www.remove.bg/upload" target="_blank" 
                    class="text-green-600 hover:underline">Remove Background from Image</a><br>
                    • <a href="https://emojidb.org/kaomoji-emojis" target="_blank" 
                    class="text-green-600 hover:underline">Kaomoji Library >_<</a><br>
                
                    `,
                url: "#",
                image: "../images/resources/links/folder_resources.png"
            },

            {
                id: "resources2",
                name: "Comp Sci Links",
                category: "Resources",
                description: `
                        <img src="../images/resources/links/comp_angel.jpg" style="width: 50%" alt="Computer Angel"><br><br>
                
                    Good Learning Tools:<br><br>
                    • <a href="https://home.cern/science/computing/birth-web" target="_blank" 
                    class="text-green-600 hover:underline">Destroy ALl Software</a><br>
                    • <a href="https://home.cern/science/computing/birth-web" target="_blank" 
                    class="text-green-600 hover:underline">DistroWatch: All u need about Linux and OS's</a><br>
                    
                    
                    WebDev Links<br><br>
                    • <a href="https://home.cern/science/computing/birth-web" target="_blank" 
                    class="text-green-600 hover:underline">World Wide Web History</a><br>
                    • <a href="https://caniuse.com/" target="_blank" 
                    class="text-green-600 hover:underline">CanIUse: HTML Browser Support</a><br>
                    • <a href="https://www.csszengarden.com/" target="_blank" 
                    class="text-green-600 hover:underline">CSS Based Design</a><br>
                    • <a href="https://htmlcolorcodes.com/" target="_blank" 
                    class="text-green-600 hover:underline">HTML Colour Codes</a><br>
                    • <a href="https://flatuicolors.com/" target="_blank" 
                    class="text-green-600 hover:underline">Colous Boards</a><br>
                    • <a href="https://www.w3.org/Style/Examples/007/fonts.en.html" target="_blank" 
                    class="text-green-600 hover:underline">CSS Fonts</a><br>
                    • <a href="https://fontello.com/" target="_blank" 
                    class="text-green-600 hover:underline">Icon Fonts Generator</a><br>
                    • <a href="https://www.cssscript.com/" target="_blank" 
                    class="text-green-600 hover:underline">CSS Script Templates</a><br>
                    • <a href="https://editor.p5js.org/" target="_blank" 
                    class="text-green-600 hover:underline">p5: Run Javascript Real-Time</a><br>
                
                    `,
                url: "#",
                image: "../images/resources/links/folder_cs.png"
            },

            {
                id: "archives",
                name: "Misc Archives",
                category: "Resources",
                description: `
                        <img src="../images/resources/links/links.jpg" style="width: 50%" alt="Archive"><br><br>
                
                    • <a href="https://archive.org/details/Ptuch" target="_blank" 
                    class="text-green-600 hover:underline">Птюч/Ptuch. 1994-2003</a><br>
                    • <a href="https://elephgraveyard.com/" target="_blank" 
                    class="text-green-600 hover:underline">Collection of Random Short Films</a><br>
                    • <a href="https://www.spaceghetto.space/" target="_blank" 
                    class="text-green-600 hover:underline">High Res. Images and Wallpapers (sometimes NSFW)</a><br>
                    • <a href="https://www.lacan.com/" target="_blank" 
                    class="text-green-600 hover:underline">Philosophy and Lacan</a><br>
                    • <a href="https://www.w3.org/History/" target="_blank" 
                    class="text-green-600 hover:underline">World Wide Web: Historical Archives</a><br>
                    • <a href="https://neocities.org/browse" target="_blank" 
                    class="text-green-600 hover:underline">Browse Neocities: Web Inspo</a><br>
                
                    `,
                url: "#",
                image: "../images/resources/links/folder_archive.png"
            },

            {
                id: "graphics",
                name: "Graphics Resources",
                category: "Resources",
                description: `
                        <img src="../images/resources/links/graphics.jpg" style="width: 70%" alt="Graphics"><br><br>
                
                    • <a href="https://www.shadertoy.com/" target="_blank" 
                    class="text-green-600 hover:underline">Shadertoy: Build and Share Shaders</a><br>
                    • <a href="https://inspirnathan.com/posts/47-shadertoy-tutorial-part-1" target="_blank" 
                    class="text-green-600 hover:underline">Shadertoy Tutorial</a><br>
                    • <a href="https://developer.mozilla.org/en-US/" target="_blank" 
                    class="text-green-600 hover:underline">Full Documentation + Tutorials on CSS, HTML, and JavaScript</a><br>
                    
                    
                    `,
                url: "#",
                image: "../images/resources/links/folder_sites.png"
            }
        ]
    },
    videos: {
        title: "VIDEOS",
        items: [
            {
                id: "cat",
                name: "Cat Duet!!",
                category: "Funny Video",
                description: "I know all the words.",
                videoUrl: "https://www.youtube.com/watch?v=FJDtCw0MTNU&list=LL&index=35&pp=gAQBiAQB",
                image: "../images/resources/videos/cat_duet.png"
            },
            {
                id: "cloth",
                name: "Realtime Cloth Simulation",
                category: "Cool Coding Project",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=KpJzoFzDDMw&list=LL&index=239&pp=gAQBiAQB",
                image: "../images/resources/videos/cloth.jpg"
            },
            {
                id: "cmusic",
                name: "Music With C",
                category: "Tutorial",
                description: "Alexander Zolotov - Music created with the C programming language",
                videoUrl: "https://youtu.be/8r8wsvHUbCo?si=DmeV-vK9WJSRP7yh",
                image: "../images/resources/videos/cmusic.jpg"
            },
            {
                id: "wannacry",
                name: "WANNACRY: Earth's Deadliest [Computer] Viruses",
                category: "Video Essay",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=I5Wxh-rCzrY&list=LL&index=238&pp=gAQBiAQB",
                image: "../images/resources/videos/wannacry.jpg"
            },
            {
                id: "linux",
                name: "The Code: Story of Linux Documentary",
                category: "Documentary",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=XMm0HsmOTFI&list=LL&index=72&pp=gAQBiAQB",
                image: "../images/resources/videos/linux.jpg"
            },
            {
                id: "aaron",
                name: "The Internet's Own Boy: The Story of Aaron Swartz (2014)",
                category: "Documentary",
                description: "Perfect forever.",
                videoUrl: "https://www.youtube.com/watch?v=9vz06QO3UkQ&list=LL&index=92&ab_channel=moviemaniacsDE",
                image: "../images/resources/videos/aaron.jpg"
            },
            {
                id: "wind",
                name: "Voices in the Wind (full movie)",
                category: "Film",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=gptcrYzqkNY&list=LL&index=76&t=31s",
                image: "../images/resources/videos/wind.jpg"
            },
            {
                id: "haru",
                name: "Haru (1996)",
                category: "Film",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=Jdys69dKOB0&list=LL&index=122&pp=gAQBiAQB",
                image: "../images/resources/videos/haru.jpg"
            },
            {
                id: "mirror",
                name: "Mirrored Mind (2005)",
                category: "Film",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=Yzowgw-I-R4&list=LL&index=136&pp=gAQBiAQB",
                image: "../images/resources/videos/mirror.jpg"
            },
            {
                id: "sunRa",
                name: "The Last Angel of History",
                category: "Film",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=gcbSUwPjass&list=LL&index=140&pp=gAQBiAQB",
                image: "../images/resources/videos/angel.jpg"
            },
            {
                id: "sunRa2",
                name: "SUN RA - SPACE IS THE PLACE (1974)",
                category: "Film",
                description: "Afrofuturist science fiction film made in 1972 and released in 1974.",
                videoUrl: "https://youtu.be/owCPrIEliZc?si=tzB1PBKEqK-ysHt7",
                image: "../images/resources/videos/sunra.png"
            },
            {
                id: "thunder",
                name: "Thunder",
                category: "Film by Takashi Ito",
                description: "Afrofuturist science fiction film made in 1972 and released in 1974.",
                videoUrl: "https://youtu.be/owCPrIEliZc?si=tzB1PBKEqK-ysHt7",
                image: "../images/resources/videos/thunder.jpg"
            },
            {
                id: "corpus",
                name: "Corpus Collosum",
                category: "Film by Michael Snow",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=yx9Nb6-wjIY&list=LL&index=141&ab_channel=alixno",
                image: "../images/resources/videos/corpus.jpg"
            },
            {
                id: "karl",
                name: "Karl Pilkington - Satisfied Fool",
                category: "Film",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=jdnecUl4jYA&list=LL&index=108&ab_channel=IsaacNellist",
                image: "../images/resources/videos/karl.jpg"
            },
            {
                id: "trashHump",
                name: "Trash Humpers (2010)",
                category: "Film by Harmony Korine",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=0JJhxo-etI0&list=LL&index=109&pp=gAQBiAQB",
                image: "../images/resources/videos/trash.jpg"
            },
            {
                id: "ent",
                name: "A Family Finds Entertainment (2004)",
                category: "Film by Ryan Trecartin",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=aTzcMlNuMXI&list=LL&index=149&pp=gAQBiAQB",
                image: "../images/resources/videos/ent.jpg"
            },
            {
                id: "sugarwater",
                name: "Cibo Matto - Sugar Water",
                category: "Music Video",
                description: "I will never tire of this !! I can't believe it.",
                videoUrl: "https://www.youtube.com/watch?v=EN9auBn6Jys&list=LL&index=392&pp=gAQBiAQB",
                image: "../images/resources/videos/sugar.jpg"
            },
            {
                id: "lear",
                name: "Amanda Lear - Enigma",
                category: "Music Video",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=wXoWV2DXKYI&list=LL&index=36&pp=gAQBiAQB",
                image: "../images/resources/videos/lear.jpg"
            },
            {
                id: "noise",
                name: "Art of Noise - Close (To The Edit)",
                category: "Music Video",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=2_HXUhShhmY&list=LL&index=451&pp=gAQBiAQB",
                image: "../images/resources/videos/noise.jpg"
            },
            {
                id: "grace",
                name: "Grace Jones",
                category: "Music Video",
                description: "I've Seen this Face Before",
                videoUrl: "https://www.youtube.com/watch?v=nIN3IE3DHqc&list=LL&index=432&pp=gAQBiAQB",
                image: "../images/resources/videos/grace.jpg"
            },
            {
                id: "papooz",
                name: "Papooz - You and I",
                category: "Music Video",
                description: "My favourite band with lovely music video.",
                videoUrl: "https://www.youtube.com/watch?v=bS26bkXcLhU&list=LL&index=409&pp=gAQBiAQB",
                image: "../images/resources/videos/papooz.jpg"
            },
            {
                id: "elegance",
                name: "Her Morning Elegance",
                category: "Music Video",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=-sFK0-lcjGU&list=LL&index=21&pp=gAQBiAQB",
                image: "../images/resources/videos/elegance.jpg"
            },
            {
                id: "buffalo",
                name: "Christina Ricci - Buffalo '66",
                category: "King Krimson's Moonchild in Buffalo '66",
                description: "I love her and I love King Crimson and I love this film.",
                videoUrl: "https://www.youtube.com/watch?v=8prwvXX-ajM&list=LL&index=393&pp=gAQBiAQB",
                image: "../images/resources/videos/buffalo.jpg"
            },
            {
                id: "foux",
                name: "Foux Du FaFa",
                category: "Music Video",
                description: "Flight of the Concords",
                videoUrl: "https://www.youtube.com/watch?v=EuXdhow3uqQ&list=LL&index=406&pp=gAQBiAQB",
                image: "../images/resources/videos/foux.jpg"
            },
            {
                id: "racoon",
                name: "Raccoon eats cotton candy in the end!",
                category: "Cute Video",
                description: "Raccoon wash their food before eating it. What happens when you give them cotton candy?",
                videoUrl: "https://youtu.be/eesxH2-8Jlo?si=od5yzx7O7BWKaFEi",
                image: "../images/resources/videos/racoon.png"
            },
            {
                id: "fluid",
                name: "Levitating Magnetic Fluid",
                category: "Cool Video",
                description: "",
                videoUrl: "https://www.youtube.com/watch?v=bYGQu-LHSNE&list=LL&index=443&t=100s&pp=gAQBiAQB",
                image: "../images/resources/videos/fluid.jpg"
            },
        ]
    },
    interesting: {
        title: "COOL THINGS",
        items: [
            {
                id: "internet",
                name: "Early Internet Culture",
                category: "Culture",
                description: `
                        <img src="../images/resources/terms/internet/internet.jpg" alt="Charlie"><br><br>
                        
                        Simpler times.. The early internet will forever be a time capsule embedded in my brain.<br><br>
                        
                        I love going throught Wayback Machine and going on sites like 9gag and collegehumor.<br><br>
                        
                        <img src="../images/resources/terms/internet/me.png" style="width: 50%; margin: 0 auto" alt="Me"><br><br>
                        We had:<br><br>
                        
                        Rage Comics<br><br>
                        <img src="../images/resources/terms/internet/rage.jpg" style="width: 50%; margin: 0 auto" alt="Rage"><br>
                        <img src="../images/resources/terms/internet/rage2.jpg" style="width: 50%; margin: 0 auto" alt="Rage"><br><br>

                        Nyan Cat<br><br>
                        <img src="../images/resources/terms/internet/nyan.jpg" style="width: 50%; margin: 0 auto" alt="Nyan Cat"><br><br>
                        
                        iFunny<br><br>
                        <img src="../images/resources/terms/internet/ifunny.jpg" style="width: 50%; margin: 0 auto" alt="iFunny"><br><br>
                        
                        ASDF Video<br><br>
                        <img src="../images/resources/terms/internet/asdf.jpg" style="width: 50%; margin: 0 auto" alt="ASDF"><br><br>
                        
                        Games on the App Store!<br><br>
                        <img src="../images/resources/terms/internet/app.jpg" style="width: 50%; margin: 0 auto" alt="App Store"><br><br>
               
                    
                    `,
                image: "../images/resources/terms/derp.png"
            },
            {
                id: "loss",
                name: "Loss Meme",
                category: "Internet Culture",
                description: `
                    <img src="../images/resources/terms/loss.jpg" alt="Loss"><br><br>
                    Originated with this cartoon strip posted in 2008.<br>
                    The comic was mocked and parodied with minimalistic representations of the 4 panels.<br><br>    
                    <img src="../images/resources/terms/loss1.png" style="width: 60%; margin: 0 auto" alt="Loss"><br><br> 
                    <img src="../images/resources/terms/loss2.png" style="width: 60%; margin: 0 auto" alt="Loss"><br>   
                    <img src="../images/resources/terms/loss3.png" style="width: 60%; margin: 0 auto" alt="Loss"><br><br>
                    References to this are still made to this day, making it one of the longest running internet gags.<br><br>
                    <img src="../images/resources/terms/loss4.png" alt="Loss"><br><br>                    
                    • <a href="https://nymag.com/intelligencer/2015/11/longest-running-miscarriage-meme-on-the-web.html" target="_blank" 
                    class="text-green-600 hover:underline">Talking to the Man Behind ‘Loss,’ the Internet’s Longest-Running Miscarriage ‘Joke’</a><br>
                `,
                image: "../images/resources/terms/l.png"
            },
            {
                id: "sundog",
                name: "Sundog",
                category: "Interesting",
                description: `
                    <img src="../images/resources/terms/sundog.png"  alt="Sundog"><br><br>
                    Sundogs are bright spots of light that appear on either left, right, or both, from the sun. They are
                    caused by refractions of light through ice crystals.<br><br>
                    <img src="../images/resources/terms/sundog2.png"  alt="Sundogs"><br><br>                    
                    Note: In Russian, a sunbeam reflection is called a 'солнычный зайчик', which translates to Sunny Bunny :)
                    `,
                image: "../images/resources/terms/sd2.jpg"
            },
            {
                id: "kruger",
                name: "Dunning-Kruger effect",
                category: "Science",
                description: `
                    <img src="../images/resources/terms/kruger.png" alt="Kruger"><br><br>
                    TLDR: The more you know, the less you think you know.<br><br>
                    The Dunning-Kruger effect is a cognitive bias that causes people to overestimate their knowledge or abilities. 
                    It's more common in people who have low abilities and lack self-awareness, since people with low abilities may 
                    not have the skills to recognize their own incompetence. <br><br>
                    Some also include the opposite effect for high performers and their tendency to underestimate their skills. <br><br>
                    
                    Term coined in 1999 by Cornell University psychologists David Dunning and Justin Kruger. <br><br>
                       
                    • <a href="https://medium.com/geekculture/dunning-kruger-effect-and-journey-of-a-software-engineer-a35f2ff18f1a" target="_blank" 
                    class="text-green-600 hover:underline">Read: In Relation to a Programmer</a><br>
                `,
                image: "../images/resources/terms/dunning.png"
            },
            {
                id: "punkt",
                name: "Punkt Phone",
                category: "Science",
                description: `
                    <img src="../images/resources/terms/punkt.jpg" alt="Punkt"><br><br>
                    Privacy oriented phone! So so cute I want it..   <br><br>
                    <img src="../images/resources/terms/punkt2.jpg" style="width: 60%; margin: 0 auto" alt="Punkt"><br><br>
                    - LTE connection can be shared with a tablet/laptop<br>
                    - Excellent audio quality and battery life<br>
                    - Minimalist operating system hardened against attacks<br>
                    - A voice phone that works as a phone<br>
                    - Offers a downloadable privacy feature <br>
                    - Signal protocol: Free, encrypted Internet-based calls and texts worldwide via Wi-Fi or mobile data<br> 
                    <img src="../images/resources/terms/punkt4.jpg" style="width: 60%; margin: 0 auto" alt="Punkt"><br><br>
                    • <a href="https://www.punkt.ch/en/" target="_blank" 
                    class="text-green-600 hover:underline">The Product</a><br>
                `,
                image: "../images/resources/terms/punkt4.jpg"
            },
            {
                id: "airbear",
                name: "Air Bear",
                category: "Art",
                description: `
                    <img src="../images/resources/terms/airbear.jpg" alt="Air Bear"><br><br>
                    “Air Bear” sculpture by Joshua Allen Harris (2008)<br><br>
                    “Air Bear” is a small polar bear sculpture designed by Joshua Allen Harris in 2008. 
                     He was created out of white plastic grocery bags and attached to the grating above
                    the NYC subway. <br>
                    When the sculpture is at rest, it looks like an ordinary piece of trash on the grating. 
                      But as the subway passes by, it pushes air up through the grating, animating the bear 
                      in a life-like way.<br><br>
                      
                    <img src="../images/resources/terms/airbear2.jpg" style="width: 80%; margin: 0 auto" alt="Air Bear"><br><br>
                    • <a href="https://www.youtube.com/watch?v=v5cb7OUNHro" target="_blank" 
                    class="text-green-600 hover:underline">Watch Him</a><br>
                `,
                image: "../images/resources/terms/ab.png"
            },

            {
                id: "domo",
                name: "Domo",
                category: "Culture",
                description: `
                    We Love Domo !!!<br><br>
                    <img src="../images/resources/terms/domo2.jpg" alt="Domo"><br><br>
                    <img src="../images/resources/terms/domo.jpg" style="width: 60%; margin: 0 auto;" alt="Domo"><br><br>
                    
                `,
                image: "../images/resources/terms/domo_icon.png"
            },
            {
                id: "mirror",
                name: "Mirror Stage",
                category: "Science",
                description: `
                    <img src="../images/resources/terms/lacan2.jpg" alt="Mirror Stage"><br><br>
                    Lacan's Mirror Stage<br><br>
                    Recognizing yourself in the mirror!<br><br>
                    Thoery: Human infants pass through a stage in which an external image of the body (reflected in a mirror, or represented to the infant through the mother or primary caregiver) 
                    produces a psychic response that gives rise to the mental representation of an "I". 
                    <img src="../images/resources/terms/lacan.JPG" style="width: 60%; margin: 0 auto" alt="Phone Mirror"><br><br>
                    
                `,
                image: "../images/resources/terms/mirror.jpg"
            },
            {
                id: "sj",
                name: "Steve Jobs Photobooth",
                category: "Tech",
                description: `
                    <img src="../images/resources/terms/sj2.jpg" alt="Steve Jobs"><br><br>
                    Steve Jobs testing out Photobooth filters (2005)<br><br>
                    
                    So Silly!<br><br>
                    
                    <img src="../images/resources/terms/sj1.jpg" style="width: 60%;margin: 0 auto" alt="Steve Jobs"><br>
                    <img src="../images/resources/terms/sj3.jpg" style="width: 60%;margin: 0 auto" alt="Steve Jobs"><br>
                    <img src="../images/resources/terms/sj4.jpg" style="width: 60%;margin: 0 auto" alt="Steve Jobs"><br>
                    <img src="../images/resources/terms/sj5.jpg" style="width: 60%;margin: 0 auto" alt="Steve Jobs"><br>
                    <img src="../images/resources/terms/sj6.jpg" style="width: 60%;margin: 0 auto" alt="Steve Jobs"><br>
                    
                `,
                image: "../images/resources/terms/sj4.jpg"
            }

        ]
    },
    games: {
        title: "VIDEO GAMES",
        items: [
            {
                id: "gitaroo",
                name: "Gitaroo Man",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/gitaroo.jpg" style="width: 30%" alt="Gitaroo Man"><br><br>
                        I love this game but I accidentally bought this disk from Japan, and it is not compatible with my PS2 :( purple disk...
                    `,
                image: "../images/resources/videogames/gitaroo.jpg"
            },
            {
                id: "persona",
                name: "Persona 4",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/persona4.png" style="width: 30%" alt="Persona 4"><br><br>
                    `,
                image: "../images/resources/videogames/persona4.png"
            },
            {
                id: "ico",
                name: "ICO",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/ico.png" style="width: 30%" alt="ICO"><br><br>
                    `,
                image: "../images/resources/videogames/ico.png"
            },
            {
                id: "max",
                name: "Max Payne",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/maxpayne.jpg" style="width: 30%" alt="Max Payne"><br><br>
                    `,
                image: "../images/resources/videogames/maxpayne.jpg"
            },
            {
                id: "headhunter",
                name: "Headhunter",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/headhunter.jpg" style="width: 30%" alt="Headhunter"><br><br>
                    `,
                image: "../images/resources/videogames/headhunter.jpg"
            },
            {
                id: "hitman2",
                name: "Hitman 2",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/hitman2.jpg" style="width: 30%" alt="Hitman 2"><br><br>
                    `,
                image: "../images/resources/videogames/hitman2.jpg"
            },
            {
                id: "jak",
                name: "Jak 2",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/jak.png" style="width: 30%" alt="Jak2"><br><br>
                    `,
                image: "../images/resources/videogames/jak.png"
            },
            {
                id: "midnight",
                name: "Midnight Club",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/midnight.png" style="width: 30%" alt="Midnight Club"><br><br>
                    `,
                image: "../images/resources/videogames/midnight.png"
            },
            {
                id: "astro",
                name: "Astro Boy",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/astro.png" style="width: 30%" alt="Astro Boy"><br><br>
                    `,
                image: "../images/resources/videogames/astro.png"
            },
            {
                id: "silent",
                name: "Silent Hill Origins",
                category: "PSP",
                description: `
                        <img src="../images/resources/videogames/silent.png" style="width: 30%" alt="Silent Hill"><br><br>
                    `,
                image: "../images/resources/videogames/silent.png"
            },
            {
                id: "spore",
                name: "Spore",
                category: "PS2",
                description: `
                        <img src="../images/resources/videogames/Sporebox.jpg" style="width: 30%" alt="Spore"><br><br>
                    `,
                image: "../images/resources/videogames/Sporebox.jpg"
            },
            {
                id: "xy",
                name: "Pokemon X/Y",
                category: "3DS",
                description: `
                        <img src="../images/resources/videogames/3ds.png" style="width: 50%" alt="3DS"><br><br>
                        <img src="../images/resources/videogames/xy.jpg" style="width: 50%" alt="Pokemon XY"><br><br>
                    `,
                image: "../images/resources/videogames/xy.jpg"
            },
            {
                id: "alpha",
                name: "Pokemon Alpha/Omega",
                category: "3DS",
                description: `
                        <img src="../images/resources/videogames/alpha.jpg" style="width: 50%" alt="Pokemon Alpha/Omega"><br><br>
                    `,
                image: "../images/resources/videogames/alpha.jpg"
            },
            {
                id: "sword",
                name: "Pokemon Sword/Shield",
                category: "Nintendo Switch",
                description: `
                        <img src="../images/resources/videogames/sword.jpg" style="width: 50%" alt="Pokemon Sword/Shield"><br><br>
                    `,
                image: "../images/resources/videogames/sword.jpg"
            },
        ]
    },

    // Add other categories as needed
};


const ResourcesPage = () => {
    const [selectedCategory, setSelectedCategory] = React.useState(null);
    const [selectedItem, setSelectedItem] = React.useState(null);

    const categories = [
        { id: "people", number: "01", title: "People", img: "../images/resources/derps.png"},
        { id: "links", number: "02", title: "Resources", img: "../images/resources/links.png"},
        { id: "interesting", number: "03", title: "Interesting", img: "../images/resources/interesting.png" },
        { id: "videos", number: "04", title: "Videos", img: "../images/resources/videos.jpg" },
        { id: "games", number: "07", title: "Video Games", img: "../images/resources/videogame.jpg" }
    ];
    // { id: "movies", number: "05", title: "Movies", img: "../images/resources/movies.jpg" },
    // { id: "books", number: "06", title: "Books", img: "../images/resources/books.jpg" },

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(categoryId);
        setSelectedItem(null);
        // Scroll to top smoothly
        window.scrollTo({ top: 250, behavior: 'smooth' });
    };

    const handleItemClick = (item) => {
        setSelectedItem(item);
        // Scroll to top smoothly
        window.scrollTo({ top: 250, behavior: 'smooth' });
    };

    const renderRightPanel = () => {
        if (selectedItem) {
            return (
                <article>
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="text-gray-900 mb-4 hover:text-gray-1000"
                    >
                        ← Back to {projectsData[selectedCategory]?.title || 'list'}
                    </button>
                    <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                    {selectedItem.role && (
                        <div className="text-gray-600 mb-4">{selectedItem.role}</div>
                    )}
                    {selectedItem.category && (
                        <div className="text-gray-600 mb-4">Category: {selectedItem.category}</div>
                    )}
                    {selectedItem.videoUrl && (
                        <div className="aspect-w-16 aspect-h-9 mb-4">
                            <iframe
                                className="w-full h-96 mb-4"
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedItem.videoUrl)}`}
                                title={selectedItem.name}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                    <div
                        className="text-gray-600 leading-relaxed"
                        dangerouslySetInnerHTML={{__html: selectedItem.description}}
                    />
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="text-gray-900 mb-4 hover:text-gray-1000"
                    >
                        ← Back to {projectsData[selectedCategory]?.title || 'list'}
                    </button>
                </article>
            );
        }

        if (selectedCategory && projectsData[selectedCategory]) {
            return (
                <article>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-gray-600 mb-4 hover:text-gray-900"
                    >
                        ← Back to categories
                    </button>
                    <h2 className="text-2xl font-semibold mb-6">{projectsData[selectedCategory].title}</h2>
                    <div className="space-y-6">
                        {projectsData[selectedCategory].items.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className="cursor-pointer p-4 rounded-lg hover:bg-gray-100 transition-colors flex items-start gap-6"
                            >
                                {item.image && (
                                    <div className="flex-shrink-0 w-24 h-24">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-bold mb-2">{item.name}</h3>
                                    {item.role && (
                                        <div className="text-gray-600 text-m mb-2">{item.role}</div>
                                    )}
                                    {item.category && (
                                        <div className="text-gray-600 text-sm mb-2">{item.category}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            );
        }

        return (
            <article>

                <h2 className="text-3xl font-normal mb-4 underline">My Collection</h2>
                <p className="text-gray-600 leading-relaxed">
                    My digital archive of things I find interesting and want to remember.
                </p>

                <p className="text-sm/7 text-gray-600">
                    Click on any category on the left to explore my curated collections and resources.
                    Each section contains selected materials that have some relevance to me.
                </p>
                <p>
                    ---------------------------------------------------------------
                </p>


                <h3 className="text-xl text-gray-700 mt-6 mb-1">
                    People:
                </h3>
                <p className="text-lg text-gray-500 inline ">
                    Interesting people and information about them.
                </p>
                <h3 className="text-xl text-gray-700 mt-8 mb-1">
                    Resources:
                </h3>
                <p className="text-lg text-gray-500">
                    Random links, coding resources, and websites I use.
                </p>
                <h3 className="text-xl text-gray-700 mt-8 mb-1">
                    Interesting:
                </h3>
                <p className="text-lg text-gray-500">
                    Cool topics and terms I've come across.
                </p>
                <h3 className="text-xl text-gray-700 mt-8 mb-1">
                    Videos:
                </h3>
                <p className="text-lg text-gray-500">
                    My favourite YouTube videos, including films and music videos.
                </p>
                <h3 className="text-xl text-gray-700 mt-8 mb-1">
                    Video Games:
                </h3>
                <p className="text-lg text-gray-500">
                    My personal videogames and consoles.
                </p>
            </article>

        );
    };

    return (
        <div className="min-h-screen bg-white border border-gray-300 rounded-lg">
            <div className="max-w-1xl mx-auto mt-5 px-4 grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-1 pr-0 lg:pr-5">
                    <h1 className="text-3xl font-semibold mb-1"></h1>
                    <div className="text-gray-600 mb-4"></div>

                    <div className="space-y-3 w-full ml-1 ">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className={`cursor-pointer transition-all duration-200 ${
                                    selectedCategory === category.id ? 'border border-gray-300 rounded-lg p-5 scale-100 bg-gray-100' : ''
                                }`}
                                onClick={() => handleCategoryClick(category.id)}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="text-sm text-gray-500">{category.number}</div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium mb-4">{category.title}</h3>
                                        <div className=" w-full h-40 mb-4">
                                            <img
                                                src={category.img}
                                                alt={category.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-gray-50 p-8 border border-gray-200 rounded-lg mt-3 mb-3">
                    {renderRightPanel()}
                </div>
            </div>
        </div>
    );
};

// Render the React component
ReactDOM.render(<ResourcesPage />, document.getElementById('root'));