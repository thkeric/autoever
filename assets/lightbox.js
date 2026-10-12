// 사진·영상을 누르면 화면 가운데에 크게 띄워 보는 라이트박스
(function () {
  var items = Array.prototype.slice.call(
    document.querySelectorAll('.zoom figure img, .zoom figure video, figure.zoom > img')
  );
  if (!items.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var box = document.createElement('div');
  box.className = 'lb';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '크게 보기');
  box.innerHTML =
    '<span class="lb-count" aria-live="polite"></span>' +
    '<button type="button" class="lb-btn lb-close" aria-label="닫기"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l10 10M15 5L5 15"/></svg></button>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="이전"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.5 4l-6 6 6 6"/></svg></button>' +
    '<button type="button" class="lb-btn lb-next" aria-label="다음"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M7.5 4l6 6-6 6"/></svg></button>' +
    '<div class="lb-stage"></div><p class="lb-cap"></p>';
  document.body.appendChild(box);

  var stage = box.querySelector('.lb-stage');
  var cap = box.querySelector('.lb-cap');
  var count = box.querySelector('.lb-count');
  var closeBtn = box.querySelector('.lb-close');
  var current = -1;
  var lastFocus = null;

  function captionOf(el) {
    var fig = el.closest('figure');
    var fc = fig && fig.querySelector('figcaption');
    if (fc) {
      var c = fc.cloneNode(true);
      Array.prototype.forEach.call(c.querySelectorAll('.clip-tag'), function (t) { t.remove(); });
      var txt = c.textContent.replace(/\s+/g, ' ').trim();
      if (txt) return txt;
    }
    return el.getAttribute('alt') || el.getAttribute('aria-label') || '';
  }

  function render(i) {
    current = (i + items.length) % items.length;
    var src = items[current];
    var media;
    if (src.tagName === 'VIDEO') {
      media = document.createElement('video');
      media.src = src.currentSrc || src.getAttribute('src');
      if (src.poster) media.poster = src.poster;
      media.muted = true; media.loop = true; media.playsInline = true;
      media.setAttribute('playsinline', '');
      if (!reduce) { media.autoplay = true; } else { media.controls = true; }
    } else {
      media = document.createElement('img');
      media.src = src.currentSrc || src.src;
      media.alt = src.alt || '';
    }
    media.className = 'lb-media';
    var bg = getComputedStyle(src).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') media.style.background = bg;
    stage.innerHTML = '';
    stage.appendChild(media);
    if (media.tagName === 'VIDEO' && !reduce) { var p = media.play(); if (p && p.catch) p.catch(function () {}); }
    cap.textContent = captionOf(src);
    count.textContent = (current + 1) + ' / ' + items.length;
  }

  function open(i) {
    lastFocus = document.activeElement;
    render(i);
    box.hidden = false;
    var root = document.documentElement;
    if (!(window.CSS && CSS.supports && CSS.supports('scrollbar-gutter: stable'))) {
      var sb = window.innerWidth - root.clientWidth;
      if (sb > 0) root.style.paddingRight = sb + 'px';
    }
    root.classList.add('lb-lock');
    requestAnimationFrame(function () { box.classList.add('on'); });
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    box.classList.remove('on');
    document.documentElement.classList.remove('lb-lock');
    document.documentElement.style.paddingRight = '';
    var done = function () { box.hidden = true; stage.innerHTML = ''; };
    if (reduce) done(); else setTimeout(done, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  items.forEach(function (el, i) {
    el.classList.add('lb-trigger');
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', (captionOf(el) || '이미지') + ' 크게 보기');
    // 마우스로 누를 때 포커스 이동 때문에 페이지가 스크롤되지 않게
    el.addEventListener('mousedown', function (e) { e.preventDefault(); });
    el.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  closeBtn.addEventListener('click', close);
  box.querySelector('.lb-prev').addEventListener('click', function () { render(current - 1); });
  box.querySelector('.lb-next').addEventListener('click', function () { render(current + 1); });
  box.addEventListener('click', function (e) {
    if (e.target === box || e.target === stage) close();
  });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') render(current - 1);
    else if (e.key === 'ArrowRight') render(current + 1);
    else if (e.key === 'Tab') {
      // 포커스를 라이트박스 안에 가둠
      var f = box.querySelectorAll('button');
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
