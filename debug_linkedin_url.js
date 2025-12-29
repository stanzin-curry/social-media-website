import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible .env locations
const possibleEnvPaths = [
  join(__dirname, 'backend', '.env'),
  join(__dirname, '.env'),
  join(process.cwd(), 'backend', '.env'),
  join(process.cwd(), '.env')
];

let envPath = null;
for (const path of possibleEnvPaths) {
  if (existsSync(path)) {
    envPath = path;
    break;
  }
}

if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`📁 Loaded .env from: ${envPath}\n`);
} else {
  console.log('⚠️  No .env file found. Using environment variables or defaults.\n');
  dotenv.config(); // Try to load from process.env
}

// Replicate the getLinkedInAuthUrl function logic
function getLinkedInAuthUrl(userId) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    throw new Error('LINKEDIN_CLIENT_ID is not set in environment variables');
  }
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:4000/api/auth/linkedin/callback';
  // OpenID Connect scopes
  const scope = 'openid profile email w_member_social';
  // Encode userId in state parameter
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scope)}`;
}

// Generate URL with dummy userId for testing
const dummyUserId = '507f1f77bcf86cd799439011'; // Example MongoDB ObjectId format
const generatedUrl = getLinkedInAuthUrl(dummyUserId);

console.log('='.repeat(80));
console.log('LINKEDIN OAUTH URL DEBUG');
console.log('='.repeat(80));
console.log('\n📋 Environment Variables:');
console.log(`   LINKEDIN_CLIENT_ID: ${process.env.LINKEDIN_CLIENT_ID || 'NOT SET'}`);
console.log(`   LINKEDIN_REDIRECT_URI: ${process.env.LINKEDIN_REDIRECT_URI || 'NOT SET (using default)'}`);
console.log('\n🔗 Generated URL:');
console.log(generatedUrl);
console.log('\n' + '='.repeat(80));
console.log('URL ANALYSIS:');
console.log('='.repeat(80));

// Parse and analyze the URL
try {
  const url = new URL(generatedUrl);
  const params = new URLSearchParams(url.search);
  
  console.log('\n✅ Base URL:', url.origin + url.pathname);
  console.log('\n📝 Query Parameters:');
  console.log(`   response_type: ${params.get('response_type')}`);
  console.log(`   client_id: ${params.get('client_id')}`);
  console.log(`   redirect_uri: ${params.get('redirect_uri')}`);
  console.log(`   scope: ${params.get('scope')}`);
  console.log(`   state: ${params.get('state')?.substring(0, 50)}...`);
  
  console.log('\n🔍 Detailed Analysis:');
  
  // Check base URL
  const baseUrl = url.origin + url.pathname;
  if (baseUrl === 'https://www.linkedin.com/oauth/v2/authorization') {
    console.log('   ✅ Base URL is correct');
  } else {
    console.log(`   ❌ Base URL is incorrect: ${baseUrl}`);
  }
  
  // Check redirect_uri encoding
  const redirectUri = params.get('redirect_uri');
  const decodedRedirectUri = decodeURIComponent(redirectUri);
  console.log(`   ✅ Redirect URI (decoded): ${decodedRedirectUri}`);
  if (redirectUri === encodeURIComponent(decodedRedirectUri)) {
    console.log('   ✅ Redirect URI is properly URL-encoded');
  } else {
    console.log('   ⚠️  Redirect URI encoding may have issues');
  }
  
  // Check scope
  const scope = params.get('scope');
  const decodedScope = decodeURIComponent(scope);
  console.log(`   ✅ Scope (decoded): ${decodedScope}`);
  const scopeParts = decodedScope.split(' ');
  console.log(`   ✅ Scope parts: [${scopeParts.join(', ')}]`);
  
  const requiredScopes = ['openid', 'profile', 'email', 'w_member_social'];
  const missingScopes = requiredScopes.filter(s => !scopeParts.includes(s));
  if (missingScopes.length === 0) {
    console.log('   ✅ All required scopes are present');
  } else {
    console.log(`   ❌ Missing scopes: ${missingScopes.join(', ')}`);
  }
  
  // Check if scope is space-separated (not comma-separated)
  if (decodedScope.includes(',')) {
    console.log('   ⚠️  WARNING: Scope contains commas. LinkedIn expects space-separated scopes.');
  } else {
    console.log('   ✅ Scope is space-separated (correct)');
  }
  
  // Check state parameter
  const state = params.get('state');
  try {
    const decodedState = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
    console.log(`   ✅ State parameter is valid JSON: ${JSON.stringify(decodedState)}`);
  } catch (e) {
    console.log(`   ❌ State parameter decoding failed: ${e.message}`);
  }
  
} catch (error) {
  console.error('\n❌ Error parsing URL:', error.message);
}

console.log('\n' + '='.repeat(80));
console.log('FULL URL (copy this to test in browser):');
console.log('='.repeat(80));
console.log(generatedUrl);
console.log('='.repeat(80));

