const express = require('express');
const bodyParser = require('body-parser');

const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
app.set('port', 5558);

const userModel = require('./model/user');



app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    key: "user_id",
    secret: "RandomSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000,
    },
}));

const sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_id) {
        res.redirect("/dashbord");
    } else {
        next();
    }
};

app.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});
    

app.route("/login")
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + "/public/login.html");
    })
    .post(async (req, res) => {
        var username = req.body.username;
        password = req.body.password;

        try {
            var user = await userModel.findOne({ username: username }).exec();
            if (!user) {
                console.log("User not found");
                res.redirect('/login');
            } else {
                user.comparePassword(password, (error, match) => {
                    if (!match) {
                        console.log("Password does not match");
                        res.redirect("/login");
                    } else {
                        console.log("Password match");
                        req.session.user = user;
                        console.log("User session assigned:", req.session.user);
                        res.redirect("/dashbord");
                    }
                });
            }
        } catch (error) {
            console.log("Error:", error);
            res.redirect('/login');
        }
    });


app.route("/signup")
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + "/public/signup.html");
    })
    .post(async (req, res) => {
        const user = new userModel({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });
        
        try {
            const doc = await user.save();
            req.session.user = doc;
            req.cookies.user_id = doc._id;
            res.redirect("/dashbord");
        } catch (err) {
            res.redirect("/signup");
        }
    });

app.get("/dashbord", (req, res) => {
    if (req.session.user && req.cookies.user_id) {
        res.sendFile(__dirname + "/public/dashbord.html");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    if (req.session.user && req.cookies.user_id) {
        res.clearCookie("user_id");
        res.redirect("/");
    } else {
        res.redirect("/login");
    }
});
app.use(function(req, res, next) {
    res.status(404).sendFile("sorry cant finund resource");
    });

app.listen(app.get('port'), () =>
    console.log(`Server is running at port: ${app.get('port')}`)
);
