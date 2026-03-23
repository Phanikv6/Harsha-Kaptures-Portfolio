# How to Push to GitHub

## Step 1: Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `harsha-kaptures-website` (or your choice)
3. Description: "Photography portfolio website"
4. Choose Public or Private
5. **DO NOT** check "Initialize with README" (we already have one)
6. Click "Create repository"

## Step 2: Connect and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
cd harsha-kaptures-website
git remote add origin https://github.com/YOUR_USERNAME/harsha-kaptures-website.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Alternative: Using SSH (if you have SSH keys set up)

```bash
cd harsha-kaptures-website
git remote add origin git@github.com:YOUR_USERNAME/harsha-kaptures-website.git
git branch -M main
git push -u origin main
```

## If you need to authenticate:
- GitHub may prompt for your username and password
- For password, use a Personal Access Token (not your account password)
- Create token at: https://github.com/settings/tokens
- Select scope: `repo` (full control of private repositories)

