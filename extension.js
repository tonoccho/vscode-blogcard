// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const nodefetch = import("node-fetch");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-blogcard" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('vscode.contextmenu.createBlogCard', function () {
		const activeEditor = vscode.window.activeTextEditor;
		const doc = activeEditor && activeEditor.document;
		const ref = activeEditor?.selection;
		const url = doc?.getText(ref);
		getContent(url, activeEditor, ref);
		

	});

	context.subscriptions.push(disposable);
}

function getContent(url, activeEditor, ref) {
	const request = require('request');
	const {
        JSDOM
    } = require('jsdom')

	request.get(url, function(err, res, body) {
		// 各要素を取得、ogを優先するが、なければ他を当たる
		const dom = new JSDOM(body);
		const bcUrl = getUrl(dom, url);
		const bcType = getType(dom);
		const bcTitle = getTitle(dom);
		const bcDescription = getDescription(dom);
		const bcSiteName = getSiteName(dom, url);
		const bcImage = getImage(dom);
		var replaceStr = '';
		if(bcImage == null || bcImage =='') {
			replaceStr = "" // type html by yourself
		} else {
			replaceStr = "" // type html by yourself
		}

        activeEditor.edit((edit) => {
		      	edit.replace(ref, replaceStr);
		});
	});
}

function getImage(dom) {
	var image = '';
	image = getHTMLTagContent(dom, 'meta[property="og:image"]', '');
	if(image == '') {
		image = getHTMLTagContent(dom, 'meta[name="og:image"]', '');
	}
    return image;
}

function getSiteName(dom, originalUrl) {
	var siteName = '';
	siteName = getHTMLTagContent(dom, 'meta[property="og:site_name"]', '');
	if(siteName == '') {
		siteName = getHTMLTagContent(dom, 'meta[name="og:site_name"]', new URL(originalUrl).origin);
	}
    return siteName;
}

function getType(dom) {
	var type = '';
	type = getHTMLTagContent(dom, 'meta[property="og:type"]', '');
	if(type == '') {
		type = getHTMLTagContent(dom, 'meta[name="og:type"]', '');
	} 
	return type;
}

function getUrl(dom, originalUrl) {
	var url = '';
	url = getHTMLTagContent(dom, 'meta[property="og:url"]', '');
	if(url == '') {
		url = getHTMLTagContent(dom, 'meta[name="og:url"]', '');
	}
	// なかったら取得元のURLを使用する
	if(url == '') {
	    url = originalUrl;
    }
    return url;
}

function getTitle(dom) {
	var title = '';
	title = getHTMLTagContent(dom, 'meta[property="og:title"]', '');
	if(title == '') {
		title = getHTMLTagContent(dom, 'meta[name="og:title"]', '');
	}   
	if(title == null || title == '') {
		title = dom.window.document.title;
	}
	// ここまでやってだめだったら諦める
    if(title == null || title == '') {
	    title = "UNKNOWN TITLE";
    }
	return title;
}

function getDescription(dom) {
   	var description = '';
	description = getHTMLTagContent(dom, 'meta[property="og:description"]', '');
	if(description == '') {
		description = getHTMLTagContent(dom, 'meta[name="og:description"]', '');
	}
    return description;
}

function getHTMLTagContent(dom, query, defaultValue) {
	var content = '';
		// 間違っているサイト対応
	if(dom.window.document.querySelector(query) != null) {
        content = dom.window.document.querySelector(query).content;
	} else {
		content = defaultValue;
	}
	return content;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
