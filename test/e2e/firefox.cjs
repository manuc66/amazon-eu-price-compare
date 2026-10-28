// End-to-end check of the Firefox build in a real Firefox, driven through
// Marionette (Firefox's built-in automation protocol: no geckodriver needed).
//
// It verifies that the add-on installs, that Firefox itself resolves the
// content script patterns of the manifest for a real amazon.de url, and that
// the fixture page is actually served and loaded.
//
// Usage:
//   FIREFOX_BIN=/path/to/firefox npm run test:e2e:firefox
//
// Limitation: Firefox refuses to navigate to moz-extension:// urls through
// Marionette, so the popup UI itself cannot be driven from here. Use
// `npm run start:firefox` to check the UI by hand.
const { createServer } = require('node:http')
const { spawn } = require('node:child_process')
const net = require('node:net')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const FIREFOX = process.env.FIREFOX_BIN || 'firefox'
const EXTENSION_DIR = path.resolve(process.env.EXTENSION_DIR || path.join(__dirname, '..', '..', 'dist', 'firefox'))
const MARIONETTE_PORT = Number(process.env.MARIONETTE_PORT || 2829)
const ADDON_ID = 'IronCore864@amazon-eu-price-compare'

const FIXTURE = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>Fixture product</title></head>
<body>
  <span id="productTitle">Fixture product</span>
  <div class="a-price aok-align-center">
    <span class="a-offscreen">1.234,56 €</span>
    <span aria-hidden="true">
      <span class="a-price-whole">1.234<span class="a-price-decimal">,</span></span>
      <span class="a-price-fraction">56</span>
    </span>
  </div>
  <div id="SalesRank"><span class="value">#1,234 in Elektronik (<a href="#">Top 100</a>)</span></div>
</body></html>`

function connectWithRetry(port, timeoutMs = 25000) {
	const deadline = Date.now() + timeoutMs
	return new Promise((resolve, reject) => {
		const attempt = () => {
			const socket = net.createConnection({ host: '127.0.0.1', port })
			socket.once('connect', () => {
				socket.on('error', () => {})
				resolve(socket)
			})
			socket.once('error', () => {
				socket.destroy()
				if (Date.now() > deadline) reject(new Error(`marionette did not listen on port ${port}`))
				else setTimeout(attempt, 300)
			})
		}
		attempt()
	})
}

function marionetteClient(socket) {
	let buffer = Buffer.alloc(0)
	const pending = new Map()
	let nextId = 1

	const ready = new Promise((resolve) => {
		socket.on('data', (chunk) => {
			buffer = Buffer.concat([buffer, chunk])
			for (;;) {
				const separator = buffer.indexOf(':')
				if (separator === -1) return
				const length = Number(buffer.subarray(0, separator).toString())
				if (buffer.length < separator + 1 + length) return
				const payload = JSON.parse(buffer.subarray(separator + 1, separator + 1 + length).toString())
				buffer = buffer.subarray(separator + 1 + length)
				if (Array.isArray(payload)) {
					const [, id, error, result] = payload
					const entry = pending.get(id)
					if (!entry) continue
					pending.delete(id)
					error ? entry.reject(new Error(JSON.stringify(error))) : entry.resolve(result)
				} else {
					resolve(payload)
				}
			}
		})
	})

	const send = (name, params = {}) => {
		const id = nextId++
		const body = JSON.stringify([0, id, name, params])
		socket.write(`${Buffer.byteLength(body)}:${body}`)
		return new Promise((resolve, reject) => {
			pending.set(id, { resolve, reject })
			setTimeout(() => {
				if (pending.delete(id)) reject(new Error(`${name} timed out`))
			}, 20000)
		})
	}

	return { ready, send }
}

async function main() {
	const server = createServer((request, response) => {
		response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
		response.end(FIXTURE)
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	const port = server.address().port

	const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'amazon-eu-e2e-'))
	fs.writeFileSync(path.join(profile, 'user.js'), [
		`user_pref("marionette.port", ${MARIONETTE_PORT});`,
		// serve the fixture locally under an amazon.de url
		'user_pref("network.dns.localDomains", "www.amazon.de");',
		// the amazon domains are in the HSTS preload list, which would force https
		'user_pref("network.stricttransportsecurity.preloadlist", false);',
		'user_pref("dom.security.https_first", false);',
		'user_pref("dom.security.https_first_pbm", false);',
		'user_pref("dom.security.https_only_mode", false);',
		'user_pref("app.update.auto", false);',
		'user_pref("browser.shell.checkDefaultBrowser", false);',
		'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
		'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
		'user_pref("extensions.autoDisableScopes", 0);'
	].join('\n'))

	const firefox = spawn(FIREFOX, ['-headless', '-marionette', '-no-remote', '-profile', profile, 'about:blank'], {
		stdio: ['ignore', 'pipe', 'pipe']
	})
	let browserLog = ''
	firefox.stdout.on('data', (chunk) => { browserLog += chunk })
	firefox.stderr.on('data', (chunk) => { browserLog += chunk })

	let socket
	const failures = []
	const check = (label, ok, detail) => {
		console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail === undefined ? '' : ' -> ' + detail}`)
		if (!ok) failures.push(label)
	}

	try {
		socket = await connectWithRetry(MARIONETTE_PORT)
		const client = marionetteClient(socket)
		await client.ready
		await client.send('WebDriver:NewSession', { capabilities: { alwaysMatch: {} } })

		const installed = await client.send('Addon:Install', { path: EXTENSION_DIR, temporary: true })
		check('temporary add-on installed', installed.value === ADDON_ID, installed.value)

		const url = `http://www.amazon.de:${port}/dp/B08N5WRWNW`
		await client.send('WebDriver:Navigate', { url })
		const title = await client.send('WebDriver:GetTitle')
		check('fixture page served and loaded', title.value === 'Fixture product', title.value)

		const policy = await client.send('WebDriver:ExecuteScript', {
			script: `
				var policy = WebExtensionPolicy.getByID(${JSON.stringify(ADDON_ID)});
				if (!policy) { return null; }
				var script = policy.contentScripts[0];
				var uri = Services.io.newURI(${JSON.stringify(url)});
				return {
					patterns: script.matches.patterns.map(function (match) { return match.pattern; }),
					injectsOnFixture: script.matchesURI(uri),
					runAt: script.runAt,
					files: script.jsPaths,
					permissions: Array.from(policy.permissions || [])
				};
			`,
			args: [],
			scriptTimeout: 5000,
			sandbox: 'system'
		}).catch((error) => ({ value: null, error }))

		const info = policy.value
		check('Firefox parsed the content script patterns', !!info && info.patterns.length === 11, info && info.patterns.length)
		check('content script injects on the amazon.de fixture', !!info && info.injectsOnFixture === true)
		check('content script runs at document_start', !!info && info.runAt === 'document_start', info && info.runAt)
		check('content script file is content.js', !!info && JSON.stringify(info.files).includes('content.js'))
		check(
			'Firefox granted storage and activeTab',
			!!info && info.permissions.includes('storage') && info.permissions.includes('activeTab'),
			info && info.permissions.join(',')
		)

		if (info) console.log('patterns:', info.patterns.join(' '))
	} finally {
		if (socket) socket.end()
		firefox.kill('SIGKILL')
		server.close()
	}

	if (failures.length > 0) {
		console.log('--- firefox log ---')
		console.log(browserLog.slice(-1500))
		console.log(`E2E FAILED: ${failures.join(', ')}`)
		process.exitCode = 1
	} else {
		console.log('E2E OK')
	}
}

main().catch((error) => {
	console.error('E2E ERROR:', error.message)
	process.exit(1)
})
