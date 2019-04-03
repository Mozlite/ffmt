/**
 * 格式化文件夹下面的所有扩展名的文件编码格式为UTF-8。
 * -dir path:指定目录路径，未指定为当前目录；
 * -ex extensions:扩展名，多个用","隔开，默认为：cs,js,scss,cshtml,html,json,ts;
 * -i或-ignores dirs:忽略文件夹名称，多个用","隔开，默认为：node_modules,bin,obj,.vscode,.vs,.git,.svn;
 */
const fs = require('fs');
const jschardet = require('jschardet');
const path = require('path');
const encoding = require('encoding');

var arguments = process.argv.splice(2);
var args = {};
for (var i = 0; i < arguments.length; i++) {
    var key = arguments[i];
    if (key.startsWith('--')) {
        key = key.substr(2);
        args[key] = true;
    } else if (key.startsWith('-')) {
        key = key.substr(1);
        args[key] = arguments.length > i + 1 ? arguments[i + 1] : true;
        i++;
    }
}

var dir = __dirname;
if (args.dir) {
    if (/^[a-z]:\\/ig.test(args.dir))
        dir = args.dir;
    else
        dir = path.join(dir, args.dir);
}
console.log('路径: ' + dir);

var extensions = (args.ex || 'cs,js,scss,cshtml,html,json,ts').split(',').map(x => x.startsWith('.') ? x : '.' + x);
console.log('扩展名: ' + extensions.join(','))

var ignores = (args.i || args.ignores || 'node_modules,bin,obj,.vscode,.vs,.git,.svn').split(',');
console.log('忽略文件夹: ' + ignores.join(','));

function explorer(dir) {
    fs.readdir(dir, function (err, files) {
        //err 为错误 , files 文件名列表包含文件夹与文件
        if (err) {
            console.log('error:\n' + err);
            return;
        }
        files.forEach(function (file) {
            var filename = dir + '/' + file;
            fs.stat(filename, function (err, stat) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (stat.isDirectory()) {
                    // 如果是文件夹遍历
                    if (ignores.indexOf(file) == -1)
                        explorer(filename);
                } else {
                    if (extensions.indexOf(path.extname(file)) == -1)
                        return;
                    // 读出所有的文件
                    var buffer = fs.readFileSync(filename);
                    var info = jschardet.detect(buffer);
                    if (info.encoding == 'GB2312' || info.encoding == 'ascii') {
                        console.log('编码方式:' + info.encoding + "; " + info.confidence);
                        console.log('文件名:' + filename);
                        let result = '\uFEFF' + encoding.convert(buffer, "UTF-8", info.encoding);
                        fs.writeFileSync(filename, result, "utf8");
                    }
                }
            });
        });
    });
}

explorer(dir);