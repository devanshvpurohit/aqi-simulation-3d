# 🚀 Deploying to Vercel

Yes! This project is 100% ready for Vercel. Since it is a static site (HTML/JS/CSS), it will host perfectly for free.

## Option 1: Drag & Drop (Easiest)
1.  Go to [vercel.com/new](https://vercel.com/new).
2.  Drag the **`aqi-simulation`** folder directly onto the import area.
3.  Vercel will detect the configuration.
4.  Click **Deploy**.

## Option 2: GitHub (Recommended)
1.  Initialize a git repo:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  Push to a new GitHub repository.
3.  Go to Vercel and import that repository.
4.  **Important Setting**:
    *   Vercel might ask for the "Root Directory".
    *   Leave it as `./` (Root) because I included a `vercel.json` file that automatically points traffic to the `public/` folder.
    *   *Alternative*: You can set "Root Directory" to `public` in the Vercel settings if you prefer not to use `vercel.json`.

## Option 3: Vercel CLI
If you have the Vercel CLI installed:
```bash
cd /Users/devanshvpurohit/Downloads/aqi-simulation
vercel
```
Follow the prompts (accept defaults).

---

## ⚠️ Important Note on "Real AI"
If you downloaded the **Real ONNX Model** (as per `REAL_MODELS.md`), make sure the `public/assets/model.onnx` file is less than **100MB** if you are on the Vercel Free Tier (Git LFS might be needed for GitHub, but Vercel CLI handles large files well).
*   *Note: The `Xenova/t5-small` model currently used in the code loads from a CDN, so it works instantly without uploading anything!*
