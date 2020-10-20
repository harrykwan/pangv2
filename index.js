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
// awsapi.createtable("requestvideo", "rid");

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

app.get("/paycourse", (req, res) =>
  res.sendFile("html/paycourse.html", {
    root: __dirname,
  })
);

app.get("/single-course", (req, res) =>
  res.sendFile("html/single-course.html", {
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
      lastvalue: lastvalue,
    };
    res.send(resultjson);
    if (typeof lastdata != "undefined") {
      //more item
      console.log("more");
    }
  });
});

app.get("/getallmyvideo/:uid", (req, res, next) => {
  awsapi.readitem("userdata", "uid", req.params.uid, undefined, undefined, function (tempdata) {
    res.send(tempdata.Item.videolist)
  })
});

app.get("/getallvideonextpage/:itemnum", (req, res, next) => {
  const tempstartnum = parseInt(req.params.itemnum)
  awsapi.getallitem("videodata", tempstartnum, function (
    lastvalue,
    mydata
  ) {
    let resultjson = {
      body: mydata,
      lastvalue: lastvalue,
    };
    res.send(resultjson);
    if (typeof lastdata != "undefined") {
      //more item
      console.log("more");
    }
  });
});

app.get("/getallitem/:dbname/:itemnum", (req, res, next) => {
  const tempstartnum = parseInt(req.params.itemnum)
  awsapi.getallitem(req.params.dbname, tempstartnum, function (
    lastvalue,
    mydata
  ) {
    let resultjson = {
      body: mydata,
      lastvalue: lastvalue,
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
    res.send(mydata);
  });
});



app.use(bodyParser.json());
app.post("/updatevideodata", (req, res) => {
  console.log(req.body);
  awsapi.createitem("videodata", req.body, undefined, undefined, function () {
    res.send("ok");
  });
});

app.post("/requestvideo", (req, res) => {
  var today = new Date();
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date + " " + time;
  const tempjson = req.body
  // console.log(tempjson)
  tempjson.dateTime = dateTime
  awsapi.createitem(
    "requestvideo",
    tempjson,
    undefined,
    undefined,
    function () {
      res.send("ok");
    }
  );
});

app.post("/acceptrequest", (req, res) => {
  const temprid = req.body.rid;
  awsapi.deleteitem("requestvideo", "rid", temprid, function () {
    res.send('ok')
  })
});

app.post("/addvideotouser", (req, res) => {
  console.log(req.body)
  awsapi.readitem("userdata", "uid", req.body.uid, undefined, undefined, function (tempdata) {
    console.log(tempdata)
    let updateddata
    if (Object.keys(tempdata).length === 0 && tempdata.constructor === Object) {
      updateddata = {
        uid: req.body.uid
      }
      updateddata.videolist = []
    } else {
      updateddata = tempdata.Item
      if (!updateddata.videolist) {
        updateddata.videolist = []
      }
    }
    updateddata.videolist.push(req.body)
    awsapi.createitem("userdata", updateddata, undefined, undefined, function () {
      res.send('ok')
    })
  }, function (err) {
    console.log(err)
  })
})

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);