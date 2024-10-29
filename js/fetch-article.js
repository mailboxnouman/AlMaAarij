document.addEventListener("DOMContentLoaded", function () {
    let currentPage = 1;

    // Function to fetch and render articles
    function loadArticles(page) {
        fetch(`/api/articles?page=${page}`)
            .then(response => response.json())
            .then(data => {
                const articlesContainer = document.getElementById('articles');
                if (!articlesContainer) {
                    // console.error("Element #articles not found");
                    return;
                }

                articlesContainer.innerHTML = '';

                data.articles.forEach(article => {
                    const articleElement = `
                        <div class="col-lg-6 col-md-6 col-sm-6">
                            <div class="blog__item">
                                <div  class="article-image" class="blog__item__pic">
                                    <img  src="uploads/${article.coverImage}" alt="${article.title}" onerror="this.src='default.jpg';">
                                </div>
                                <div class="blog__item__text">
                                    <ul>
                                        <li><i class="fa fa-calendar-o"></i> ${new Date(article.createdAt).toDateString()}</li>
                                    </ul>
                                    <h5 style="text-align:right;"><a href="view-article.html?id=${article._id}">${article.title}</a></h5>
                                    <p style="font-family: nafees_web_naskhshipped; direction: rtl; text-align: justify;">${article.content ? article.content.substring(0, 120) : ''}...</p>
                                    <a href="view-article.html?id=${article._id}" class="btn btn-success" style="background-color: #7FAD39; border:none;" >مزید پڑھیں</a>
                                </div>
                            </div>
                        </div>
                    `;
                    articlesContainer.innerHTML += articleElement;
                });

                updatePagination(data.totalPages, data.currentPage);
            })
            .catch(err => console.error("Error fetching articles: ", err));
    }
  
      // Function to fetch and render recent articles
    function loadRecentArticles() {
        fetch(`/api/recent-articles`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const recentArticlesContainer = document.querySelector('.blog__sidebar__recent');
                if (!recentArticlesContainer) {
                    console.error("Element .blog__sidebar__recent not found");
                    return;
                }

                recentArticlesContainer.innerHTML = ''; // Clear previous content

                data.articles.forEach(article => {
                    const articleElement = `
                        <a href="view-article.html?id=${article._id}" class="blog__sidebar__recent__item" style="display: flex; align-items: center; margin-bottom: 15px;">
                            <div  class="blog__sidebar__recent__item__pic" style="flex: 0 0 80px; height: 80px; overflow: hidden; margin-right: 10px;">
                                <img style="object-fit:cover; height:100%;" src="uploads/${article.coverImage}" alt="${article.title}" style="width: 100%; height: auto;" onerror="this.src='default.jpg';">
                            </div>
                            <div class="blog__sidebar__recent__item__text">
                                <h6 style="margin: 0; font-size: 14px;">${article.title}</h6>
                                <span style="font-size: 12px; color: #888;">${new Date(article.createdAt).toDateString()}</span>
                            </div>
                        </a>
                    `;
                    recentArticlesContainer.innerHTML += articleElement; // Append new article element
                });
            })
            .catch(err => console.error("Error fetching recent articles: ", err));
    }

       

    // Function to update pagination buttons
    function updatePagination(totalPages, currentPage) {
        const pagination = document.getElementById('pagination');
        if (!pagination) {
            console.error("Element #pagination not found");
            return;
        }
        pagination.innerHTML = '';
    
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('a');
            pageButton.href = "#";
            pageButton.textContent = i;
            pageButton.classList.add("pagination-btn");
            pageButton.dataset.page = i;
    
            // Highlight the active page
            if (i === currentPage) {
                // Set inline styles for the active page button
                pageButton.style.backgroundColor = "#7FAD39"; // Change to your desired active color
                pageButton.style.color = "white"; // Change to your desired text color
                pageButton.style.borderColor = "#7FAD39"; // Change to match your theme
            }
    
            pageButton.addEventListener("click", function (event) {
                event.preventDefault();  // Prevent page reload
                loadArticles(i);  // Load articles for the clicked page
            });
    
            pagination.appendChild(pageButton);
        }
    }
        


    // Initial load
    loadArticles(currentPage);
    loadRecentArticles(); // Load recent articles
  });
  