const pool = require("./db");

const checkForArtist = async (artistId, artistName, image) => {
  let artistTableId;
  try {
    console.log("before");
    const result = await pool.query(
      `SELECT * FROM artists where artists.artistid = $1`,
      [artistId]
    );
    console.log("after");
    if (result.rows.length === 0) {
      console.log("inside if");
      const artist = await pool.query(
        `INSERT INTO artists (artistId, artistName, artistimage)
        VALUES ($1, $2, $3) RETURNING*`,
        [artistId, artistName, image]
      );
      artistTableId = artist.rows[0].id;
      console.log("Artist:", artistTableId);
    } else {
      artistTableId = result.rows[0].id;
      console.log("Artist:", artistTableId);
    }
    return artistTableId;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = { checkForArtist };
