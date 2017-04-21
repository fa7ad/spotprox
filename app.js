#!/usr/bin/env node
const url = require('url')
const _ = require('lodash')
const Express = require('express')
const cp = require('child_process')
const proxyFetcher = require('proxy-lists')

const env = {
  port: process.env.PORT || 4567,
  host: process.env.HOST || '0.0.0.0'
}
const proxyOptions = {
  countries: ['us', 'ca'],
  protocols: ['http', 'https'],
  ipTypes: ['ipv4'],
  sourcesBlackList: ['bitproxies', 'kingproxies', 'blackhatworld']
}
let proxList = []

const app = new Express()
const fetchProxy = proxyFetcher.getProxies(proxyOptions)

app.get('/', (req, res) => {
  res.send('Make a GET request to /proxy.pac')
})

app.get('/proxy.pac', (req, res) => {
  res.type('application/x-ns-proxy-autoconfig')
  res.send(String.raw`
    function FindProxyForURL(url, host) {
      return "PROXY ${_.sample(proxList)}; DIRECT";
    }
  `)
})

app.listen(env.port, env.host, function() {
  const listenAddr = this.address()
  const serverURL = url.format({
    protocol: 'http',
    port: listenAddr.port,
    hostname: listenAddr.address
  })

  console.log(`SpotProx running on %s.`, serverURL)
  console.log(`Set the proxy to ${serverURL}/proxy.pac`)

  fetchProxy.on('data', function(proxies) {
     proxList = _.concat(proxList, proxies.map(p => `${p.ipAddress}:${p.port}`))
  })

  cp.execFile('spotify', function() {})
})
