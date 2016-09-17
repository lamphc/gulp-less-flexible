const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const config = {
	hostname: '127.0.0.1',
	port: 8000
};

const server = http.createServer((req, res) => {
	var file = __dirname;
	
	if(req.url.indexOf('/')===0) {
		file+='\\src\\app.html';
		console.log(file)
	}

	fs.readFile(file, (err, data) => {
		if (err) {
			res.writeHeader(404, {
				'content-type': 'text/html;charset="utf-8"'
			});
			res.write('<h1>404错误</h1><p>你要找的页面不存在</p>');
			res.end();
		} else {
			res.writeHeader(200, {
				'content-type': 'text/html;charset="utf-8"'
			});
			res.write(data); //将index.html显示在客户端
			res.end();

		}
	});
});

server.listen(config.port, config.hostname, () => {
	console.log(`Server running at http://${config.hostname}:${config.port}/`);
});