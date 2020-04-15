const getExpressApp = require('./get-express-app');

const app = getExpressApp();
app.listen(3000, (error) => {
    if (error) {
        console.error(error);
    } else {
        console.log('Express server listening on port 3000');
    }
});
