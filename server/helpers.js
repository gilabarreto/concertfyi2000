const checkForArtist = async (artistId, artistName, image) => {
  let artistTableId;
  try {
    const result = await pool.query(
      `SELECT * FROM artists where artists.artistid = $1`,
      [artistId]
    );
    if (result.rows.length === 0) {
      const artist = await pool.query(
        `INSERT INTO artists (artistId, artistName, artistimage)
        VALUES ($1, $2, $3) RETURNING*`,
        [artistId, artistName, image]
      );
      artistTableId = artist.rows[0].id;
    } else {
      artistTableId = result.rows[0].id;
    }
    return artistTableId;
  } catch (error) {
    console.log("Error:", error.message);
  }
};

module.exports = { checkForArtist };
