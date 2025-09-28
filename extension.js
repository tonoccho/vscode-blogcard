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

	// URLからコンテンツをダウンロードしてOGPタグを使ってブログカードを生成する
	const createBlogCardFromURL = vscode.commands.registerCommand('vscode.contextmenu.createBlogCardFromURL', function () {
		const activeEditor = vscode.window.activeTextEditor;
		const doc = activeEditor && activeEditor.document;
		const ref = activeEditor?.selection;
		const url = doc?.getText(ref);
		try {
			if (URL.canParse(url)) {
				const origin = new URL(url).origin; // 将来的にoriginによって取り分ける可能性あるから書いておくだけ
				if (origin == "https://www.amazon.co.jp") {
					vscode.window.showErrorMessage('Origin [' + origin + '] はこの機能では対応していません。');
				} else {
					getContent(url, activeEditor, ref);
					vscode.window.showInformationMessage('[' + url + '] のブログカードを生成しました。');
				}
			} else {
				vscode.window.showErrorMessage('[' + url + '] はURLではありません');

			}
		} catch (error) {
			console.log(error);
		}
	});
	context.subscriptions.push(createBlogCardFromURL);

	// HTMLのソースから頑張ってブログカードを生成する
	const createBlogCardFromHTMLSource = vscode.commands.registerCommand('vscode.contextmenu.createBlogCardFromHTMLSource', function () {
		const activeEditor = vscode.window.activeTextEditor;
		const doc = activeEditor && activeEditor.document;
		const ref = activeEditor?.selection;
		const data = doc?.getText(ref);

		try {
			getContentFromText(data, activeEditor, ref);

		} catch (error) {
			console.log(error);
		}
	});
	context.subscriptions.push(createBlogCardFromHTMLSource);

	//Amazon 商品ページHTMLのソースから頑張ってブログカードを生成する
	const createBlogCardFromAmazonHTMLSource = vscode.commands.registerCommand('vscode.contextmenu.createBlogCardFromAmazonHTMLSource', function () {
		const activeEditor = vscode.window.activeTextEditor;
		const doc = activeEditor && activeEditor.document;
		const ref = activeEditor?.selection;
		const data = doc?.getText(ref);
		try {
			getContentFromAmazonProductPageSource(data, activeEditor, ref);

		} catch (error) {
			console.log(error);
		}
	});
	context.subscriptions.push(createBlogCardFromAmazonHTMLSource);
}

async function getContentFromAmazonProductPageSource(body, activeEditor, ref) {
	// 各要素を取得、ogを優先するが、なければ他を当たる
	const url = await vscode.window.showInputBox({
		prompt: 'ブログカードを生成するURLを入力してください'
	});
	if (!URL.canParse(url)) {
		vscode.window.showErrorMessage('[' + url + '] はURLではありません');
	} else {
		const origin = new URL(url).origin;
		if (origin != "https://www.amazon.co.jp") {
			vscode.window.showErrorMessage('Origin [' + origin + '] はこの機能では対応していません。');
		} else {
			const {
				JSDOM
			} = require('jsdom')
			const dom = new JSDOM(body);
			const bcUrl = url;
			const bcType = 'Asvertisement';
			const bcTitle = '[PR] ' + getHTMLTagContent(dom, 'meta[name="title"]', '');
			const bcDescription = getHTMLTagContent(dom, 'meta[name="description"]', '');;
			const bcSiteName = origin;
			const bcImage = dom.window.document.querySelector("img[id=landingImage]").getAttribute('src');
			var replaceStr = '';
			const config = vscode.workspace.getConfiguration('blogcard');

			if (bcImage == null || bcImage == '') {
				replaceStr = config.get('templateWithoutImage');
			} else {
				replaceStr = config.get('templateWithImage');
			}

			replaceStr = replaceStr.replaceAll("${bcUrl}", bcUrl);
			replaceStr = replaceStr.replaceAll("${bcType}", bcType);
			replaceStr = replaceStr.replaceAll("${bcTitle}", bcTitle);
			replaceStr = replaceStr.replaceAll("${bcDescription}", bcDescription);
			replaceStr = replaceStr.replaceAll("${bcSiteName}", bcSiteName);
			replaceStr = replaceStr.replaceAll("${bcImage}", bcImage);

			activeEditor.edit((edit) => {
				edit.replace(ref, replaceStr);
			});
		}
	}
}

async function getContentFromText(body, activeEditor, ref) {
	// 各要素を取得、ogを優先するが、なければ他を当たる
	const url = await vscode.window.showInputBox({
		prompt: 'ブログカードを生成するURLを入力してください'
	});
	if (!URL.canParse(url)) {
		vscode.window.showErrorMessage('[' + url + '] はURLではありません');
	} else {
		const origin = new URL(url).origin;
		if (origin == "https://www.amazon.co.jp") {
			vscode.window.showErrorMessage('Origin [' + origin + '] はこの機能では対応していません。');
		} else {
			const {
				JSDOM
			} = require('jsdom')
			const dom = new JSDOM(body);
			const bcUrl = url;
			const bcType = getType(dom);
			const bcTitle = getTitle(dom);
			const bcDescription = getDescription(dom);
			const bcSiteName = getSiteName(dom, '');
			const bcImage = getImage(dom);
			var replaceStr = '';
			const config = vscode.workspace.getConfiguration('blogcard');

			if (bcImage == null || bcImage == '') {
				replaceStr = config.get('templateWithoutImage');
			} else {
				replaceStr = config.get('templateWithImage');
			}

			replaceStr = replaceStr.replaceAll("${bcUrl}", bcUrl);
			replaceStr = replaceStr.replaceAll("${bcType}", bcType);
			replaceStr = replaceStr.replaceAll("${bcTitle}", bcTitle);
			replaceStr = replaceStr.replaceAll("${bcDescription}", bcDescription);
			replaceStr = replaceStr.replaceAll("${bcSiteName}", bcSiteName);
			replaceStr = replaceStr.replaceAll("${bcImage}", bcImage);

			activeEditor.edit((edit) => {
				edit.replace(ref, replaceStr);
			});
		}
	}
}

function getContent(url, activeEditor, ref) {
	const request = require('request');
	const {
		JSDOM
	} = require('jsdom')

	request.get(url, function (err, res, body) {
		// 各要素を取得、ogを優先するが、なければ他を当たる
		const dom = new JSDOM(body);
		const bcUrl = getUrl(dom, url);
		const bcType = getType(dom);
		const bcTitle = getTitle(dom);
		const bcDescription = getDescription(dom);
		const bcSiteName = getSiteName(dom, url);
		const bcImage = getImage(dom);
		var replaceStr = '';
		const config = vscode.workspace.getConfiguration('blogcard');

		if (bcImage == null || bcImage == '') {
			replaceStr = config.get('templateWithoutImage');
		} else {
			replaceStr = config.get('templateWithImage');
		}

		replaceStr = replaceStr.replaceAll("${bcUrl}", bcUrl);
		replaceStr = replaceStr.replaceAll("${bcType}", bcType);
		replaceStr = replaceStr.replaceAll("${bcTitle}", bcTitle);
		replaceStr = replaceStr.replaceAll("${bcDescription}", bcDescription);
		replaceStr = replaceStr.replaceAll("${bcSiteName}", bcSiteName);
		replaceStr = replaceStr.replaceAll("${bcImage}", bcImage);

		activeEditor.edit((edit) => {
			edit.replace(ref, replaceStr);
		});
	});
}

function getImage(dom) {
	var image = '';
	image = getHTMLTagContent(dom, 'meta[property="og:image"]', '');
	if (image == '') {
		image = getHTMLTagContent(dom, 'meta[name="og:image"]', '');
	}
	return image;
}

function getSiteName(dom, originalUrl) {
	var siteName = '';
	siteName = getHTMLTagContent(dom, 'meta[property="og:site_name"]', '');
	if (siteName == '') {
		siteName = getHTMLTagContent(dom, 'meta[name="og:site_name"]', '');
	}
	if (siteName == '' && originalUrl != null && URL.canParse(originalUrl)) {
		siteName = new URL(originalUrl).origin;
	}
	return siteName;
}

function getType(dom) {
	var type = '';
	type = getHTMLTagContent(dom, 'meta[property="og:type"]', '');
	if (type == '') {
		type = getHTMLTagContent(dom, 'meta[name="og:type"]', '');
	}
	return type;
}

function getUrl(dom, originalUrl) {
	var url = '';
	url = getHTMLTagContent(dom, 'meta[property="og:url"]', '');
	if (url == '') {
		url = getHTMLTagContent(dom, 'meta[name="og:url"]', '');
	}
	// なかったら取得元のURLを使用する
	if (url == '') {
		url = originalUrl;
	}
	return url;
}

function getTitle(dom) {
	var title = '';
	title = getHTMLTagContent(dom, 'meta[property="og:title"]', '');
	if (title == '') {
		title = getHTMLTagContent(dom, 'meta[name="og:title"]', '');
	}
	if (title == null || title == '') {
		title = dom.window.document.title;
	}
	// ここまでやってだめだったら諦める
	if (title == null || title == '') {
		title = "UNKNOWN TITLE";
	}
	return title;
}

function getDescription(dom) {
	var description = '';
	description = getHTMLTagContent(dom, 'meta[property="og:description"]', '');
	if (description == '') {
		description = getHTMLTagContent(dom, 'meta[name="og:description"]', '');
	}
	return description;
}

function getHTMLTagContent(dom, query, defaultValue) {
	var content = '';
	// 間違っているサイト対応
	if (dom.window.document.querySelector(query) != null) {
		content = dom.window.document.querySelector(query).content;
	} else {
		content = defaultValue;
	}
	return content;
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
