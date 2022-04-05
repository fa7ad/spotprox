#!/usr/bin/env node
import $ from 'shelljs'
import open from 'open'
import { join } from 'path'
import { existsSync } from 'fs'
import { sample } from 'lodash-es'
import ProxyLists from 'proxy-lists'
import { readFile, appendFile } from 'fs/promises'

/**
 * Get a list of proxies from proxy-lists
 * @returns {Promise<string[]>} proxies
 */
const getProxies = () => new Promise((resolve, reject) => {
  const proxyOptions = {
    countries: ['us'],
    protocols: ['http'],
    ipTypes: ['ipv4'],
    sourcesBlackList: ['bitproxies', 'kingproxies']
  }

  const proxList = []

  ProxyLists.getProxies(proxyOptions)
    .on('data', function (proxies) {
      if (proxList.length > 50) return this.emit('end')
      proxies.forEach(proxy => {
        if (proxy.port !== 3128) {
          proxList.push(`${proxy.ipAddress}:${proxy.port}`)
        }
      })
    })
    .on('error', function () {
      if (proxList.length > 50) this.emit('end')
    })
    .on('end', function () {
      if (proxList.length > 10) return resolve(proxList)
      reject(new Error("Couldn't get proxies"))
    })
})

const getSpotifyConfigPath = () => {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA, 'spotify')
  } else if (process.platform === 'darwin') {
    return join(
      process.env.HOME,
      'Library',
      'Application Support',
      'Spotify'
    )
  } else {
    return join(process.env.HOME, '.config', 'spotify')
  }
}

async function main () {
  console.log('Downloading proxy list...')
  const proxies = await getProxies()
  console.log('Downloaded proxy list')

  const configDir = getSpotifyConfigPath()
  const configFile = join(configDir, 'prefs')

  if (!existsSync(configDir)) {
    $.mkdir('-p', configDir)
    $.touch(configFile)
  }

  const prefs = await readFile(configFile, 'utf8')

  if (prefs.search('network.proxy.mode') > -1) {
    $.sed('-i', /^network.proxy.mode.*$/, 'network.proxy.mode=2', configFile)
  } else {
    await appendFile(configFile, 'network.proxy.mode=2')
  }

  const selectProxy = sample(proxies)

  if (prefs.search('network.proxy.addr') >= 0) {
    $.sed(
      '-i',
      /^network.proxy.addr.*$/,
      `network.proxy.addr="${selectProxy}@http"`,
      configFile
    )
  } else {
    await appendFile(configFile, `network.proxy.addr="${selectProxy}@http"`)
  }

  console.log('Launching spotify...')

  return open.openApp('spotify')
}

main().then(process.exit)
