#!/usr/bin/env node
const fs = require('fs')
const _ = require('lodash')
const cp = require('child_process')
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

  proxList = _.concat(proxList, proxies.map(p => `${p.ipAddress}:${p.port}`))
  if (proxList.length >= 100) {
    return this.emit('end')
  } else {
    process.stdout.write('...')
  }
})

fetchProxy.on('error', function (err) {
  process.stderr.write(err.toString())
  process.stdout.cursorTo(0)
  process.stdout.write('*')
})

fetchProxy.once('end', function () {
  console.log('DONE!')
  const prefsDir = `${process.env.HOME}/.config/spotify`
  const prefsFile = `${prefsDir}/prefs`

  if (!fs.existsSync(prefsFile)) {
    cp.execFileSync('mkdir', ['-p', prefsDir])
    cp.execFileSync('touch', prefsFile)
  }
  const prefs = fs.readFileSync(prefsFile, 'utf8')

  if (prefs.search('network.proxy.mode') >= 0) {
    cp.execFileSync('sed', [
      '-i',
      String.raw`s/^network.proxy.mode.*$/network.proxy.mode=2/g`,
      prefsFile
    ])
  } else {
    fs.appendFileSync(prefsFile, 'network.proxy.mode=2')
  }

  const selectProxy = _.sample(proxList)
  if (prefs.search('network.proxy.addr') >= 0) {
    cp.execFileSync('sed', [
      '-i',
      String.raw`s/^network.proxy.addr.*$/network.proxy.addr="${selectProxy}@http"/g`,
      prefsFile
    ])
  } else {
    fs.appendFileSync(prefsFile, `network.proxy.addr="${selectProxy}@http"`)
  }

  process.stdout.write('Launching spotify...')
  cp.execFile('spotify', function () {
    console.log('Closed Spotify.')
    process.exit()
  })
})
