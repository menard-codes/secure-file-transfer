import express from "express";
import dotenv from "dotenv";
import { filesRouter } from "./routes/files/route.ts";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { exec } from 'child_process';
import util from 'util';
import prisma from './db.ts';

const execAsync = util.promisify(exec);

dotenv.config();

async function applyMigrations() {
  console.log('Checking database connection...');
  try {
    await prisma.$connect();
    console.log('Database connection successful.');

    console.log('Applying database migrations...');
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    
    if (stderr) {
      console.error('Migration error:', stderr);
    } else {
      console.log('Migration output:', stdout);
      console.log('Migrations applied successfully.');
    }
  } catch (error) {
    console.error('Failed to apply migrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function startServer() {
  await applyMigrations();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Register view engine (ejs)
  app.set('view engine', 'ejs');
  app.set('views', join(dirname(fileURLToPath(import.meta.url)), '/views'));

  // Serving assets
  app.use(
    express.static(join(
      dirname(fileURLToPath(import.meta.url)),
      '/public'
    ))
  );

  // parsing
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('/', (req, res) => {
    res.render('index');
  });

  app.get('/about', (req, res) => {
    res.render('about');
  });

  app.get('/help', (req, res) => {
    res.render('help');
  })

  // default 404 page where all 404 errors redirect to
  app.get('/404', (req, res) => {
    res.statusCode = 404;
    res.statusMessage = 'Not Found';
    res.render('404');
  })

  // routes
  app.use('/files', filesRouter);

  app.use((req, res) => {
    res.redirect('/404');
  });

  app.listen(PORT, () => console.log(`Server listening to port ${PORT}`));
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});