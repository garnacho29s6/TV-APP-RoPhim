let phim, focusables = [[], []];
let row=0, col=0;
let numberSS = 1, time=0;
let width, height;
let subtitleOffset = 0.0;
let popupIndex = 0, subIndex = 0;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const query = urlParams.get('query');
let tap = urlParams.get('tap');
const type = urlParams.get('type');
const title = urlParams.get('title');
const sotap = urlParams.get('sotap');
const isLuu = parseInt(urlParams.get('luu'));
let buttonSub = [];
let data, totalSub = 0;

const playerUI = document.getElementById("playerUI");
const episodeList = document.getElementById("episodeList");
const subtitleBox = document.getElementById("subtitle")
const buttonPopup = document.getElementsByClassName("btn-pop");
const subContain = document.getElementById("popupWrapper");
const popupSub = document.getElementsByClassName("popupCC")[0]

let subtitles = [];

const savedData = localStorage.getItem(query);

if (savedData && isLuu==1) {
	const data = JSON.parse(savedData);
   tap = data.episode;
   time = data.time;
}

function parseTime(t) {
  // Hỗ trợ định dạng: "00:01:21.130" hoặc "01:21.130"
  const parts = t.split(':').map(p => p.trim());
  let hours = 0, minutes = 0, seconds = 0;

  if (parts.length === 3) {
    hours = parseInt(parts[0]);
    minutes = parseInt(parts[1]);
    seconds = parseFloat(parts[2].replace(',', '.'));
  } else if (parts.length === 2) {
    minutes = parseInt(parts[0]);
    seconds = parseFloat(parts[1].replace(',', '.'));
  }

  return hours * 3600 + minutes * 60 + seconds;
}

async function loadSubtitles(url) {
	focusables[row][col].focus();
	subtitleBox.style.bottom = "5%"
	document.getElementById('popupWrapper').style.display = "none";
	playerUI.style.display = "none";
	document.getElementById("subtitle").innerText = "";
	if(!url) return;
  const res = await fetch(url);
  const text = await res.text();

  const lines = text.trim().split('\n');
  console.log(lines)
  subtitles = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === '' || line === 'WEBVTT') {
      i++;
      continue;
    }

    const timeMatch = line.includes('-->');
    if (timeMatch) {
	  const splitedLine = line.split(' --> ');
	  const startStr = splitedLine[0], endStr = splitedLine[1].substring(0, splitedLine[0].length);
      const start = parseTime(startStr.trim());
      const end = parseTime(endStr.trim());

      i++;
      let content = '';

      while (i < lines.length && lines[i].trim() !== '') {
        content += lines[i] + '\n';
        i++;
      }

      subtitles.push({ start, end, text: content.trim() });
    }

    i++;
  }
}

async function loadPhimViet() {
	const url = "https://ophim1.com/phim/" + query;

    try {
      const resp = await fetch(url);
      const json = await resp.json();
      try {
    	  phim = json.episodes[0].server_data;
      } catch {
    	  phim = json.data.episodes[0].server_data;
      }
    } catch (e) {
      console.error("Lỗi khi lấy phim TQ:", e);
    }
  }
async function loadRo() {
    const resp = await fetch(`http://192.168.1.9:3000/m3u8?mid=${query}&ss=1&ep=${tap}`);
    phim = await resp.json();
}

function showSubtitleAt(currentSec) {
	if (!subtitles || subtitles.length === 0) return;

	const currentSub = subtitles.find(s => currentSec >= s.start && currentSec <= s.end);
	if (currentSub) {
		document.getElementById("subtitle").innerText = currentSub.text;
	} else {
		document.getElementById("subtitle").innerText = "";
	}
}

window.onload = async function () {
	document.getElementById("videoTitle").innerHTML = title + " - Tập " + tap;
	for (let i = 1; i <= sotap; i++) {
		const li = document.createElement("li");
		li.setAttribute("tabindex", "0")
		if (i == tap) li.setAttribute("class", "selected")
		else li.setAttribute("class", "episode")
		li.setAttribute("data-episode", i)
		li.innerHTML = "Tập " + i;
		episodeList.appendChild(li)
		focusables[1].push(li);
	}
	focusables[0] = document.getElementsByClassName("btn-sel");
	if (type == "3") {
		const fetchVN = loadPhimViet().then(list => {
			console.log("oke");
		});
		await Promise.all([fetchVN]);
	} else if (type == "2") {
		const fetchOther = loadRo().then(list => {
			console.log("oke")
		});
		await Promise.all([fetchOther]);
		try {
			const vieSubs = phim.sub.filter(url => url.split('/').pop().includes('vie'));
			if (vieSubs != []) await loadSubtitles(vieSubs);
			else loadSubtitles(phim.sub[0])
		} catch (error) {	
			
		}
	}
	phim.sub.forEach(sub => {
		const btn = document.createElement("button");
		const name = sub.split("/")
		btn.setAttribute("tabindex", "0")
		btn.setAttribute("class", "popup-btn")
		btn.setAttribute("onclick", `loadSubtitles("${sub}")`)
		btn.innerHTML = name[name.length-1];
		popupSub.appendChild(btn);
		buttonSub.push(btn);
		totalSub++;
	})
	
	webapis.avplay.setListener({

	oncurrentplaytime: function (currentTime) {
    	try {
		const duration = webapis.avplay.getDuration();
		document.getElementById("timeDisplay").innerText = `${formatTime(currentTime)} / ${formatTime(duration)}`;
		const percent = (currentTime / duration) * 100;
		document.getElementById("videoProgressBar").style.width = percent + "%";
		} catch (e) {
		console.error("Lỗi cập nhật tiến trình:", e);
		}
		const currentSec = currentTime / 1000;
		const adjustedTime = currentSec + subtitleOffset;
		showSubtitleAt(adjustedTime);
	},
	});
	localStorage.setItem(query, JSON.stringify({
		episode: tap,
		time: time
	}));
	document.getElementById("loader").style.opacity = "0";
	  setTimeout(() => {
	    document.getElementById("loader").style.display = "none";
	  }, 500);
	var avplay = webapis.avplay;
	if (type == 3) avplay.open(phim[tap-1].link_m3u8);
	else  avplay.open(phim.m3u8);
	avplay.prepareAsync(function () {
		avplay.setDisplayRect(0, 0, 1920, 1080);
	  	avplay.play();
		if (parseInt(time) > 0)
			setTimeout(() => {
				webapis.avplay.jumpForward(time);
			}, 1000);
	}, function (err) {
	  	console.error("Prepare failed", err);
	});
	avplay.setDisplayMethod("PLAYER_DISPLAY_MODE_CROPPED_FULL");
}

document.addEventListener('keydown', async function (e) {
	const key = e.keyCode;
	if ([37, 38, 39, 40].includes(key)) {
		e.preventDefault(); // <- Cực kỳ quan trọng để ngăn scroll nhẹ
	}
	if (playerUI.style.display == "none" && key != 10009 && document.getElementById('exit-popup').style.display == "none") { 
		playerUI.style.display = "flex";
		subtitleBox.style.bottom = "35%";
		col=3; row=0;
		focusables[row][col].focus();
		return ;
	}
  switch (key) {
    case 13:
		if (e.target.classList.contains("episode")) {
		  	window.location.href = `watch.html?query=${query}&tap=${e.target.dataset.episode}&type=2&title=${title}&sotap=${sotap}&luu=2`;
		}
      	break;
	case 37: //LEFT
		if (document.getElementById('popupWrapper').style.display == "block") break;
		if (document.getElementById('exit-popup').style.display == "block") {
			if (popupIndex > 0) popupIndex --;
			buttonPopup[popupIndex].focus()
			break;
		}
		if (col > 0) col--;
		focusables[row][col].focus()
		break;
	case 38: // UP
		if (document.getElementById('popupWrapper').style.display  == "block") {
			if (subIndex > 0) subIndex --;
			buttonSub[subIndex].focus();
			break; 
		}
		if (document.getElementById('exit-popup').style.display == "block") {
			break;
		}
		if (row > 0) {
			row --;
			if (row == 0) col=3;
			focusables[row][col].focus()
		} else {
			playerUI.style.display = "none";
			subtitleBox.style.bottom = "5%";
		}
		break;
	case 39: //RIGHT
		if (document.getElementById('popupWrapper').style.display  == "block") break;
		if (document.getElementById('exit-popup').style.display == "block") {
			if (popupIndex < 2) popupIndex++;
			buttonPopup[popupIndex].focus()
			break;
		}
		if (col < focusables[row].length-1) col++;
		focusables[row][col].focus()
		break;
	case 40: // DOWN
		if (document.getElementById('popupWrapper').style.display == "block") {
			if (subIndex < totalSub) subIndex ++;
			buttonSub[subIndex].focus();
			break; 
		}
		if (document.getElementById('exit-popup').style.display == "block") {
			break;
		}
		if (row < numberSS + 1) row++;
		focusables[row][col].focus()
		break;
	case 10009:
		if (subContain.style.display == "block") {
			subContain.style.display = "none";
			focusables[row][col].focus();
			break;
		}
		localStorage.setItem(query, JSON.stringify({
			episode: tap,
			time: webapis.avplay.getCurrentTime()
		}));
		showCustomExitPopup();
		break;
  }
});

window.addEventListener("beforeunload", function () {
  	localStorage.setItem(query, JSON.stringify({
		episode: tap,
		time: webapis.avplay.getCurrentTime()
	}));
});

function seek(ms) {
	try {
		if (ms < 0) {
			webapis.avplay.jumpBackward(-ms);
		} else {
			webapis.avplay.jumpForward(ms);
		}
	} catch (e) {
		console.error("Seek error", e);
	}
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}


function togglePlayPause() {
    try {
      const state = webapis.avplay.getState();
      const icon = document.getElementById("playPauseIcon");
      if (state === "PLAYING") {
        webapis.avplay.pause();
        icon.className = "fas fa-play";
      } else if (state === "PAUSED") {
        webapis.avplay.play();
        icon.className = "fas fa-pause";
      }
    } catch (e) {
      console.error("Toggle play/pause error", e);
    }
}

function timeSkip(time) {
	subtitleOffset = parseFloat((subtitleOffset + time).toFixed(1));
	document.getElementById("textSkip").innerHTML = `${subtitleOffset}`;
}

function showCustomExitPopup() {
	popupIndex=2;
	document.getElementById('overlay').style.display = 'block';
  document.getElementById('exit-popup').style.display = 'block';
	buttonPopup[popupIndex].focus();
}

function confirmExit() {
	try {
        if (webapis.avplay.getState() !== 'NONE') {
            webapis.avplay.stop();
            webapis.avplay.close();
        }
    } catch (e) {
        console.error('Error stopping video:', e);
    }

    // ✅ Dọn DOM nếu cần
    const container = document.getElementById('video');
    if (container) container.innerHTML = '';
    webapis.avplay.setListener({});
  tizen.application.getCurrentApplication().exit();
}

function cancelExit() {
	 document.getElementById('overlay').style.display = 'none';
  document.getElementById('exit-popup').style.display = 'none';
}

function confirmReturn() {
	try {
        if (webapis.avplay.getState() !== 'NONE') {
            webapis.avplay.stop();
            webapis.avplay.close();
        }
    } catch (e) {
        alert('Error stopping video:', e);
    }

    // ✅ Dọn DOM nếu cần
    const container = document.getElementById('video');
    if (container) container.innerHTML = '';
    // ✅ Clear listener
    webapis.avplay.setListener({});
	window.location.href = "index.html";
}

function chooseSub() {
	document.getElementById('popupWrapper').style.display = 'block';
	buttonSub[subIndex].focus();
}