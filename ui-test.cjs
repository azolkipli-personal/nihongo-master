const { chromium } = require('playwright');

async function testNihongoMaster() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  const failedRequests = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push('PAGE ERROR: ' + err.message);
  });
  
  page.on('requestfailed', request => {
    failedRequests.push(request.url() + ' - ' + request.failure().errorText);
  });
  
  console.log('=== Nihongo Master Debug Test ===\n');
  
  try {
    // Test via Tailscale URL
    const testUrl = 'http://100.84.210.22:3001';
    console.log('Testing: ' + testUrl);
    
    const response = await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('✓ Response status: ' + response.status());
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Check what's rendered
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return 'ROOT NOT FOUND';
      if (!root.innerHTML || root.innerHTML.trim() === '') return 'ROOT IS EMPTY';
      return 'ROOT HAS CONTENT (' + root.innerHTML.length + ' chars)';
    });
    console.log('✓ ' + rootContent);
    
    // Check body background color (grey screen detection)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('✓ Body background: ' + bgColor);
    
    // Check for any loading states
    const loadingText = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      for (let el of all) {
        if (el.textContent && el.textContent.toLowerCase().includes('loading')) {
          return el.textContent.trim().substring(0, 50);
        }
      }
      return 'No loading text found';
    });
    console.log('✓ Loading state: ' + loadingText);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/nihongo_master_debug.png', fullPage: true });
    console.log('✓ Screenshot: /tmp/nihongo_master_debug.png');
    
    // Report issues
    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach(function(e) { console.log('  - ' + e); });
    } else {
      console.log('\n✓ No errors');
    }
    
    if (failedRequests.length > 0) {
      console.log('\n⚠️  Failed requests:');
      failedRequests.forEach(function(r) { console.log('  - ' + r); });
    }
    
    console.log('\n✅ Debug complete');
    
  } catch (err) {
    console.error('✗ Failed: ' + err.message);
  } finally {
    await browser.close();
  }
}

testNihongoMaster();
