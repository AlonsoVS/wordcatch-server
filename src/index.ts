import express from 'express';
import { Express, Request, Response } from 'express';

const app:Express = express();
const port = process.env.PORT || 8080;

app.get('/', (request:Request, response:Response) => {
  response.send('Welcome to Wordcatch server');
});

app.listen(port, () => {
  console.log(`Running Wordcatch Server. \nListen on port ${port}`);
  console.log(`You can view the main page in http://localhost:${port}`);
});