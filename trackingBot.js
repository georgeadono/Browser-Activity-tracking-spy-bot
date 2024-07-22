const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log file path
  const logFilePath = path.join(__dirname, 'activityLogs.txt');

    // Navigate to the desired URL
    await page.goto('https://google.com', { waitUntil: 'networkidle' });

  // Function to log actions
  const logAction = async (action, details) => {
    const log = `${new Date().toISOString()} - ${action}:\n${details}\n\n`;
    console.log(log); // Log to console for debugging
    try {
      fs.appendFileSync(logFilePath, log);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  };

  // Function to log navigations
  const logNavigation = async (url) => {
    const details = `Navigated to: ${url}`;
    console.log(details); // Log to console for debugging
    try {
      fs.appendFileSync(logFilePath, `${new Date().toISOString()} - Navigation:\n${details}\n\n`);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  };

  // Function to apply event listeners
  const applyEventListeners = async () => {
    await page.evaluate(() => {
      // Log key presses
      document.addEventListener('keydown', (event) => {
        const details = `Key: ${event.key}, Code: ${event.code}`;
        window.logKeyPress(details);
      });

      // Log text inputs (usernames, passwords, etc.)
      document.addEventListener('input', (event) => {
        if (event.target.tagName === 'INPUT' && (event.target.type === 'text' || event.target.type === 'password')) {
          const details = `Element: ${event.target.tagName}
ID: ${event.target.id}
Type: ${event.target.type}
Value: ${event.target.value}`;
          window.logInput(details);
        }
      });

      // Log form submissions
      document.addEventListener('submit', (event) => {
        const formData = new FormData(event.target);
        let details = `Form Submitted: ${event.target.action}\n`;
        formData.forEach((value, key) => {
          details += `Field: ${key}, Value: ${value}\n`;
        });
        window.logInput(details);
      });

      // Log clicks
      document.addEventListener('click', (event) => {
        const details = `Element: ${event.target.tagName}
ID: ${event.target.id}
Classes: ${event.target.className}
Text: ${event.target.innerText}
Outer HTML: ${event.target.outerHTML}`;
        window.logClick(details);
      });
    });
  };

  // Set up exposed functions
  await page.exposeFunction('logKeyPress', async (details) => {
    console.log('Key press detected:', details); // Debugging statement
    await logAction('KeyPress', details);
  });

  await page.exposeFunction('logInput', async (details) => {
    console.log('Text input detected:', details); // Debugging statement
    await logAction('Input', details);
  });

  await page.exposeFunction('logClick', async (details) => {
    console.log('Click detected:', details); // Debugging statement
    await logAction('Click', details);
  });

  // Apply event listeners to the current page
  await applyEventListeners();

  // Handle navigation
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const url = frame.url();
      console.log(`Navigated to: ${url}`);
      await logNavigation(url); // Log the URL navigation
      // Reapply event listeners after navigation
      await applyEventListeners();
    }
  });



  console.log('Playwright bot started. Open the browser and interact with the page.');

})();
