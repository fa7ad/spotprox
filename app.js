#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const $ = require('shelljs')
const cp = require('child_process')
const _sample = require('lodash/sample')
const proxyFetcher = require('proxy-lists')

const proxyOptions = {
  countries: ['us', 'ca'],
  protocols: ['http', 'https'],
  ipTypes: ['ipv4'],
  sourcesBlackList: ['bitproxies', 'kingproxies', 'blackhatworld']
}
let proxList = []

const fetchProxy = proxyFetcher.getProxies(proxyOptions)

console.log('Downloading proxy list...')
fetchProxy.on('data', function (proxies) {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)

  proxList = proxList.concat(proxies.map(p => `${p.ipAddress}:${p.port}`))
  process.stdout.write('...')
})

fetchProxy.on('error', function (err) {
  process.stderr.write(err.toString())
  process.stdout.cursorTo(0)
  process.stdout.write('*')
})

fetchProxy.once('end', function () {
  console.log('DONE!')
  const config = path.join(process.env.HOME, '.config', 'spotify')
  const prefsFile = path.join(config, 'prefs')

  if (!fs.existsSync(prefsFile)) {
    $.mkdir('-p', config)
    $.touch(prefsFile)
  }
  const prefs = fs.readFileSync(prefsFile, 'utf8')

  if (prefs.search('network.proxy.mode') >= 0) {
    $.sed('-i', /^network.proxy.mode.*$/, 'network.proxy.mode=2', prefsFile)
  } else {
    fs.appendFileSync(prefsFile, 'network.proxy.mode=2')
  }

  const selectProxy = _sample(proxList)
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
  cp.execFile('spotify', function () {
    console.log('Closed Spotify.')
    process.exit()
  })
})
