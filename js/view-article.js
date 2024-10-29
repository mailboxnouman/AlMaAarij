// view-article.html JS
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

fetch(`/api/articles/${articleId}`)
  .then(response => response.json())
  .then(article => {
    document.getElementById('article-cover').src = `uploads/${article.coverImage}`;
    document.getElementById('article-title').innerText = article.title;
    document.getElementById('article-content').innerText = article.content;

    // Render date with icon
    document.getElementById('article-date').innerHTML = `<i class="fa fa-calendar-o"></i> ${new Date(article.createdAt).toDateString()}`;
    
    // Render author name with icon
    document.getElementById('article-author').innerHTML = `<i class="fa fa-pencil"></i> ${article.author}`;
  });