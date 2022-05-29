const express = require('express');
const routes = require('./routes');
const seeds = require('./seeds');

// import sequelize connection
const sequelize = require('./config/connection');

async function Start(rebuild, reseed) {
    const app = express();
    const PORT = process.env.PORT || 3001;

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(routes);

    // sync sequelize models to the database, then turn on the server
    await sequelize.sync({ force: rebuild })
        .then(console.log("Database synchronized"));

    if (reseed) {
        await seeds();
    }

    app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!`);
    });
}

const recreateDb = process.argv.indexOf("--rebuild") < 0 ? false : true;
const reseedDb = process.argv.indexOf("--seed") < 0 ? false : true;

Start(recreateDb, reseedDb);