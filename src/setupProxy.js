const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://172.18.7.91:7777',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api/v5', // rewrite path
      },
    })
  );
};
