// server/index.js
const express = require("express");
const PORT = process.env.PORT || 3001;
const app = express();
app.listen(PORT, () => {
    // tslint:disable-next-line:no-console
    console.log(`Server listening on ${PORT}`);
});
app.get("/api", (req, res) => {
    res.json({ message: 'Hello ' + req.query.foo });
});
