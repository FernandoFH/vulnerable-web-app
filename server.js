const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

// Configuración de express-handlebars
const hbs = exphbs.create({
    extname: '.html',
    partialsDir: path.join(__dirname, 'views'),
    defaultLayout: 'head',
});

app.engine('.html', hbs.engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.html');

// Middleware para archivos estáticos
app.use('/static', express.static(__dirname + '/static'));

// Configuración de body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de express-session
app.use(session({
    name: 'sid',
    secret: 'supersecretsecur3passw0rd',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: false,
        maxAge: 60000 * 60 * 24,
    },
}));

// Variable global para demostración de XSS
var global_var = "This is a greeting to all users that view this page! Change it in the box below.";

// Rutas
app.get("/", function (req, res) {
    return res.render("main", {});
});

app.get("/reflected_xss", function (req, res) {
    res.header("X-XSS-Protection", 0);
    return res.render("reflected", { payload: req.query.foobar });
});

app.get("/reflected_xss_2", function (req, res) {
    res.header("X-XSS-Protection", 0);
    return res.render("reflected1", { payload: req.query.foo });
});

app.get("/reflected_xss_3", function (req, res) {
    return res.render("reflected2", { payload: req.query.foo });
});

app.get("/stored_xss", function (req, res) {
    return res.render("stored", { payload: global_var });
});

app.post("/stored_xss", function (req, res) {
    global_var = req.body.stored_payload;
    return res.redirect("/stored_xss");
});

app.get("/csrf", function (req, res) {
    if (typeof req.session.account_number == "undefined")
        req.session.account_number = "1234567";
    return res.render("csrf", { account_number: req.session.account_number });
});

app.post("/csrf", function (req, res) {
    req.session.account_number = req.body.account_number;
    return res.redirect("/csrf");
});

app.param("view", function (req, res, next, view) {
    req.view = view;
    next();
});

app.get("/views/:view", function (req, res) {
    return res.sendFile(path.join(__dirname, "views/" + req.view));
});

app.param("id", function (req, res, next, id) {
    req.id = id;
    next();
});

app.get("/private_pages/:id/document.html", function (req, res) {
    if (req.id == 123)
        return res.render("idor");
    else {
        if (!isNaN(req.id))
            return res.render("idor_bad", { id: req.id });
        else
            return res.render("idor_bad", { id: req.id, notNum: true });
    }
});

app.get("/rce", function (req, res) {
    return res.render("rce");
});

app.param("fuzz", function (req, res, next, fuzz) {
    req.fuzz = fuzz;
    next();
});

app.get("/fuzzing/:fuzz", function (req, res) {
    if (req.fuzz.indexOf("$") > -1 || req.fuzz.indexOf("^") > -1 || req.fuzz.indexOf("@") > -1) {
        // "privatekey_a0e5613a3c7f5779b47ab34657c48cf4".db_write();
        return res.render("fuzz");
    } else
        return res.render("fuzz");
});

app.param("user", function (req, res, next, user) {
    req.user = user;
    next();
});

app.get("/ban/user/:user", function (req, res) {
    return res.render("banned", { user: req.user });
});

app.get("/auth_bypass", function (req, res) {
    return res.render("auth_bypass");
});

app.get("/general", function (req, res) {
    res.header("X-XSS-Protection", 0);
    return res.render("general", { payload: req.query.foo });
});

app.post("/csrf_protected_form", function (req, res) {
    if (!req.body.recoveryemail || !req.body.csrf_token)
        return res.status(400).send("Missing one or more parameters");
    return res.status(200).send("Successfully Saved");
});

// Inicia el servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

