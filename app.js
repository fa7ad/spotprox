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
  process.stdout.write('...')
  proxList = _.concat(proxList, proxies.map(p => `${p.ipAddress}:${p.port}`))
  if (proxList.length >= 100) {
    this.emit('end')
  }
})

fetchProxy.once('end', function () {
  process.stdout.write('DONE!')
  const prefsFile = `${process.env.HOME}/.config/spotify/prefs`
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

  const selectProxy = _.sample(proxList);
  if (prefs.search('network.proxy.addr') >= 0) {
    cp.execFileSync('sed', [
      '-i',
      String.raw`s/^network.proxy.addr.*$/network.proxy.addr=${selectProxy}@http/g`,
      prefsFile
    ])
  } else {
    fs.appendFileSync(prefsFile, `network.proxy.addr=${selectedProxy}@http`)
  }

  console.log('Launching spotify...')
  cp.execFileSync('spotify')
})
