# Google Maps API Setup Guide

This guide will help you set up Google Maps API for the Route Optimizer feature.

## Step 1: Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**  
   - **Directions API**
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

## Step 2: Configure Domain Restrictions (Recommended)

1. In Google Cloud Console, click on your API key
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add these referrers:
     - `localhost:*` (for local development)
     - `127.0.0.1:*` (for local development)
     - `*.github.io/*` (for GitHub Pages)
     - Your custom domain if you have one
3. Save the changes

## Step 3: Set Up Your Local Configuration

1. Copy `config.template.js` to `config.js`:
   ```bash
   copy config.template.js config.js
   ```

2. Open `config.js` and replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key

3. Set `DEMO_MODE: false` to enable Google Maps

4. The `config.js` file will be ignored by Git to keep your API key secure

## Step 4: Test the Setup

1. Open your router page locally: `http://localhost:8000/router/index.html`
2. You should see a proper Google Map instead of the demo mode message
3. Try entering addresses and using the "Optimize Route" button

## Troubleshooting

### Map shows "Oops! Something went wrong"
- Check if your API key is correct in `config.js`
- Verify that Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for specific error messages

### Map shows demo mode despite having API key
- Make sure `DEMO_MODE` is set to `false` in `config.js`
- Verify the API key is not set to the placeholder text
- Check that `config.js` is loading properly (check browser network tab)

### Autocomplete not working
- Verify that Places API is enabled in Google Cloud Console
- Check if there are any billing issues in your Google Cloud account

### Directions not working
- Verify that Directions API is enabled in Google Cloud Console
- Check your API quota and usage limits

## Security Best Practices

1. ✅ Never commit your actual API key to version control
2. ✅ Use HTTP referrer restrictions to limit where your key can be used
3. ✅ Set up API quotas to prevent unexpected charges
4. ✅ Monitor your API usage in Google Cloud Console
5. ✅ Regularly rotate your API keys

## Demo Mode

If you don't want to set up Google Maps API right now, the application will work in demo mode:
- Shows a placeholder map
- Route optimization generates mock data
- All other features work normally

This is perfect for development and testing before setting up the API.
