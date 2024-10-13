import esbuild from 'esbuild';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = 'src';
const distDir = 'dist';

// Ensure the dist directory exists
fs.ensureDirSync(distDir);

// Copy non-TypeScript files
fs.copySync(srcDir, distDir, {
  filter: (src) => {
    const ext = path.extname(src);
    return ext !== '.ts' && ext !== '.tsx';
  }
});

// Plugin to rewrite imports
const importRewritePlugin = {
  name: 'import-rewrite',
  setup(build) {
    build.onLoad({ filter: /\.[jt]s$/ }, async (args) => {
      try {
        let contents = await fs.promises.readFile(args.path, 'utf8');
        const relativePath = path.relative(srcDir, path.dirname(args.path));
        
        // Replace ~ imports
        contents = contents.replace(
          /(from\s+['"])~\/(.+?)(['"])/g,
          (match, start, importPath, end) => {
            const relativeToDist = path.relative(relativePath, importPath);
            const newPath = relativeToDist.startsWith('.') ? relativeToDist : './' + relativeToDist;
            return `${start}${newPath}${end}`;
          }
        );
        
        // Replace .ts with .js in relative imports
        contents = contents.replace(
          /(from\s+['"])(\.\.?\/[^'"]+?)(\.ts)?(['"])/g,
          (match, start, importPath, ext, end) => {
            return `${start}${importPath}.js${end}`;
          }
        );
        
        return { contents, loader: 'ts' };
      } catch (error) {
        return {
          errors: [{
            text: `Error processing file ${args.path}: ${error.message}`,
            location: { file: args.path },
          }],
        };
      }
    });
  },
};

// Build TypeScript files
esbuild.build({
  entryPoints: ['src/**/*.ts'],
  bundle: true,
  platform: 'node',
  outdir: distDir,
  format: 'esm',
  external: ['*'],
  outExtension: { '.js': '.js' },
  plugins: [importRewritePlugin],
  loader: {
    '.html': 'text',
    '.ejs': 'text',
  },
  // Add path alias resolution
  resolveExtensions: ['.ts', '.js'],
  alias: {
    '~': path.resolve(__dirname, srcDir)
  }
})
.then(() => console.log('Build complete'))
.catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});