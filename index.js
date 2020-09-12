const express = require("express");
const awsapi = require("./src/awsapi");
const stripeapi = require("./src/stripe");
const fileUpload = require("express-fileupload")

const app = express();
const port = 80;

// awsapi.createtable('coursedata',"courseid")

app.use(
  express.static("html", {
    root: __dirname,
  })
);

app.get("/", (req, res) =>
  res.sendFile("html/index.html", {
    root: __dirname,
  })
);

app.get("/login", (req, res) =>
  res.sendFile("html/login.html", {
    root: __dirname,
  })
);

app.get("/courses", (req, res) =>
  res.sendFile("html/courses.html", {
    root: __dirname,
  })
);

app.get("/upload", (req, res) =>
  res.sendFile("html/upload.html", {
    root: __dirname,
  })
);

/** add purchased video to user's list of videos owned after payment */
app.post("/paydone", (req, res, next) => {
  console.log(req.body);
  awsapi.readitem("userpurchase", req.body.uid, undefined, undefined, function (
    x
  ) {
    console.log(x);
    var myvidlist;
    if (x.Item) {
      myvidlist = x.Item.vidlist;
    } else {
      myvidlist = [];
    }
    myvidlist.push(req.body.vid);
    var tempjson = {
      uid: req.body.uid,
      vidlist: myvidlist,
    };
    console.log(tempjson);
    awsapi.createitem("userpurchase", tempjson, req, res);
  });
});

app.use(fileUpload());

app.post("/uploadvideotoaws/:uid", (req, res) => {
  var uid = req.params.uid;
  var file = req.files.file;
  if (uid && file) {
    const viemofilename = file.name;
    var filename = uid + "_" + file.name;
    file.mv("./uploads/" + filename, function (err) {
      if (err) {
        console.log(err);
      } else {
        // res.send('ok')
        viemoapi.upload(
          "./uploads/" + filename,
          viemofilename,
          "",
          undefined,
          undefined,
          function (uri) {
            awsapi.readitem(
              "coursedata",
              "courseid",
              undefined,
              undefined,
              function (data) {
                console.log(data);
                var tempitem = data.Item;
                console.log(tempitem);
                if (tempitem.videolist) {
                  tempitem.videolist.push(uri);
                } else {
                  tempitem.videolist = [uri];
                }
                console.log(tempitem);
                awsapi.createitem(
                  "coursedata",
                  "courseid",
                  undefined,
                  undefined,
                  function (x) {
                    res.send(uri);
                  }
                );
              }
            );
          }
        );
      }
    });
  } else {
    res.send("error");
  }
});

app.get("/getallvideo", (req, res, next) => {
  viemoapi.getallvideo(req, res);
});

app.get("/getvideodata/:vid", (req, res, next) => {
  viemoapi.getvideodata(req.params.vid, function (data) {
    res.send(data);
  });
});


app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
