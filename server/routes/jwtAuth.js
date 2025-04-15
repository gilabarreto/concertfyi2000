const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");

//Register
router.post("/register", validInfo, async (req, res) => {
  try {
    //1. Destruction the req.body (name, email, password)

    const { name, email, password } = req.body;

    //2. Check if user exist (if user exist then throw error)

    const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
      email,
    ]);

    if (user.rows.length !== 0) {
      return res.status(401).json({error: "This email is already registered!"});
    }

    //3. Bcrypt the user password

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);

    const bcryptPassword = await bcrypt.hash(password, salt);

    //4. Enter the new user inside our database

    const newUser = await pool.query(
      "INSERT INTO users (user_name, user_email, user_password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, bcryptPassword]
    );

    //5. Generating our jwt token

    const token = jwtGenerator(newUser.rows[0]);

    return res.json({ token })
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server Error");
  }
});

//Login
router.post("/login", validInfo, async (req, res) => {
  try {
    //1. Destructure the req.body

    const { email, password } = req.body;

    //2. Check if user doesn't exist (if not then throw error)

    const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({error: "Password or email is incorrect"});
    }

    //3. Check if incoming password is the same as database password

    const validPassword = await bcrypt.compare(password, user.rows[0].user_password);

    if (!validPassword) {
      return res.status(401).json({error: "Password or email is incorrect"});
    }

    //4. Give them the jwt token

    const token = jwtGenerator(user.rows[0]);
    
    return res.json({ token })
  } catch (err) {
    console.err(err.message);
    res.status(500).send("server Error");
  }
});

router.get("/is-verify", authorization, async (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    console.err(err.message);
    res.status(500).send("server Error");
  }
});

module.exports = router;
