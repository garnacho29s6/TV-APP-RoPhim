let focusables=[], currentIndex=0, isSearch=false;
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const query = urlParams.get('query')
const type = urlParams.get('type')
const other = urlParams.get('other')
let pageNum = urlParams.get('page')
let row;

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

document.getElementById("tit").innerHTML = `Kết quả tìm kiếm "${query}"`;

function handleEnter(element) {
	  if (element.classList.contains("search-bar")) {
		 if (isSearch) {
			 const keyword = document.getElementById('search-box').value.trim();
			  if (keyword) {
			    window.location.href = `search.html?query=${encodeURIComponent(keyword)}&page=1`;
			  }
			 isSearch = false;
		 }
		 else {
			 element.children[0].focus();
			 isSearch = true;
		 }
	  } else if (element.id === "watch-button") {
		 location.href = 'watch.html';
	    // Gọi hàm chuyển trang hoặc phát video
	  } else if (element.classList.contains("movie-item")) {
		  window.location.href = `watch.html?query=${focusables[currentIndex].id}&tap=1&type=2&title=${encodeURI(focusables[currentIndex].children[1].innerHTML)}&sotap=${focusables[currentIndex].dataset.sotap}&luu=1`;
	    // Gọi hàm hiển thị thông tin phim hoặc chuyển trang
	  } else if (element.classList.contains("page-btn")) {
		  if (element.id == "next") window.location.href = `search.html?other=${other}&type=3&page=${pageNum+1}&query=${encodeURI(query)}`;
		  else history.back();
	  }
}
async function loadPhimTrungQuoc(type, page = 1, temp) {
		let url;
		if (type == 1) url = `https://api.rophim.me/v1/movie/filterV2?q=${temp}&countries=&genres=&years=&custom_year=&quality=&type=&status=&exclude_status=&versions=&rating=&networks=&productions=&sort=release_date&page=${page}`
		else if (type == 2)  url = `https://api.rophim.me/v1/movie/filterV2?q=&countries=&genres=${temp}&years=&custom_year=&quality=&type=&status=&exclude_status=Upcoming&versions=&rating=&networks=&productions=&sort=release_date&page=${page}`
		else if (type == 3) url =`https://ophim1.com/v1/api/quoc-gia/viet-nam?page=${page}`
		else url = `https://ophim1.com/v1/api/tim-kiem?keyword=${temp}&page=${page}`
			try {
				const resp = await fetch(url);
				const json = await resp.json();
				let phim;
				if (type == 2 || type == 1) phim = json.result.items;
				else
					try {
						phim = json.data.items;
					} catch {
						phim = json.items;
					}
			return phim;
		} catch (e) {
			console.error("Lỗi khi lấy phim TQ:", e);
			return [];
		}
	  }
	
    function scrollPageToFocusedItem(item) {
    	const cl = item.getAttribute("class");
    	const rect = item.getBoundingClientRect();
      	const absoluteTop = rect.top + window.scrollY;
    	const offset = 105;
    	  // Nếu item nằm gần phía trên màn hình
    	try {
    	  if (cl.includes("search-bar")) {
    	    // Scroll lên đầu trang
    	    window.scrollTo({
    	      top: 0,
    	      behavior: "smooth"
    	    });
    	  }

    	  // Nếu item nằm gần phía dưới màn hình
    	  else {
    		console.log(cl);
    	    // Scroll xuống đáy trang
    	    window.scrollTo({
    			top: absoluteTop - offset,
    			behavior: "smooth"
    		});
    	  }
    	} catch {
    		console.log('')
    	}

    	  // Nếu item nằm trong vùng an toàn → không làm gì
    }
    function updateFocus() {
    	
    	focusables[currentIndex].focus();
    }
    window.onload = async function () {
    	const el = document.getElementById("pagination").children
    	el[0].textContent = "←";
    	el[1].textContent = pageNum.toString();
    	pageNum++;
    	el[2].textContent = pageNum.toString();
    	pageNum--;
    	el[3].textContent = "→";
    	const fetchNew = loadPhimTrungQuoc(1 , 1, query).then(list => {
		const cont = document.getElementById("movieGrid");
	    list.forEach(phim => {
			row = Math.ceil(list.length/8)
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
	    });
	  });
    	  await Promise.all([fetchNew]);

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
    	  focusables = document.querySelectorAll(".selection");
    	  focusables[0].focus();
    }

    document.addEventListener("focusin", (e) => {
    	  scrollPageToFocusedItem(e.target);
    	});
    		
    	document.addEventListener("keydown", function (e) {
    		  const key = e.keyCode;
    		  if ([37, 38, 39, 40].includes(key)) {
    			    e.preventDefault(); // <- Cực kỳ quan trọng để ngăn scroll nhẹ
    			  }
    		  switch (key) {
    		  case 37: //LEFT
    			  if (currentIndex > 0) {
    				  currentIndex = currentIndex - 1;
    				  updateFocus()
    			  }
    			  break;
    		    case 38: // UP
    		      if (currentIndex > 0) {
    				  if (currentIndex < 1) currentIndex = currentIndex - 1;
    				  else if (currentIndex < 9) currentIndex = 0;
    				  else currentIndex = currentIndex - 8;
    				  updateFocus()
    		      }
    		      break;
    		    case 39: //RIGHT
    		    	if (currentIndex < focusables.length - 1) {
    		    		currentIndex = currentIndex + 1;
    					updateFocus()
    		    	}
    		    	break;
    		    case 40: // DOWN
    		      if (currentIndex < focusables.length - 1) {
    				if (currentIndex < 1) currentIndex = currentIndex + 1;
    				else if (currentIndex < 8*row-8) currentIndex = currentIndex+8;
    				else currentIndex = 8*row+1;
    				updateFocus()
    			}
    		      break;
    		    case 13: // ENTER
    		      handleEnter(focusables[currentIndex]);
    		      break;
    		    case 10009: // RETURN
    		    	history.back()
    		      break;
    		  }
    		});