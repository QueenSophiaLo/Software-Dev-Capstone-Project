// controllers/newsController.js
//"Defensive Coding" to check for missing API keys and handle errors gracefully

exports.getNews = async (req, res, next) => {
    const topic = req.query.category || 'business';
    const limit = 8;

    // TEAMMATE SAFETY CHECK
    if (!process.env.NEWS_API_KEY) {
        console.warn("News API Key is missing in .env");
        req.flash('error', 'News service is not configured. Please add NEWS_API_KEY to your .env file.');
        // Render the page empty, do NOT crash
        return res.render('news/index', { articles: [], currentCategory: topic });
    }

    // Define API Endpoints based on category
    let url = '';
    if (topic === 'crypto') {
        url = `https://newsapi.org/v2/everything?q=cryptocurrency&apiKey=${process.env.NEWS_API_KEY}&language=en&sortBy=publishedAt&pageSize=${limit}`;
    } else if (topic === 'real_estate') {
        url = `https://newsapi.org/v2/everything?q="real estate"&apiKey=${process.env.NEWS_API_KEY}&language=en&sortBy=publishedAt&pageSize=${limit}`;
    } else {
        // Default to top business headlines
        url = `https://newsapi.org/v2/top-headlines?category=business&country=us&apiKey=${process.env.NEWS_API_KEY}&pageSize=${limit}`;
    }

    try {
        // Fetch data (Node v18+ has built-in fetch)
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'ok') {
            throw new Error(data.message || 'API Error');
        }

        articles = data.articles;

        res.render('news/index', { 
            articles: articles,
            currentCategory: topic
        });

    } catch (error) {
        console.error("News Fetch Error:", error);
        req.flash('error', 'Unable to load news data. Please try again later.');
        res.render('news/index', { articles: [], currentCategory: topic });
    }
};

exports.getNewsDetail = (req, res) => {
    // Since we don't save articles to a DB, we pass the data via query params for the viewer
    const { title, source, content, url, image } = req.query;
    res.render('news/detail', { 
        article: { title, source, content, url, image } 
    });
};