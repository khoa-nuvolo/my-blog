import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

/*
const articlesInfo = {
    'learn-react': {
        upvotes: 0,
        comments: []
    },
    'learn-node': {
        upvotes: 0,
        comments: []
    },
    'my-thoughts-on-resumes': {
        upvotes: 0,
        comments: []
    }
}
*/

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', {
            useNewUrlParser: true
        });
        const db = client.db('my-blog');
        operations(db);
        client.close();
    } catch (error) {
        res.status(500).json({
            message: 'Error connecting to database',
            error
        });
    }
}

// GET http://localhost:8000/hello
app.get('/hello', (req, res) => res.send('Hello!'));
// GET http://localhost:8000/hello/Shawn
app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}!`));
// POST http://localhost:8000/hello
app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}!`));

// GET http://localhost:8000/api/articles/learn-react
app.get('/api/articles/:name', async (req, res) => {
    const articleName = req.params.name;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({
            name: articleName
        });
        res.status(200).json(articleInfo);
    }, res);
});
// POST http://localhost:8000/api/articles/learn-react/upvote
app.post('/api/articles/:name/upvote', async (req, res) => {
    const articleName = req.params.name;
    //articlesInfo[articleName].upvotes += 1;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({
            name: articleName
        });
        await db.collection('articles').updateOne(
            { name: articleName },
            { '$set': {
                upvotes: articleInfo.upvotes + 1
            }}
        );
        const updatedArticalInfo = await db.collection('articles').findOne({
            name: articleName
        });
        res.status(200).json(updatedArticalInfo);
    }, res);
});
// POST http://localhost:8000/api/articles/learn-node/add-comment
// Sample raw request body: {"username": "Shawn", "text": "I love this article!"}
app.post('/api/articles/:name/add-comment', (req, res) => {
    const articleName = req.params.name;
    const { username, text } = req.body;
    withDB(async (db) => {
        //articlesInfo[articleName].comments.push({ username, text });
        const articleInfo = await db.collection('articles').findOne({
            name: articleName
        });
        await db.collection('articles').updateOne(
            { name: articleName },
            { '$set': {
                comments: articlesInfo.comments.concat({ username, text })
            }}
        );
        const updatedArticleInfo = await db.collection('articles').findOne({
            name: articleName
        });
        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.get("*", (req, res) => {
    res.sendFile(path(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000.'));