// herokuLogsRoute.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Discord webhook URL
const discordWebhookURL = 'https://discord.com/api/webhooks/1286383972989014109/XN5T3CrExOjuwOoneRykElF3-4WeQcLBMhX_Ns7l4kJU8wF-dVHdqf9f5juTyQmiVBZY';

let isAppReady = false;

app.listen(PORT, () => {
    isAppReady = true; // Set the flag to true after the app is ready
    console.log(`Server is running on port ${PORT}`);
  });
  
// Function to filter the logs
function filterLogs(logData) {
    // Ensure logData is a string
    if (typeof logData !== 'string') {
      logData = JSON.stringify(logData); // Convert object to string if needed
    }
  
    const logLines = logData.split('\n');
    const filteredLogs = logLines.filter(line => {
      // Customize filter logic (e.g., include console.log or specific log levels)
      return (
        line.includes('console.log') || 
        line.includes('INFO')
      );
    });
  
    return filteredLogs.join('\n');
  }

// Route handler for Heroku logs
router.post('/heroku-logs', async (req, res) => {
    if (!isAppReady) {
        return res.status(503).send('App is still starting, try again later');
      }
    
   const logData = req.body;

   const filteredLogData = filterLogs(logData);

   if (filteredLogData) {
     try {
       await axios.post(discordWebhookURL, {
         content: `\`\`\`${filteredLogData}\`\`\``,
       });
       res.status(200).send('Filtered log sent to Discord');
     } catch (error) {
    //    console.error('Error sending to Discord:', error);
       res.status(500).send('Failed to send filtered log to Discord');
     }
   } else {
     res.status(200).send('No matching logs to send');
   }
});

module.exports = router;
