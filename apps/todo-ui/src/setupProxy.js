const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:8080', // Specify the URL of your backend server
            changeOrigin: true,
            pathRewrite: {
                '^/api': '', // Remove the /api prefix when forwarding the request
            },
        })
    );
};