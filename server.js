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
        await seeds()
            .then(console.log("Database seeded"));
    }

    app.listen(PORT, () => {
        console.log(`App listening on port ${PORT}!`);
    });
}

async function SeedDb() {
    console.log("Reseeding database");
    await seeds();
    console.log("Database seeded");
    process.exit(0);
}

if (process.argv.indexOf("--reseed") > 0) {
    SeedDb();
} else {
    console.log("Starting app");
    const recreateDb = process.argv.indexOf("--rebuild") < 0 ? false : true;
    const reseedDb = process.argv.indexOf("--seed") < 0 ? false : true;

    Start(recreateDb, reseedDb);
}