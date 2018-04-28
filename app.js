#!/usr/bin/env node
const fs = require('fs')
const opn = require('opn')
const path = require('path')
const $ = require('shelljs')
const _sample = require('lodash/sample')
const proxyFetcher = require('proxy-lists')

const proxyOptions = {
  countries: ['us'],
  protocols: ['http'],
  ipTypes: ['ipv4'],
  sourcesBlackList: ['bitproxies', 'kingproxies']
}
let proxList = []

const fetchProxy = proxyFetcher.getProxies(proxyOptions)

console.log('Downloading proxy list...')
fetchProxy.on('data', function (proxies) {
  if (proxList.length > 50) return this.emit('end')
  proxList.push(...proxies.map(p => `${p.ipAddress}:${p.port}`))
  process.stdout.write('*')
})

fetchProxy.on('error', function () {
  process.stdout.write('x')
  if (proxList.length > 50) this.emit('end')
})

fetchProxy.once('end', function () {
  console.log('DONE!')
  let config
  if (process.platform === 'win32') {
    config = path.join(process.env.APPDATA, 'spotify')
  } else if (process.platform === 'darwin') {
    config = path.join(
      process.env.USER,
      'Library',
      'Application Support',
      'Spotify'
    )
  } else {
    config = path.join(process.env.HOME, '.config', 'spotify')
  }
  const prefsFile = path.join(config, 'prefs')

  if (!fs.existsSync(prefsFile)) {
    $.mkdir('-p', config)
    $.touch(prefsFile)
  }
  const prefs = fs.readFileSync(prefsFile, 'utf8')

  if (prefs.search('network.proxy.mode') > -1) {
    $.sed('-i', /^network.proxy.mode.*$/, 'network.proxy.mode=2', prefsFile)
  } else {
    fs.appendFileSync(prefsFile, 'network.proxy.mode=2')
  }

  const selectProxy = _sample(proxList.filter(x => !/3128/.test(x)))
  if (prefs.search('network.proxy.addr') >= 0) {
    $.sed(
      '-i',
      /^network.proxy.addr.*$/,
      `network.proxy.addr="${selectProxy}@http"`,
      prefsFile
    )
  } else {
    fs.appendFileSync(prefsFile, `network.proxy.addr="${selectProxy}@http"`)
  }

  process.stdout.write('Launching spotify...')

  opn('', {
    app: 'spotify'
  }).then(process.exit)
})
