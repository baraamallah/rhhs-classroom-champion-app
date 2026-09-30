const os = require('os');

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        // Classify the interface
        const isWifi = /wi-?fi|wlan|wireless/i.test(name);
        const isEthernet = /ethernet|eth|lan/i.test(name);
        const isVirtual = /radmin|tailscale|hamachi|vEthernet|vmware|virtual/i.test(name) || net.address.startsWith('169.254.');
        const isPrivateSubnet = net.address.startsWith('192.168.') || net.address.startsWith('10.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(net.address);

        let priority = 10;
        if (isWifi && isPrivateSubnet) priority = 1;
        else if (isEthernet && isPrivateSubnet) priority = 2;
        else if (isPrivateSubnet && !isVirtual) priority = 3;
        else if (isVirtual) priority = 20;

        addresses.push({
          name,
          address: net.address,
          priority,
          isWifi,
          isVirtual
        });
      }
    }
  }

  addresses.sort((a, b) => a.priority - b.priority);
  return addresses;
}

function showQR() {
  const port = process.env.PORT || 3000;
  const addresses = getNetworkAddresses();

  const primary = addresses.length > 0 ? addresses[0] : null;
  const primaryUrl = primary ? `http://${primary.address}:${port}` : `http://localhost:${port}`;

  console.log('\n' + '='.repeat(50));
  console.log('📱  SCAN QR CODE TO OPEN ON YOUR PHONE');
  console.log('='.repeat(50));

  try {
    const qrcode = require('qrcode-terminal');
    qrcode.generate(primaryUrl, { small: true });
  } catch (err) {
    console.log('Could not load qrcode-terminal:', err.message);
  }

  console.log('🌐 Local URL:   ' + `http://localhost:${port}`);
  if (primary) {
    console.log(`📲 Network URL: ${primaryUrl} (${primary.name})`);
  }

  const secondary = addresses.slice(1);
  if (secondary.length > 0) {
    console.log('\nOther available network interfaces:');
    for (const item of secondary) {
      console.log(`  - http://${item.address}:${port} (${item.name})`);
    }
  }

  console.log('\n💡 Tip: Ensure your phone and PC are connected to the SAME Wi-Fi network.');
  console.log('='.repeat(50) + '\n');
}

showQR();
