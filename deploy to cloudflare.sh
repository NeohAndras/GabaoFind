# Install Wrangler if needed:
# npm install -g wrangler
#
# Login once:
# wrangler login
#
# Create the Pages project once:
# wrangler pages project create gabaoindex --production-branch=main
#
# Deploy the current directory:
wrangler pages deploy . --project-name=gabaoindex --branch=main
