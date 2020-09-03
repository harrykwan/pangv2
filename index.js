const express = require('express')

const app = express()
const port = 80


app.use(express.static('html', {
    root: __dirname
}))

app.get('/', (req, res) => res.sendFile('html/index.html', {
    root: __dirname
}))


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))