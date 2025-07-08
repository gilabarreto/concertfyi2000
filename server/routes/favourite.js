const router = require("express").Router();
const pool = require("../db");
const { checkForArtist } = require("../helpers");
const authorization = require("../middleware/authorization");

router.post("/add", authorization, async (req, res) => {
  checkForArtist(req.body.artistId, req.body.artistName, req.body.image).then(
    (result) => {
      const artistID = result;
      pool
        .query(
          `SELECT * FROM favourites WHERE artist_id = $1 AND user_id = $2`,
          [result, req.user.id]
        )
        .then((favresult) => {
          if (!favresult.rows[0]) {
            pool
              .query(
                `INSERT INTO favourites (user_id, artist_id) VALUES ($1, $2) RETURNING *`,
                [req.user.id, artistID]
              )
              .then((data) => {
                res.json({ favourite: data.rows[0] });
              });
          } else {
            res.json({ result: 0 });
          }
        });
    }
  );
});

router.post("/delete", authorization, async (req, res) => {
  pool
    .query(`DELETE FROM favourites WHERE artist_id = $1 AND user_id = $2`, [
      req.body.artist_id,
      req.user.id,
    ])
    .then(() => {
      res.json({ success: true });
    })
    .catch((err) => {
      res.status(500).send("Cannot delete");
      console.log(err);
    });
});

router.post("/show", authorization, async (req, res) => {});

router.get("/", authorization, async (req, res) => {
  pool
    .query(
      `SELECT artists.artistname, artists.artistimage, favourites.artist_id, artists.artistid
            FROM artists 
            JOIN favourites 
              ON artists.id = favourites.artist_id 
            JOIN users 
              ON users.id = favourites.user_id 
            WHERE users.user_email = $1`,
      [req.user.user_email]
    )
    .then((sqlresults) => {
      res.json(sqlresults.rows);
    });

});

module.exports = router;
