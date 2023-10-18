import express from 'express'

var router = express.Router();

router.get('/', function(req, res) {
    res.json({ connect: "O!K" });
});

module.exports = router;