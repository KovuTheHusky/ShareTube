var FORMAT_LABELS = {
	'5' : 'FLV 240p',
	'18' : 'MP4 360p',
	'22' : 'MP4 720p (HD)',
	'34' : 'FLV 360p',
	'35' : 'FLV 480p',
	'37' : 'MP4 1080p (HD)',
	'38' : 'MP4 4K (HD)',
	'43' : 'WebM 360p',
	'44' : 'WebM 480p',
	'45' : 'WebM 720p (HD)'
};
var FORMAT_EXTENSIONS = {
	'5' : 'flv',
	'18' : 'mp4',
	'22' : 'mp4',
	'34' : 'flv',
	'35' : 'flv',
	'37' : 'mp4',
	'38' : 'mp4',
	'43' : 'webm',
	'44' : 'webm',
	'45' : 'webm'
};
var FORMAT_LIST = ['5', '34', '35', '18', '22', '37', '38', '43', '44', '45'];
var DOWNLOAD_LINK_MESSAGES = {
	'af' : 'Aflaai',
	'de' : 'Herunterladen',
	'en' : 'Download',
	'es' : 'Descargar',
	'et' : 'Alla laadima',
	'fr' : 'Télécharger',
	'it' : 'Caricare',
	'sv' : 'Ladda ner'
};
var DOWNLOAD_LINK_MESSAGE = 'Download';
var DOWNLOAD_YOUTUBE_FMT_ID = 'download-youtube-video-fmt';

var videoId, videoTicket, videoFormats, videoTitle = '';
run();

function run() {

	// obtain video ID, temporary ticket, formats map
	var videoPlayer = document.getElementById('watch-player');
	if (videoPlayer && videoPlayer.className != 'html5-player') { // Flash
		var flashValues = videoPlayer.innerHTML;
		var videoIdMatches = flashValues.match(/\&amp;video_id=([^(\&|$)]*)/);
		videoId = (videoIdMatches) ? videoIdMatches[1] : null;
		var videoTicketMatches = flashValues.match(/\&amp;t=([^(\&|$)]*)/);
		videoTicket = (videoTicketMatches) ? videoTicketMatches[1] : null;
		var videoFormatsMatches = flashValues.match(/\&amp;url_encoded_fmt_stream_map=([^(\&|$)]*)/);
		videoFormats = (videoFormatsMatches) ? videoFormatsMatches[1] : null;
	}

	if (videoId == null || videoTicket == null) { // HTML5 - Firefox, Opera
		var config = null;
		if (typeof (unsafeWindow) == 'undefined') { // Opera
			unsafeWindow = window;
		}
		if (unsafeWindow.yt && unsafeWindow.yt.getConfig) {
			config = unsafeWindow.yt.getConfig('PLAYER_CONFIG');
		}
		if (config && config.args) {
			var args = config.args;
			videoId = args['video_id'];
			videoTicket = args['t'];
			videoFormats = args['url_encoded_fmt_stream_map'];
			if (videoFormats == null) {
				videoFormats = args['fmt_url_map'];
			}
		}
	}

	if (videoId == null || videoTicket == null) { // everything else (HTML5 - Chrome)
		var pageFooter = document.getElementById('postpage');
		if (pageFooter) {
			var pageFooterContent = pageFooter.innerHTML;
			var videoIdMatches = pageFooterContent.match(/\"video_id\":\s*\"([^\"]*)\"/);
			videoId = (videoIdMatches) ? videoIdMatches[1] : null;
			var videoTicketMatches = pageFooterContent.match(/\"t\":\s*\"([^\"]*)\"/);
			videoTicket = (videoTicketMatches) ? videoTicketMatches[1] : null;
			var videoFormatsMatches = pageFooterContent.match(/\"fmt_url_map\":\s*\"([^\"]*)\"/);
			videoFormats = (videoFormatsMatches) ? videoFormatsMatches[1] : null;
		}
	}

	if (videoId == null || videoTicket == null) { // future proof
		var bodyContent = document.body.innerHTML;
		var videoIdMatches = bodyContent.match(/\"video_id\":\s*\"([^\"]*)\"/);
		videoId = (videoIdMatches) ? videoIdMatches[1] : null;
		var videoTicketMatches = bodyContent.match(/\"t\":\s*\"([^\"]*)\"/);
		videoTicket = (videoTicketMatches) ? videoTicketMatches[1] : null;
		var videoFormatsMatches = bodyContent.match(/\"url_encoded_fmt_stream_map\":\s*\"([^\"]*)\"/);
		videoFormats = (videoFormatsMatches) ? videoFormatsMatches[1] : null;
	}

	if (videoId == null || videoTicket == null)
		return;

	// video title
	var headerTitle = document.getElementById('eow-title');
	if (headerTitle != null) {
		videoTitle = headerTitle.textContent || headerTitle.innerText || '';
	}
	if (videoTitle == '') {
		var titleTag = document.title;
		if (titleTag != null) {
			videoTitle = titleTag.replace(/^YouTube \- /i, '');
		}
	}
	videoTitle = videoTitle.replace(/[#"\?:\*]/g, '').replace(/[&\|\\\/]/g, '_').replace(/'/g, '\'').replace(/^\s+|\s+$/g, '').replace(/\.+$/g, '');
	if (videoTitle == '') {
		videoTitle = 'video';
	}

	// parse fmt_url_map
	var videoURL = new Array();
	var sep = '%2C';
	if (videoFormats.indexOf(',') > -1)
		sep = ',';

	var videoFormatsGroup = videoFormats.split(sep);
	for(var i = 0; i < videoFormatsGroup.length; i++) {
		var pairs = unescape(unescape(videoFormatsGroup[i])).replace(/\\u0026/g, '&').replace(/url=.*\?/g, '').split('&');
		var params = new Array();
		for(var j = 0; j < pairs.length; j++) {
			var param = pairs[j].split('=');
			params[param[0]] = param[1];
		}
		videoURL[params['itag']] = 'http://youtube.com/videoplayback?ratebypass=' + params['ratebypass'] + '&sver=' + params['sver'] + '&expire=' + params['expire'] + '&key=' + params['key'] + '&id=' + params['id'] + '&mv=' + params['mv'] + '&sparams=' + params['sparams'] + '&ipbits=' + params['ipbits'] + '&ip=' + params['ip'] + '&itag=' + params['itag'] + '&mt=' + params['mt'] + '&fexp=' + params['fexp'] + '&ms=' + params['ms'] + '&source=' + params['source'] + '&upn=' + params['upn'] + '&cp=' + params['cp'] + '&newshard=' + params['newshard'] + '&signature=' + params['sig'] + '';
	}

	var downloadCodeList = [];
	for(var i = 0; i < FORMAT_LIST.length; i++) {
		var format = FORMAT_LIST[i];
		// don't add lower quality FLV versions to prevent clutter
		if (format == '5' && (videoURL['34'] != undefined || videoURL['35'] != undefined))
			continue;
		if (format == '34' && videoURL['35'] != undefined)
			continue;
		if (videoURL[format] != undefined && FORMAT_LABELS[format] != undefined) {
			downloadCodeList.push({
				url : videoURL[format] + '&title=' + videoTitle,
				format : format,
				label : FORMAT_LABELS[format]
			});
		}
	}

	var uiLanguage = document.documentElement.getAttribute('lang');
	if (/^lt|bg|uk$/.test(uiLanguage)) {
		var likeButton = document.getElementById('watch-like');
		if (likeButton) {
			var spanElements = likeButton.getElementsByTagName('span');
			if (spanElements) {
				spanElements[0].style.display = 'none';
			}
		}
	}

	if (DOWNLOAD_LINK_MESSAGES[uiLanguage] != null) {
		DOWNLOAD_LINK_MESSAGE = DOWNLOAD_LINK_MESSAGES[uiLanguage];
	} else {
		alert(uiLanguage); // temporary for language addition
	}

	// find parent container
	var parentElement = document.getElementById('watch7-secondary-actions'); // share-panel-buttons
	if (parentElement == null)
		return;

	// generate download code
	var downloadCode = '<span class="yt-uix-button-content">' + DOWNLOAD_LINK_MESSAGE + '</span>';
	var mp4List = '<div style="display: inline-block; width: 30%; margin: 0 0 10px 0; vertical-align: top; font-size: 1.2em; font-family: arial, sans-serif;"><img alt="" src="data:image/png;base64,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" /><ol>';
	var webmList = '<div style="display: inline-block; width: 30%; margin: 0 0 10px 0; padding-left: 20px; border-left: 1px solid #E2E2E2; vertical-align: top; font-size: 1.2em; font-family: arial, sans-serif;"><img alt="" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowMDM4Q0EwN0I2OEExMUUyQTE2OUI0OUI1MDRDNUVFNiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowMDM4Q0EwOEI2OEExMUUyQTE2OUI0OUI1MDRDNUVFNiI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjAwMzhDQTA1QjY4QTExRTJBMTY5QjQ5QjUwNEM1RUU2IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjAwMzhDQTA2QjY4QTExRTJBMTY5QjQ5QjUwNEM1RUU2Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+ukQWTwAAAkpJREFUeNpiXHMh6D/DEAWXj9wtZWIYwkDXRrl7SHsABEY9MOqBUQ+MemDUAyPbAyzUMIQR1hhBb5QwYlf/n5HOHhBglmUwlkxnYOcWZmBkxq6Fg1WIKAt//H6HVfzf3z8M3z89Yzj3cjbDp38vqOcBB5UWBmFuTaqFGE6PsjIwcHGIMbiKTWV4+/U6w4E7NZTnAWo7nlgAstNOsY5yDwyE4+EOY2ajzAMaAn4DWrqAAo+XSYx8DyhL+ZJs6dO7O4BFDPX6R9bKteRn4q+/XhJdssDAiS+zGRguzWYQZ9Ni0JSLojgJMrNykB8DlFj+8tc1cCny7P0JijwACsQBrYmPP+pm2H05G1wskpsPBrwpAaqUQLFx/+V2nJXYkGgLnXsxh2Hv9WKyY2NQNOZ+/P8Ejo1f394NTQ/AwJ/f3wZXa5T40GJmsFNpZODilhl6HtATjWGQFbUnuW4ZcA9wMPIxWCiX0axdRVMPmErlMIgJ6JMd6sSUWCz4NJMbakIsCgx6CikUhzo3mzh9Y8CMK4FBVtkbmFupU7j9/fOT/GL0+ZtTJFsoq+pLNceDG4d3O8n3wM0PmwZ8xOHD38eUVWTUrvZJAa8/X6S8Jj54p3ZAPAGy89C9JsqL0f9ACGq7yHKaMWhJRTKwsPOQNZRC7BDLn59fGM4/msnw6vcN6tYDj7+fYnh8FzVTgwazmP4ygjEjaKQKV08STQqk7x/zf4a/LP8gchQOcpFdjIIs/svyH4wHEowO7o56YNQDox4Y9cCoB0Y9MJAAIMAASsOvszlkiCsAAAAASUVORK5CYII=" /><ol>';
	var flvList = '<div style="display: inline-block; width: 30%; margin: 0 0 10px 0; padding-left: 20px; border-left: 1px solid #E2E2E2; vertical-align: top; font-size: 1.2em; font-family: arial, sans-serif;"><img alt="" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpCNjUwRTM3OUI2OEIxMUUyOEFEMzg0N0VGOEMyMDkzQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpCNjUwRTM3QUI2OEIxMUUyOEFEMzg0N0VGOEMyMDkzQSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkI2NTBFMzc3QjY4QjExRTI4QUQzODQ3RUY4QzIwOTNBIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkI2NTBFMzc4QjY4QjExRTI4QUQzODQ3RUY4QzIwOTNBIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+x5nuyAAAA8dJREFUeNrsmF1oVEcUx+fM3I/NNms+TAkmazRJsaUISUOslr60ih9oMEVRA2LB6ItvFhREAopY2lqF0hdR36wK0SgGRFAUP0CffJL6CWo17LJVU7ub3ezevTNzOvfe7Crtk9XMjZi5y3JYljs/zpnzP+cM3Iu3En8hYmBIREYpCWmFtvE7A2SUI4UlK8R4eUBlC8NGmaghk6WQTQT3eEAThGMCh2xc3/7so+b6xQujn8+Z0tpsTa17fu5sdvP2cICGZ7U0bd3c8vVX1I6Wo2BFq8LxkOxd17ltq1kR5UpN5MtzgUKEAGT9vHtmT4/0lFYYQAmAl8egHu8n3Yfa2rFd0QTvBWAlEOFDEbT0Zllh1cr4xt5/9Q4kIAOQxQL8ndYXsr+mTevY2ed3L5IC9ZkEAYZFJ91/InH+At5/ZCcT+oDifVvMKTHCBbIx9yAw98Hju5u+q7hz09KsQ5m2ttauJQLRdw0oIkppMZW61bOhMvVHCEod37SeUhtUVgtJBZEAHPHhtr7XpXk7QNnmppoF84VfpRHARcUDmcEBdvFyOLWsbs1qGokq0UN/MUqc0fz9Xw6FVstqvlmm5JiWVE9lGUjesvcnlWHKa4Zh/XnsN+PoKU1A7sJFduN0VpCCljsrwiy7tvMz8LtQtUHuysyCNg9Vr1mudpUgyCtVQQVOOE5ggh2RrqvpDKUb62u//IIWOUcOUmHhGJn/8aqGOuSBqcdDNd3dRmUVz+eV7QAylfMEJBDpuyuQpLGCrwloRZeQouRqF9FGm1JQ9kuXqALLTMk1AOWXLqr8+FMxmvcj5MWFRczUj3sz164aRiSYq3wiYzSRqNIA1LCxF4V6OCPU29uy+NBQcf+ByH/+WaVBGHPLu6Jz2h0nz5D4vRgxDev5wMk3VzUo33681qq/ftH8sIGLAqDnH2makMsl2+eGMwZVHD9sxKd7DZeXPsCJtCKR4f7jIcxlLzo6YucGa+bNEyNZL7dVv+ECWlGeeOL8sE/fXJZbu9JsnFHdObuhrV2aUZHOMQDVJ3sSw7hp28k9v+obFLMz4p98vwuZLZ0iLzrEzQIF1RcaQnLVu1dXZ/qP4qnT+oBUyXYzOWQOCBkIntdkgMuFIepieOnKyJYdumd7LzjBl3dsfCBKSV2Mnzk7/O0G3bO9JKr1Uq2pUMdG5ZPJDBmzyIvh9K49hUMHQ7hsEAZllR9Q06BSCF6UiceZI5efHT4SS6bCuf2ofZTMnhzA7Ehh6Gnh99vmjRvqx9i4XZj8T6V+jy6sJoEmgSaBxnv9I8AACaGzp48DFc4AAAAASUVORK5CYII=" /><ol>';
	var mp4Count = 0, webmCount = 0, flvCount = 0;
	for(var i = 0; i < downloadCodeList.length; i++) {
		if (FORMAT_EXTENSIONS[downloadCodeList[i].format] == 'mp4') {
			mp4Count++;
			mp4List += '<li><a style="text-decoration:none;" href="' + downloadCodeList[i].url + '"><span loop="' + i + '" id="' + (DOWNLOAD_YOUTUBE_FMT_ID + downloadCodeList[i].format) + '">' + downloadCodeList[i].label + '</span></a></li>';
		} else if (FORMAT_EXTENSIONS[downloadCodeList[i].format] == 'webm') {
			webmCount++;
			webmList += '<li><a style="text-decoration:none;" href="' + downloadCodeList[i].url + '"><span loop="' + i + '" id="' + (DOWNLOAD_YOUTUBE_FMT_ID + downloadCodeList[i].format) + '">' + downloadCodeList[i].label + '</span></a></li>';
		} else {
			flvCount++;
			flvList += '<li><a style="text-decoration:none;" href="' + downloadCodeList[i].url + '"><span loop="' + i + '" id="' + (DOWNLOAD_YOUTUBE_FMT_ID + downloadCodeList[i].format) + '">' + downloadCodeList[i].label + '</span></a></li>';
		}
	}
	mp4List += '</ol></div>';
	webmList += '</ol></div>';
	flvList += '</ol></div>';
	var panelCode = (mp4Count > 0 ? mp4List : '') + (webmCount > 0 ? webmList : '') + (flvCount > 0 ? flvList : '');
	downloadCode = '<button onclick=";return false;" title class="action-panel-trigger yt-uix-button yt-uix-button-text yt-uix-tooltip' + '" type="button" data-button-toggle="true" data-trigger-for="action-panel-download" role="button">' + downloadCode + '</button>';

	// add the button
	var containerSpan = document.createElement('span');

	var leftmostButton = document.getElementById('watch7-secondary-actions').children[2] || null;

	if (leftmostButton && leftmostButton.parentNode == parentElement) {
		containerSpan.innerHTML = downloadCode + ' ';
		parentElement.insertBefore(containerSpan, leftmostButton);
	} else {
		containerSpan.innerHTML = ' ' + downloadCode;
		parentElement.appendChild(containerSpan);
	}

	var panelDiv = document.createElement('div');
	panelDiv.id = 'action-panel-download';
	panelDiv.className = 'action-panel-content hid';
	panelDiv.setAttribute('data-panel-loaded', 'true');

	panelDiv.innerHTML = '' + panelCode + '';

	var panels = document.getElementById('watch7-action-panels');

	panels.insertBefore(panelDiv, panels.children[2]);

	for(var i = 0; i < downloadCodeList.length; i++) {
		var downloadFMT = document.getElementById(DOWNLOAD_YOUTUBE_FMT_ID + downloadCodeList[i].format);
		if (downloadFMT.addEventListener) {
			downloadFMT.addEventListener('click', downloadVideo, false);
		} else if (downloadFMT.attachEvent) { // IE
			downloadFMT.attachEvent('onclick', downloadVideo);
		}
	}

	function downloadVideo(e) {
		var e = e || window.event; // IE
		var elem = e.target || e.srcElement;
		e.returnValue = false;
		if (e.preventDefault) {
			e.preventDefault();
		}
		var loop = elem.getAttribute('loop');
		if (typeof GM_download == 'function') { // Firefox extension compatibility
			GM_download(downloadCodeList[loop].url, videoTitle + '.' + FORMAT_EXTENSIONS[downloadCodeList[loop].format]);
		} else {
			document.location.href = downloadCodeList[loop].url;
		}
	}
}