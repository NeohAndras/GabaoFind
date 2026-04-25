// list_establishments.js - Export all listings to RTF file with accent support
const fs = require('fs');
const path = require('path');

function generateRTF(listings) {
  let rtf = `{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang1036{\\fonttbl{\\f0\\fnil\\fcharset0 Times New Roman;}}
{\\colortbl ;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\f0\\fs24
`;

  listings.forEach((listing) => {
    rtf += `${listing.name}\\par
`;
  });

  rtf += `}`;
  return rtf;
}

function listEstablishments() {
  const dataPath = path.join(__dirname, 'data.json');
  const outputPath = path.join(__dirname, 'establishments.rtf');

  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const rtfContent = generateRTF(data.listings);
    fs.writeFileSync(outputPath, rtfContent, 'utf8');
    console.log(`Exported ${data.listings.length} establishments to establishments.rtf`);
  } catch (error) {
    console.error('Error generating RTF:', error.message);
  }
}

// Run the script
listEstablishments();