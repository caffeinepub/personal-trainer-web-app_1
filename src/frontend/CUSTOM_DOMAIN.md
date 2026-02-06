# Custom Domain Setup for Internet Computer

This guide explains how to connect your own external domain (e.g., pinatotrainer.it) to your Internet Computer application.

## Overview

The Internet Computer supports custom domains through DNS configuration and a domain declaration file. After setting up DNS records and updating the configuration file, you'll need to **redeploy your application** for the changes to take effect.

## Prerequisites

Before you begin, you'll need:
- Your custom domain name (e.g., `pinatotrainer.it`)
- Access to your domain's DNS management panel (Cloudflare, GoDaddy, Namecheap, etc.)
- Your application's **canister ID** and **ICP URL**

### Finding Your Canister ID and ICP URL

1. **Canister ID**: Found in your `dfx.json` or `.dfx/local/canister_ids.json` file, or displayed after deployment
2. **ICP URL**: The published URL of your app, typically in the format: `https://[canister-id].icp0.io`

## Step 1: Update the Domain Declaration File

Edit the file `frontend/public/.well-known/ic-domains` and replace the example domains with your actual domain(s). Add one domain per line:

