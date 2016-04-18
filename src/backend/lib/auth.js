"use strict"

const crypto = require("crypto")
const scrypt = require("scrypt")
const params = scrypt.paramsSync(0.2)

const MAX_UINT32 = 0xFFFFFFFF

function numberToBuffer64(n) {
  const x = new Buffer(8)

  x.writeUInt32BE(n / MAX_UINT32 | 0, 0)
  x.writeUInt32BE(n % MAX_UINT32, 4)
  return x
}

function hotp(k, c, digits) {
  if (digits == null) {
    digits = 6 // eslint-disable-line
  }

  const hs = crypto.createHmac("sha1", k)
    .update(numberToBuffer64(c))
    .digest()

  const offset = hs[19] & 0xF
  const p = hs.slice(offset, offset + 4)
  const sNum = p.readUInt32BE() & 0x7FFFFFFF

  return sNum % Math.pow(10, digits)
}

function totp(k, digits, x, drift) {
  drift = drift || 0 // eslint-disable-line
  const t = ((Date.now() / 1000 | 0) + (drift * x)) / x | 0

  return hotp(k, t, digits)
}

function TOTP(key, digits, step) {
  step = step || 30 // eslint-disable-line
  digits = digits || 6 // eslint-disable-line

  this.generate = totp.bind(null, key, digits, step, 0)
  this.drift = totp.bind(null, key, digits, step)

  this.within = function within(challenge, d) {
    d = Math.abs(d) // eslint-disable-line

    const t = []

    for (let i = -d; i <= d; ++i) {
      t.push(this.drift(d))
    }

    return t.indexOf(challenge) > -1
  }
}

function validateKey(key, secret) {
  return scrypt.verifyKdf(key, secret)
}

function generateKey(secret) {
  return scrypt.kdf(secret, params)
}

module.exports = { validateKey, generateKey }
