// Snippet: JWT and password helpers for n8n Code nodes
// Usage: paste the needed functions into a Code node at the start of your webhook workflows.

const crypto = require('crypto');

function base64url(bufOrStr){
  const b = Buffer.isBuffer(bufOrStr) ? bufOrStr : Buffer.from(String(bufOrStr));
  return b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function signJWT(payload, secret, expiresInSec=86400){
  const header = base64url(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const exp = Math.floor(Date.now()/1000) + expiresInSec;
  const body = base64url(JSON.stringify({ ...payload, exp }));
  const sig = base64url(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token, secret){
  try {
    const [h,b,s] = token.split('.');
    const expected = base64url(crypto.createHmac('sha256', secret).update(`${h}.${b}`).digest());
    if (expected !== s) return null;
    const payload = JSON.parse(Buffer.from(b.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString());
    if (payload.exp && Math.floor(Date.now()/1000) > payload.exp) return null;
    return payload;
  } catch(e){ return null; }
}

function hashPassword(password){
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password, salt, hash){
  return crypto.scryptSync(password, salt, 64).toString('hex') === hash;
}

module.exports = { signJWT, verifyJWT, hashPassword, verifyPassword };
