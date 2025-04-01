// Script to fetch memecoin data and save it to a static JSON file
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Fetch memecoin data function
async function fetchMemecoins() {
  try {
    console.log('Fetching memecoin data...');
    
    // Make a request to the API endpoint
    const response = await fetch('https://smithery.ai/server/@pwh-pwh/coin-mcp-server/mcp/top100', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer 83df37fc-1845-46f1-a8ed-38c94f9fe268'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched data for ${data.length} memecoins`);
    
    // Filter for coins that are down in the last 24 hours
    const downCoins = data.filter(coin => {
      const percentChange24h = parseFloat(coin.quote?.USD?.percent_change_24h) || 0;
      return percentChange24h < 0;
    });
    
    console.log(`Found ${downCoins.length} memecoins that are down in the last 24 hours`);
    
    // Add additional fields useful for the game
    const enrichedCoins = downCoins.map(coin => {
      const percentChange = parseFloat(coin.quote?.USD?.percent_change_24h) || 0;
      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        slug: coin.slug,
        percentChange24h: percentChange,
        price: parseFloat(coin.quote?.USD?.price) || 0,
        marketCap: parseFloat(coin.quote?.USD?.market_cap) || 0,
        rank: coin.cmc_rank,
        logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
        // Game-specific data
        fallSpeed: Math.min(Math.abs(percentChange) / 5, 10), // Scaled to a reasonable game speed
        size: Math.min(Math.abs(percentChange) / 10 + 0.5, 3), // Scale size based on percent change
        damage: Math.min(Math.abs(percentChange) / 5, 20) // Scale damage based on percent change
      };
    });
    
    // Sort by largest drop first
    enrichedCoins.sort((a, b) => a.percentChange24h - b.percentChange24h);
    
    // Save to a JSON file
    const outputDir = path.join(__dirname, 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'memecoins.json');
    fs.writeFileSync(outputPath, JSON.stringify(enrichedCoins, null, 2));
    
    console.log(`Saved data for ${enrichedCoins.length} memecoins to ${outputPath}`);
    return enrichedCoins;
    
  } catch (error) {
    console.error('Error fetching memecoin data:', error);
    return [];
  }
}

// Execute the fetch function
fetchMemecoins(); 