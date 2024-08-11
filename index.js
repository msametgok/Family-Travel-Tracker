import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "samet",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query(`SELECT country_code FROM visited_countries JOIN users ON user_id = users.id WHERE user_id = ${currentUserId}`);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });
});
app.post("/add", async (req, res) => {
  const input = req.body.country.toLowerCase();

  try {
    const result = await db.query(`SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%${input}%'`);
    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        `INSERT INTO visited_countries (country_code, user_id) VALUES ('${countryCode}', ${currentUserId})`);
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
const userId = req.body.user;
if(userId) {
  currentUserId = userId
  res.redirect('/')
}
else {
  console.log(userId);
  res.render('new.ejs')
}
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html

  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(`INSERT INTO users (name, color) VALUES ('${name}', '${color}') RETURNING *`)
  users.push(result.rows[0])
  currentUserId = result.rows[0].id;

  res.redirect('/')
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
