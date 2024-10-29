$(document).ready(function() {
    // Variable to store the MixItUp instance
    let mixer = null;

    // Function to initialize MixItUp
    function initializeMixItUp() {
        if (mixer) {
            mixer.destroy(); // Clean up any existing instance to prevent duplicates
        }
        mixer = mixitup('#articles-container', {
            selectors: {
                target: '.mix'
            },
            animation: {
                duration: 300
            }
        });
    }

    // Fetch articles from the server
    $.get('/api/admin/articles', function(articles) {
        // console.log("Fetched articles:", articles); // Log articles for debugging

        // Function to render articles
        function renderArticles(articlesToRender) {
            $('#articles-container').empty(); // Clear previous articles
            articlesToRender.forEach(function(article) {
                // Log category class to verify it's correct
                // console.log(`Rendering article with category class: ${article.category}`);
                $('#articles-container').append(`
                    <div class="col-lg-3 col-md-4 col-sm-6 mix ${article.category}">
                        <div class="featured__item">
                            <div class="featured__item__pic set-bg" style="background-image: url('/uploads/${article.coverImage}');">
                                <ul class="featured__item__pic__hover">
                                    <li><a href="#"><i class="fa fa-heart"></i></a></li>
                                    <li><a href="/edit/${article._id}"><i class="fa fa-edit"></i></a></li>
                                    <li><a href="/delete/${article._id}"><i class="fa fa-trash"></i></a></li>
                                </ul>
                            </div>
                            <div class="featured__item__text">
                                <h6><a href="#">${article.title}</a></h6>
                                <p>${new Date(article.createdAt).toDateString()}</p>
                                <p>${article.content.substring(0, 100)}...</p>
                            </div>
                        </div>
                    </div>
                `);
            });
        }

        // Render all articles initially
        renderArticles(articles);

        // Initialize MixItUp once after rendering
        initializeMixItUp();

        // Event listener for filter buttons
        $('.filter-button').on('click', function() {
            const filterValue = $(this).attr('data-filter');
            // console.log("Filter value selected:", filterValue);

            // Ensure MixItUp filters with the selected category
            if (mixer) {
                mixer.filter(filterValue).then(function(state) {
                    // console.log("Filtered items count:", state.totalShow);
                    
                    // Additional check if no items are visible after filter
                    if (state.totalShow === 0) {
                        // console.log("No items displayed after selection. Verify elements have correct classes for:", filterValue);

                        // Re-render articles to ensure filtering works
                        renderArticles(articles);
                        initializeMixItUp(); // Reinitialize MixItUp
                        mixer.filter(filterValue);
                    }
                });
            }
        });

        // Filtering logic with controls for category highlighting
        $('.featured__controls ul li').click(function() {
            const filterValue = $(this).attr('data-filter');
            // console.log("Filter value selected for controls:", filterValue);

            $('.featured__controls ul li').removeClass('active'); // Remove active class from all
            $(this).addClass('active'); // Add active class to clicked item

            // Apply filter through MixItUp if initialized
            if (mixer) {
                mixer.filter(filterValue).then(function(state) {
                    // console.log("Filtered items after controls selection:", state.totalShow);
                    // console.log("Elements with class match after filter:", $(`#articles-container .mix${filterValue}`).length);

                    // Additional log if no items are displayed
                    if (state.totalShow === 0) {
                        // console.log("No items displayed after selection. Verify elements have correct classes for:", filterValue);

                        // Re-render articles to ensure filtering works
                        renderArticles(articles);
                        initializeMixItUp(); // Reinitialize MixItUp
                        mixer.filter(filterValue);
                    }
                });
            }
        });
    }).fail(function() {
        console.error("Error fetching articles.");
    });
});
