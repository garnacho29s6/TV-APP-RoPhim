let focusables = [
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[],
	[]
];
let currentIndex = 0;
let isSearch = false;
let isKey = false;
let temp = false;
let index=1;
let rows = [], row=0, col=0;
let options;
const inputBox = document.getElementById('search-box');
const keyboard = document.getElementById('virtual-keyboard');
const container = document.getElementsByClassName('movie-list')
const keys = document.querySelectorAll('.key');
const title = document.querySelectorAll(".section h2");
const genreDropdown = document.getElementById("genreDropdown");
const countryDropdown = document.getElementById("countryDropdown");

try {
	webapis.avplay.stop();   // Dừng phát video
} catch (e) {
	console.log('Error stopping video:', e);
}

try {
	webapis.avplay.close();  // Giải phóng tài nguyên và hủy luồng
} catch (e) {
	console.log('Error closing AVPlay:', e);
}

// 1: moi nhat, 2: the loai, 3: tim kiem
 async function loadPhimTrungQuoc(type ,page = 1, temp) {
	let url;
	if (type == 1) url = `https://api.rophim.me/v1/collection/list?page=1&limit=7`
	else if (type == 2)  url = `https://ophim1.com/v1/api/the-loai/${temp}?page=${page}`
	else if (type == 3) url =`https://ophim1.com/v1/api/quoc-gia/${temp}?page=${page}`
	else url = `https://ophim1.com/v1/api/tim-kiem?keyword=${temp}&page=${page}`

    try {
      const resp = await fetch(url);
      const json = await resp.json();
	  try {
		return json.result.collections;
	  } catch  {
		return phim = json.data.items;
	  }
    } catch (e) {
      console.error("Lỗi khi lấy phim TQ:", e);
      return [];
    }
  }

function countHiddenLeftItems(num) {
	if (num < 2) return 0;
  const container = document.querySelectorAll('.movie-list')[num-2];
  const items = container.querySelectorAll('.movie-item');
  const scrollLeft = container.scrollLeft;

  let hiddenCount = 0;
  for (let item of items) {
    const itemLeft = item.offsetLeft;
    if (itemLeft + item.offsetWidth <= scrollLeft) {
      hiddenCount++;
    }
  }
  return hiddenCount;
}

async function loadList(type) {
	let url;
	if (type == 1) url = "https://api.rophim.me/v1/country/list"
	else if (type == 2) url = "https://api.rophim.me/v1/genre/list"
	try {
      const resp = await fetch(url);
      const json = await resp.json();
	  return json.result;
    } catch (e) {
      console.error("Lỗi khi lấy phim TQ:", e);
      return [];
    }
}

window.onload = async function () {
	focusables[0] = [document.getElementById("te"), document.getElementById("genreToggle"), document.getElementById("countryToggle")]
	focusables[1] = [document.getElementById("btn-play")];
	rows[0] = 0;
	rows[1] = 0;
	const fetchGern = loadList(2).then(list => {
		list.forEach(p => {
			const div = document.createElement("div");
			div.innerHTML = p.name;
			div.setAttribute("tabindex", "0");
			div.setAttribute("data-genre", p._id);
			div.setAttribute("class", "filter-option");
			genreDropdown.appendChild(div);
		})
	});
	const fetchCoun = loadList(1).then(list => {
		list.forEach(p => {
			const div = document.createElement("div");
			div.innerHTML = p.name;
			div.setAttribute("tabindex", "0");
			div.setAttribute("data-country", p._id);
			div.setAttribute("class", "filter-option");
			countryDropdown.appendChild(div);
		})
	});
	const fetchVN = loadPhimTrungQuoc(3 ,1, 'viet-nam').then(list => {
	    const cont = container[0];
		let i = 0;
	    list.forEach(p => {
	      const div = document.createElement("div");
	      const u = `"https://ophim16.cc/_next/image?url=https%3A%2F%2Fimg.ophim.live%2Fuploads%2Fmovies%2F${p.thumb_url}&w=256&q=90"`
	      div.className = "movie-item selection";
	      div.innerHTML = `
	      <img src=${u}>
	        <div class="movie-title">${p.name}</div>
	      `;
	      div.setAttribute("tabindex", "0");
	      div.setAttribute("id", p.slug);
	      div.setAttribute("data-quoc-gia", "viet-nam");
	      cont.appendChild(div);
		  focusables[2][i] = div;
		  i++;
	    });
	  });
	rows[2] = 0;
	const fetchNew = loadPhimTrungQuoc(1 ,1, 'trung-quoc').then(list => {
	    list.forEach(p => {
			if (index == 7) return true;
			if (p.slug != "phim-han-quoc-moi") {
				title[index].innerHTML = p.name;
				let i = 0;
				p.movies.forEach(phim => {
					const cont = container[index];
					const div = document.createElement("div");
					const u = `"https://static.nutscdn.com/vimg/400-0/${phim.images.posters[0].path.slice(6)}"`
					div.className = "movie-item selection";
					div.innerHTML = `
					<img src=${u}>
						<div class="movie-title">${phim.title}</div>
					`;
					div.setAttribute("tabindex", "0");
					div.setAttribute("id", phim.slug+"."+phim._id);
					div.setAttribute("data-quoc-gia", "khong");
					div.setAttribute("data-sotap", phim.latest_episode["1"]);
					cont.appendChild(div);
					focusables[index+2][i] = div;
					i++;
				})
				rows[index+2] = 0;
	      		index++;
			}
	    });
	  });
	  await Promise.all([fetchGern,fetchCoun,fetchNew, fetchVN]);
	  // Đợi tất cả ảnh tải xong
	  const allImages = Array.from(document.images);
	  const total = allImages.length;
	  const progressBar = document.getElementById("progressBar");
	  const loadingText = document.getElementById("loadingText");
	  let loaded = 0;

	  await Promise.all(
	    allImages.map((img) => {
	      return new Promise((resolve) => {
	        const done = () => {
	          loaded++;
	          const percent = Math.round((loaded / total) * 100);
	          progressBar.style.width = percent + "%";
			  loadingText.textContent = `Đang tải dữ liệu... ${percent}%`;
	          resolve();
	        };
	        if (img.complete) {
	          done();
	        } else {
	          img.onload = img.onerror = done;
	        }
	      });
	    })
	  );

	  // Ẩn loader
	  document.getElementById("loader").style.opacity = "0";
	  setTimeout(() => {
	    document.getElementById("loader").style.display = "none";
	  }, 500);
	  focusables[0][0].focus();
	};

function updateFocus() {
	focusables[row][col].focus();
}

function handleEnter(element) {
	  if (element.classList.contains("search-bar")) {
		 keyboard.style.display = 'block';
		 currentFocusIndex = 19;
		 keys[currentFocusIndex].focus();
	  } else if (element.id === "watch-button") {
		 location.href = 'watch.html';
	    // Gọi hàm chuyển trang hoặc phát video
	  } else if (element.classList.contains("movie-item")) {
		  window.location.href = `watch.html?query=${focusables[row][col].id}&tap=1&type=2&title=${encodeURI(focusables[row][col].children[1].innerHTML)}&sotap=${focusables[row][col].dataset.sotap}&luu=1`;
	    // Gọi hàm hiển thị thông tin phim hoặc chuyển trang
	  }
	  else if (element.classList.contains("filter-item")) {
		if (element.children[1].style.display === "block") element.children[1].style.display = "none";
		else {
			currentDrop = 0;
			element.children[1].style.display = "grid";
			options = element.children[1].children;
			options[0].focus();
		}
	  }
}

function scrollPageToFocusedItem(item) {
	const cl = item.getAttribute("class");
	const rect = item.getBoundingClientRect();
  	const absoluteTop = rect.top + window.scrollY;
	const offset = 90;
	  // Nếu item nằm gần phía trên màn hình
	try {
	  if (cl.includes("btn-play") || cl.includes("search-bar")) {
	    // Scroll lên đầu trang
	    window.scrollTo({
	      top: 0,
	      behavior: "smooth"
	    });
	  }

	  // Nếu item nằm gần phía dưới màn hình
	  else if (cl.includes("movie-item")) {
	    // Scroll xuống đáy trang
	    window.scrollTo({
			top: absoluteTop - offset,
			behavior: "smooth"
		});
	  }
	} catch {
	}

	  // Nếu item nằm trong vùng an toàn → không làm gì
}

function scrollItemToCenter(item) {
  const container = item.parentElement;
  const containerWidth = container.clientWidth;
  const itemLeft = item.offsetLeft;
  const itemWidth = item.clientWidth;

  const targetScroll = itemLeft - (containerWidth / 2) + (itemWidth / 2);

  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  });
}

document.addEventListener("focusin", (e) => {
  scrollPageToFocusedItem(e.target);
  if (e.target.classList.contains("movie-item")) scrollItemToCenter(e.target)
});
	
document.addEventListener("keydown", function (e) {
	  const key = e.keyCode;
	  if ([37, 38, 39, 40].includes(key)) {
		    e.preventDefault(); // <- Cực kỳ quan trọng để ngăn scroll nhẹ
		  }
	   if (keyboard.style.display === 'block') return ;
	   if (genreDropdown.style.display === 'grid' || countryDropdown.style.display === 'grid') return ;
	  switch (key) {
	  case 37: //LEFT
		  if (col > 0) {
			  col = col - 1;
			  updateFocus()
		  }
		  break;
	    case 38: // UP
	      if (row > 0) {
			  const hidden = countHiddenLeftItems(row);
			  row = row -1;
			  if (row <= 1) col = 0;
			  else col = col - hidden + countHiddenLeftItems(row);
			  updateFocus()
	      }
	      break;
	    case 39: //RIGHT
	    	if (col < focusables[row].length - 1) {
	    		col = col + 1;
				updateFocus()
	    	}
	    	break;
	    case 40: // DOWN
	      if (row < 8) {
			const hidden = countHiddenLeftItems(row);
			row = row + 1;
			if (row <= 1) col = 0;
			else col = col - hidden + countHiddenLeftItems(row);
			updateFocus()
		}
	      break;
	    case 13: // ENTER
	    	handleEnter(e.target);
	      break;
	    case 10009: // RETURN
  			tizen.application.getCurrentApplication().exit();
	      break;
	  }
	});
let currentFocusIndex = 19;
let currentDrop = 0;

// document.addEventListener('keydown', function (e) {
// 	  if (e.keyCode === 13 && document.activeElement === document.getElementById("te")) {
// 		 isKey = true;
// 	    keyboard.style.display = 'block';
// 	    keys[0].focus();
// 	  }
// 	});

keys.forEach((key, index) => {
  key.setAttribute('tabindex', '0');
});

function handleKeyInput() {
	 if (keyboard.style.display === 'none') return ;
		const value =  keys[currentFocusIndex].textContent ;
	  if (value === '←') {
	    inputBox.value = inputBox.value.slice(0, -1);
	  } else if (value === 'Space') {
	    inputBox.value += ' ';
	  } else if (value === 'OK') {
	    keyboard.style.display = 'none';
	    inputBox.blur();
	    const keyword = document.getElementById('search-box').value.trim();
		  if (keyword) {
		    window.location.href = `search.html?query=${encodeURIComponent(keyword)}&page=1&type=1`;
		  };
	    // có thể xử lý tìm kiếm ở đây
	  } else if (value === 'Thoát'){
			keyboard.style.display = 'none';
			inputBox.blur();
			focusables[row][col].focus();
	  }
	  else {
	    inputBox.value += value.toLowerCase();
	  }
}

genreDropdown.addEventListener('keydown', function (e) {
	    if (e.keyCode === 37) currentDrop--;
	    else if (e.keyCode === 39) currentDrop++;
	    else if (e.keyCode === 38 || e.keyCode === 40) {
	      // lên xuống dòng
	      currentDrop += (e.keyCode === 38 ? -3: 3);
	    }
	    else if (e.keyCode === 13) {
	    	window.location.href = `search.html?other=${options[currentDrop].dataset.genre}&type=2&page=1&query=${encodeURI(options[currentDrop].innerHTML)}`;
	    }
		if (currentDrop < 0) {
			genreDropdown.style.display = "none";
			focusables[row][col].focus();
			return ;
		}
	    currentDrop = Math.max(0, Math.min(options.length - 1, currentDrop));
	    options[currentDrop].focus();
	    e.preventDefault();
});

countryDropdown.addEventListener('keydown', function (e) {
	    if (e.keyCode === 37) currentDrop--;
	    else if (e.keyCode === 39) currentDrop++;
	    else if (e.keyCode === 38 || e.keyCode === 40) {
	      // lên xuống dòng
	      currentDrop += (e.keyCode === 38 ? -1 : 1);
	    }
	    else if (e.keyCode === 13) {
	    	window.location.href = `search.html?other=${options[currentDrop].dataset.country}&type=3&page=1&query=${encodeURI(options[currentDrop].innerHTML)}`;
	    }
		if (currentDrop < 0) {
			countryDropdown.style.display = "none";
			focusables[row][col].focus();
			return ;
		}
	    currentDrop = Math.max(0, Math.min(options.length - 1, currentDrop));
	    options[currentDrop].focus();
	    e.preventDefault();
});

// Di chuyển bằng remote
keyboard.addEventListener('keydown', function (e) {
	  if (keyboard.style.display === 'block') {
	    if (e.keyCode === 37) currentFocusIndex--;
	    else if (e.keyCode === 39) currentFocusIndex++;
	    else if (e.keyCode === 38 || e.keyCode === 40) {
	      // lên xuống dòng
	      currentFocusIndex += (e.keyCode === 38 ? -10 : 10);
	    }
	    else if (e.keyCode === 13) {
	    	handleKeyInput();
	    	temp = true;
	    }
	    currentFocusIndex = Math.max(0, Math.min(keys.length - 1, currentFocusIndex));
	    keys[currentFocusIndex].focus();
	    e.preventDefault();
	  }
});