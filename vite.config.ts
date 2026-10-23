import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function earlyStylesheetDiscoveryPlugin(): Plugin {
  return {
    name: 'early-stylesheet-discovery',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Encontra todas as tags <link rel="stylesheet"> geradas pelo Vite para o bundle de assets CSS
        const cssLinkRegex = /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*assets\/[^"']+\.css["'][^>]*>/gi;
        const matches = html.match(cssLinkRegex);
        if (!matches || matches.length === 0) return html;

        // Remove a tag da posição padrão (injetada no final de <head>, após os módulos JS)
        let cleanedHtml = html.replace(cssLinkRegex, '');

        // Formata as tags encontradas
        const stylesheetTags = matches.join('\n    ');

        // Posiciona a folha de estilo no topo do <head>, logo após a meta tag de viewport,
        // garantindo que o preload scanner e o parser HTML descubram o CSS no 1º pacote TCP
        if (cleanedHtml.includes('name="viewport"')) {
          return cleanedHtml.replace(
            /(<meta\s+name=["']viewport["'][^>]*>)/i,
            `$1\n    ${stylesheetTags}`
          );
        } else if (cleanedHtml.includes('<head>')) {
          return cleanedHtml.replace(/<head>/i, `<head>\n    ${stylesheetTags}`);
        }
        return cleanedHtml;
      },
    },
  };
}

export default defineConfig(({ command }) => {
  if (command === 'build') {
    process.env.NODE_ENV = 'production';
  }

  return {
    base: './',
    plugins: [react(), tailwindcss(), earlyStylesheetDiscoveryPlugin()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        input: {
          main: resolve(rootDir, 'index.html'),
          politica: resolve(rootDir, 'politica/index.html'),
          eleicoes: resolve(rootDir, 'eleicoes/index.html'),
          economia: resolve(rootDir, 'economia/index.html'),
          estados: resolve(rootDir, 'estados/index.html'),
          dadosPublicos: resolve(rootDir, 'dados-publicos/index.html'),
          noticias: resolve(rootDir, 'noticias/index.html'),
          esportes: resolve(rootDir, 'esportes/index.html'),
          tecnologia: resolve(rootDir, 'tecnologia/index.html'),
          clima: resolve(rootDir, 'clima/index.html'),
          sobre: resolve(rootDir, 'sobre/index.html'),
          notFound: resolve(rootDir, '404.html'),
        },
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
