# Setting Up Vercel KV for Poker Mentor

This guide will walk you through setting up Vercel KV (Key-Value) storage for your Poker Mentor application.

## What is Vercel KV?

Vercel KV is a Redis-based key-value database that's fully managed by Vercel. It's perfect for:

- User session data
- Game state persistence
- Leaderboards
- Simple data storage without complex relationships

## Setup Steps

### 1. Connect Your Repository to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New" → "Project"
4. Select your repository and click "Import"
5. On the configuration page, leave the defaults and click "Deploy"

### 2. Add Vercel KV to Your Project

1. Once deployed, go to your project dashboard
2. Click on "Storage" in the sidebar
3. Select "KV" → "Create Database"
4. Choose a region close to your target audience
5. Choose the "Free" plan (10MB storage, sufficient for testing)
6. Click "Create" to create your KV database

### 3. Connect KV to Your Project

1. In your project settings, click "Environment Variables"
2. Vercel will have automatically added `KV_URL` and `KV_REST_API_URL` as environment variables
3. Click "Save" to update environment variables

### 4. Redeploy Your Project

1. Go to the "Deployments" tab
2. Find your latest deployment
3. Click the three dots (•••) and select "Redeploy"
4. Wait for the deployment to complete

## Testing Your KV Setup

To test if your KV database is working correctly:

1. Visit your deployed application
2. Create a new account/session
3. Play a few hands of poker
4. Close the browser and revisit the site
5. Your balance and stats should persist

## Monitoring KV Usage

You can monitor your KV usage in the Vercel dashboard:

1. Go to your project dashboard
2. Click on "Storage" → "KV"
3. View metrics like storage used, operations, and more

## Troubleshooting

If your data isn't persisting:

1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Check Vercel logs for any KV connection issues

## Next Steps

As your application grows, you may want to:

1. Upgrade to a paid plan for more storage and higher limits
2. Implement data expiration policies
3. Add caching strategies for better performance

## Need Help?

Refer to the [Vercel KV documentation](https://vercel.com/docs/storage/vercel-kv) for more details.
