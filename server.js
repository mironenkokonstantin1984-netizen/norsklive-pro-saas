const { app } = require('./server/app');

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`NorskLive Pro server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
