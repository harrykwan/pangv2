const AWS = require("aws-sdk");
require("dotenv").config();
const BUCKET_NAME = process.env.BUCKET_NAME;
const IAM_USER_KEY = process.env.IAM_USER_KEY;
const IAM_USER_SECRET = process.env.IAM_USER_SECRET;
/** config the region and access key, access id */
AWS.config.update({
  region: "ap-southeast-1",
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET,
});

const Busboy = require("busboy");

let s3bucket = new AWS.S3({
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET,
  Bucket: BUCKET_NAME,
});

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

function uploadToS3(file, res, callback) {
  s3bucket.createBucket(function () {
    var params = {
      Bucket: BUCKET_NAME,
      Key: file.name,
      Body: file.data,
    };
    s3bucket.upload(params, function (err, data) {
      if (err) {
        console.log("error in callback");
        console.log(err);
      }
      console.log("success");
      console.log(data.Location);
      if (callback) {
        callback();
      }
      if (res) {
        res.send(data);
      }
    });
  });
}

function getphotofroms3(x, req, res) {
  var params = {
    Bucket: BUCKET_NAME,
    Key: x,
  };
  s3bucket.getObject(params, function (err, data) {
    res.writeHead(200, {
      "Content-Type": "image/" + x.split(".")[1],
    });
    res.write(data.Body, "binary");
    res.end(null, "binary");
  });
}

function createtable(tablename, keyname) {
  var params = {
    TableName: tablename,
    KeySchema: [{
      AttributeName: keyname,
      KeyType: "HASH",
    }, ],
    AttributeDefinitions: [{
      AttributeName: keyname,
      AttributeType: "S",
    }, ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10,
    },
  };

  dynamodb.createTable(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to create table. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log(
        "Created table. Table description JSON:",
        JSON.stringify(data, null, 2)
      );
    }
  });
}

function createitem(table, item, req, res, callback) {
  var params = {
    TableName: table,
    Item: item,
  };

  console.log("Adding a new item...");
  docClient.put(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to add item. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      if (res) {
        res.send(data);
      }
      if (callback) {
        callback(data);
      }
      console.log("Added item:", data);
    }
  });
}

// createitem({
//     uid: "testuid",
//     testdata: "testdata"
// })

function readitem(table, key, value, req, res, callback, errcallback) {
  var tempjson = {};
  tempjson[key] = value;
  var params = {
    TableName: table,
    Key: tempjson,
  };

  docClient.get(params, function (err, data) {
    if (err) {
      // console.error(
      //   "Unable to read item. Error JSON:",
      //   JSON.stringify(err, null, 2)
      // );
      if (errcallback) {
        errcallback(err);
      }
    } else {
      if (callback) {
        callback(data);
      }
      if (res) {
        res.send(data);
      }
      console.log("GetItem succeeded:", data);
    }
  });
}

function queryitem(table, key, value, req, res, callback) {
  var params = {
    TableName: table,
    KeyConditionExpression: "#key = :value",
    ExpressionAttributeNames: {
      "#key": key,
    },
    ExpressionAttributeValues: {
      ":value": value,
    },
  };

  console.log("Scanning Movies table.");
  docClient.scan(params, function (err, data) {
    if (err) {
      console.error(
        "Unable to scan the table. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      // print all the movies
      console.log("Scan succeeded.");
      data.Items.forEach(function (movie) {
        console.log(
          movie.year + ": ",
          movie.title,
          "- rating:",
          movie.info.rating
        );
      });

      // continue scanning if we have more movies, because
      // scan can retrieve a maximum of 1MB of data
      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        params.ExclusiveStartKey = data.LastEvaluatedKey;
        docClient.scan(params, onScan);
      }
    }
  });
}

function scandata(table, key, value, callback) {
  var params = {
    TableName: table,
    FilterExpression: "#key = :value",
    ExpressionAttributeNames: {
      "#key": key,
    },
    ExpressionAttributeValues: {
      ":value": value,
    },
  };

  docClient.scan(params, function (err, data) {
    if (err) {
      console.error("Unable to scan. Error:", JSON.stringify(err, null, 2));
    } else {
      console.log("scan succeeded.");
      // data.Items.forEach(function (item) {
      //     console.log(" -", item.year + ": " + item.title);
      // });
      if (callback) {
        callback(data.Items);
      }
    }
  });
}

function deleteitem(table, key, value, callback) {
  var tempjson = {};
  tempjson[key] = value;
  var params = {
    TableName: table,
    Key: tempjson,
  };

  console.log("Attempting a conditional delete...");
  docClient.delete(params, function (err, data) {
    if (err) {
      console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log("DeleteItem succeeded:");
      if (callback) {
        callback(data)
      }
    }
  });
}

function getallitem(table, startkey, callback) {
  var docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
    TableName: table,
    // FilterExpression: "#user_status = :user_status_val",
    // ExpressionAttributeNames: {
    //   "#user_status": "user_status",
    // },
    // ExpressionAttributeValues: { ":user_status_val": "somestatus" },
  };

  if (startkey) {
    params.ExclusiveStartKey = startkey;
  }

  docClient.scan(params, onScan);

  function onScan(err, data) {
    if (err) {
      console.error(
        "Unable to scan the table. Error JSON:",
        JSON.stringify(err, null, 2)
      );
    } else {
      console.log("Scan succeeded.");
      data.Items.forEach(function (itemdata) {
        console.log(JSON.stringify(itemdata));
      });

      callback(data.LastEvaluatedKey, data.Items);
      // continue scanning if we have more items
      if (typeof data.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        // callback(data.LastEvaluatedKey);
        // params.ExclusiveStartKey = data.LastEvaluatedKey;
        // docClient.scan(params, onScan);
      }
    }
  }
}
// readitem('testuid')

exports.uploadToS3 = uploadToS3;
exports.getphoto = getphotofroms3;
exports.createtable = createtable;
exports.createitem = createitem;
exports.readitem = readitem;
exports.deleteitem = deleteitem;
exports.queryitem = queryitem;
exports.scandata = scandata;
exports.getallitem = getallitem;