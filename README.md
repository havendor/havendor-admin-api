## Setup

This project uses private GitHub Packages. Before running `npm install`, you need to authenticate.

### 1. Create a GitHub Personal Access Token

- Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
- Generate a new token with `read:packages` scope
- Copy the token

### 2. Create a `.npmrc` file in the project root

```
@havendor:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
```

### 3. Run install

```powershell
npm install
```

> `.npmrc` is gitignored — never commit your token.
