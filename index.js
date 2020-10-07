const express = require("express");
const awsapi = require("./src/awsapi");
const stripeapi = require("./src/stripe");
const fileUpload = require("express-fileupload");
const viemoapi = require("./src/vimeo");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();
const port = 80;

// awsapi.createtable('coursedata',"courseid")
// awsapi.createtable("videodata", "vid");
// awsapi.createtable("userdata", "uid");

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

app.get("/createac", (req, res) =>
  res.sendFile("html/createac.html", {
    root: __dirname,
  })
);

app.get("/mycourse", (req, res) =>
  res.sendFile("html/mycourse.html", {
    root: __dirname,
  })
);

app.get("/videosetting", (req, res) =>
  res.sendFile("html/videosetting.html", {
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

app.post("/uploadtoviemo", (req, res) => {
  var uid = req.body.uid;
  var file = req.files.file;
  console.log(uid);
  console.log(file);
  if (uid && file) {
    const viemofilename = file.name;
    var filename = uid + "_" + file.name;
    file.mv("./temp/" + filename, function (err) {
      if (err) {
        console.log(err);
      } else {
        // res.send('ok')
        viemoapi.upload(
          "./temp/" + filename,
          viemofilename,
          "",
          undefined,
          undefined,
          function (uri) {
            var tempuri = uri.split("/");
            tempuri = tempuri[tempuri.length - 1];
            tempitem = {
              vid: tempuri,
              uid: uid,
            };
            awsapi.createitem(
              "videodata",
              tempitem,
              undefined,
              undefined,
              function (x) {
                res.send(uri);
                fs.unlink("./temp/" + filename, function () {
                  console.log("deleted file " + filename);
                });
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

app.get("/getmyvideo/:uid", (req, res) => {
  awsapi.scandata("videodata", "uid", req.params.uid, function (data) {
    res.send(data);
  });
});

app.get("/getallvideo", (req, res, next) => {
  awsapi.getallitem("videodata", undefined, function (lastvalue, mydata) {
    let resultjson = {
      body: mydata,
      lastvalue: lastvalue
    };
    res.send(resultjson);
    if (typeof lastdata != "undefined") {
      //more item
      console.log("more");
    }
  });
});

app.get("/getallvideonextpage/:itemnum", (req, res, next) => {
  awsapi.getallitem("videodata", req.params.itemnum, function (
    lastvalue,
    mydata
  ) {
    let resultjson = {
      body: mydata,
      lastvalue: lastvalue
    };
    res.send(resultjson);
    if (typeof lastdata != "undefined") {
      //more item
      console.log("more");
    }
  });
});

app.get("/getvimeoallvideo", (req, res, next) => {
  console.log("getviemoallvideo");
  viemoapi.getallvideo(req, res);
});

app.get("/getvimeovideodata/:vid", (req, res, next) => {
  viemoapi.getvideodata(req.params.vid, function (data) {
    res.send(data);
  });
});


app.get("/getvideodata/:vid", (req, res, next) => {
  awsapi.scandata("videodata", "vid", req.params.vid, function (mydata) {
    res.send(mydata)
  })
});


app.use(bodyParser.json());
app.post("/updatevideodata", (req, res) => {
  console.log(req.body);
  awsapi.createitem("videodata", req.body, undefined, undefined, function () {
    res.send("ok");
  });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);