# 1. Install Wrangler
npm install -g wrangler

# 2. Login
wrangler login

# 3. Create project (one-time)
wrangler pages project create gabaoindex --production-branch=main

# 4. Deploy
wrangler pages deploy . --project-name=gabaoindex --branch=main