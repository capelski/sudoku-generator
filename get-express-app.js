const express = require('express');
const { join } = require('path');

module.exports = () => {
    const app = express();
    app.use('/', express.static(join(__dirname, 'dist')));
    return app;
};
