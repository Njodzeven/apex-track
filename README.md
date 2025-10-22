# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([

## Deployment

This repo includes a convenient `npm run deploy` script that builds the app and publishes the `dist/` folder to a branch named `gh` using the `gh-pages` package.

1. Install dependencies:

  ```bash
  npm ci
  ```

2. Run the deploy script (this will build and push to the `gh` branch):

  ```bash
  npm run deploy
  ```

3. In your repository settings on GitHub, go to Pages and set the site source to the `gh` branch (root).

If you prefer a different branch, edit the `deploy` script in `package.json` and change the `-b gh` argument to the branch you want.

Automatic deployment via GitHub Actions

This repository also includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) which will automatically build and publish the site whenever you push to `main` or `master`. The workflow publishes the build output to the `gh` branch. Make sure GitHub Actions are enabled for your repository (they are enabled by default).

If you prefer local deploys only, you can ignore or remove the workflow file.

Note about permissions: If the workflow still fails with a 403 when trying to push to the `gh` branch, go to your GitHub repository settings → Actions → General and ensure that "Allow GitHub Actions to create and approve pull requests" and workflow permissions are enabled (or set to use the GITHUB_TOKEN with write access). Organization policies may also block pushes from actions; in that case ask an admin to permit the workflow or use a personal PAT stored in repository secrets as `ACTIONS_DEPLOY_KEY` and configure the action to use it.

  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
