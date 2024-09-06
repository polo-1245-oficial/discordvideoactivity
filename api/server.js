const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 3000;

let watchedEpisodes = {}; //en un entorno eee real debería de ser un redis obviamente

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader === 'asdasd') {
        next();
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
};

app.post('/watch', authMiddleware, (req, res) => {
    const { discordId, episodeurl, title } = req.body;
    
    if (!discordId || !episodeurl || !title ) {
        return res.status(400).json({ error: 'Faltan parametros' });
    }

    watchedEpisodes[discordId] = { episodeurl, title };
    res.status(200).json({ status: 'ok' });
});

app.get('/lastWatched/:discordId', (req, res) => {
    const { discordId } = req.params;
    const lastWatched = watchedEpisodes[discordId];

    if (lastWatched) {
        res.status(200).json(lastWatched);
    } else {
        res.status(404).json({ error: 'No hay episodios por ver' });
    }
});

app.get('/watch/*', async (req, res) => {
    const videoUrl = decodeURIComponent(req.url.replace('/watch/', ''));

    try {
        const headResponse = await axios.head(videoUrl);
        const contentLength = headResponse.headers['content-length'];

        res.setHeader('Content-Type', 'video/mp4');

        if (req.headers.range) {
            const range = req.headers.range;
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            let end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;

            if (end >= contentLength) {
                end = contentLength - 1;
            }

            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Length', (end - start) + 1);

            const response = await axios.get(videoUrl, {
                headers: {
                    Range: `bytes=${start}-${end}`
                },
                responseType: 'stream'
            });

            response.data.pipe(res);
        } else {
            const response = await axios.get(videoUrl, {
                responseType: 'stream'
            });

            response.data.pipe(res);
        }

    } catch (error) {
        console.error(`Error al intentar acceder al video: ${error.message}`);
        res.status(500);
    }
}); //eee no sé, pero funciona

app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
});