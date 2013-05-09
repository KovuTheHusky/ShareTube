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
	var panelCode = '<ol style="padding: 10px;">';
	for(var i = 0; i < downloadCodeList.length; i++) {
		panelCode += '<li><a style="text-decoration:none;" href="' + downloadCodeList[i].url + '"><span loop="' + i + '" id="' + (DOWNLOAD_YOUTUBE_FMT_ID + downloadCodeList[i].format) + '">' + downloadCodeList[i].label + '</span></a></li>';
	}
	panelCode += '</ol>';
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