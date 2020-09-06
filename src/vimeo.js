const request = require('request')

let Vimeo = require('vimeo').Vimeo;
let client = new Vimeo("76d5fde2be8d470b3a4459392a77b6651d52b919", "USuwhWwQ3z4oIzBRYIwaamaP+zQJfz8gjyBOKa24ATZSOESgFhVid+jjemXzEqojq44+dNoRe2CPoJp6rAo4Ka94vpnC+xvio3XudgmbZKL1Nmdzj+B4RmWyNVIxXlzu", "dcbc9ee84db9560e4e2744fa5ac0cc50");
const axios = require('axios');

/**
 * This function will accept details about a video
 * and upload the video to vimeo server
 * @param  {string} filepath the path to the file
 * @param  {string} filename name of the file
 * @param  {string} filedes description of the file
 * @param  {req} req req
 * @param  {res} res res
 * @param  {callback} callback cb
 */
function upload(filepath, filename, filedes, req, res, callback) {
    client.upload(
        filepath, {
            'name': filename,
            'description': filedes
        },
        function (uri) {
            console.log('Your video URI is: ' + uri);
            const videoid = uri.split('/')[2]
            if (callback)
                callback(uri)
            if (res)
                res.send(videoid)
        },
        function (bytes_uploaded, bytes_total) {
            var percentage = (bytes_uploaded / bytes_total * 100).toFixed(2)
            console.log(bytes_uploaded, bytes_total, percentage + '%')
        },
        function (error) {
            console.log('Failed because: ' + error)
        }
    )
}

function checkupload(uri, req, res) {
    client.request('https://vimeo.com/' + uri + '?fields=transcode.status', function (error, body, status_code, headers) {
        if (body.transcode.status === 'complete') {
            console.log('Your video finished transcoding.')

        } else if (body.transcode.status === 'in_progress') {
            console.log('Your video is still transcoding.')
        } else {
            console.log('Your video encountered an error during transcoding.')
        }
    })
}

function getvideourl(uri, req, res) {

}
/** according vimeo url get embed video's html, outdated */
function getvideoembedvideo(url, req, res) {
    request
        .get('https://vimeo.com/api/oembed.json?url=' + 'vimeo.com/' + url)
        .on('response', function (response) {
            console.log(response)
            // res.send('<iframe src="https://player.vimeo.com/video/' + url + '" width="640" height="480" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>')
            res.send('https://player.vimeo.com/video/' + url)
        })
}
/** get a html with all videos, used at main page */
function getallvideo(req, res) {
    var axios = require('axios');

    var config = {
        method: 'get',
        url: 'https://api.vimeo.com/me/videos?fields=name,uri,embed.html&per_page=100',
        headers: {
            'Authorization': 'bearer dcbc9ee84db9560e4e2744fa5ac0cc50',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
    };

    axios(config)
        .then(function (response) {
            // console.log(JSON.stringify(response.data));
            res.send(response.data)
        })
        .catch(function (error) {
            console.log(error);
        });

}
/** get metadata from a vimeo video */
function getvideodata(vid, callback) {
    console.log(vid)
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://api.vimeo.com/videos/' + vid,
        'headers': {
            'Authorization': 'bearer dcbc9ee84db9560e4e2744fa5ac0cc50',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        // console.log(response.body);
        console.log('ok')
        callback(response.body)
    });

}




exports.upload = upload
exports.checkupload = checkupload
exports.getvideourl = getvideourl
exports.getvideoembedvideo = getvideoembedvideo
exports.getallvideo = getallvideo
exports.getvideodata = getvideodata