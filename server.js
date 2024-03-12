/**
 * Express server
 * Author: Oluwatobiloba Light
 * File: server.js
 */

import express from 'express';
import { AppRouter } from './routes/index';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: false }));
app.use(AppRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
