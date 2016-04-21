(function() {
  // jscs:disable
  /**
  * This module provides tools to manage SVGs.
  * @module thr0w-svg
  */
  // jscs:enable
  'use strict';
  if (window.thr0w === undefined) {
    throw 400;
  }
  var INTERVAL = 33;
  var service = {};
  service.Svg = Svg;
  // jscs:disable
  /**
  * This object provides SVG management functionality.
  * @namespace thr0w
  * @class svg
  * @static
  */
  // jscs:enable
  window.thr0w.svg = service;
  // jscs:disable
  /**
  * This class is used to manage SVGs.
  * @namespace thr0w.svg
  * @class Svg
  * @constructor
  * @param grid {Object} The grid, {{#crossLink "thr0w.Grid"}}thr0w.Grid{{/crossLink}}, object.
  * @param svg {Object} The SVG DOM object.
  * @param max {Integer} The maximum zoom factor.
  */
  // jscs:enable
  function Svg(grid, svgEl, max) {
    if (!grid || typeof grid !== 'object') {
      throw 400;
    }
    if (!svgEl || typeof svgEl !== 'object') {
      throw 400;
    }
    if (max === undefined || typeof max !== 'number' || max < 1) {
      throw 400;
    }
    var frameEl = grid.getFrame();
    var contentEl = grid.getContent();
    var svgElWidth = grid.getWidth();
    var svgElHeight = grid.getHeight();
    var scale = grid.getRowScale();
    var frameOffsetLeft = frameEl.offsetLeft;
    var contentLeft = grid.frameXYToContentXY([0,0])[0];
    var frameOffsetTop = frameEl.offsetTop;
    var contentTop = grid.frameXYToContentXY([0,0])[1];
    var palatteEl = document.createElement('div');
    var zoomAnimationInterval = null;
    var moveAnimationInterval = null;
    var syncing = false;
    var iAmSyncing = false;
    var animationSyncing = false;
    var iAmAnimationSyncing = false;
    var nextMove = false;
    var nextMoveDuration;
    var nextMoveX;
    var nextMoveY;
    var nextMoveZ;
    this.moveTo = moveTo;
    this.moveStop = moveStop;
    palatteEl.classList.add('thr0w_svg_palette');
    // jscs:disable
    palatteEl.innerHTML = [
      '<div class="thr0w_svg_palette__row">',
      '<div class="thr0w_svg_palette__row__cell thr0w_svg_palette__row__cell--plus">+</div>',
      '</div>',
      '<div class="thr0w_svg_palette__row">',
      '<div class="thr0w_svg_palette__row__cell thr0w_svg_palette__row__cell--minus">-</div>',
      '</div>'
    ].join('\n');
    // jscs:enable
    contentEl.appendChild(palatteEl);
    var svgViewBox = svgEl.getAttribute('viewBox').split(' ');
    var svgWidth = svgViewBox[2];
    var svgHeight = svgViewBox[3];
    var factorX = svgWidth / svgElWidth;
    var factorY = svgHeight / svgElHeight;
    var scaledSvgWidth = factorX < factorY ? Math.floor(svgHeight *
      svgElWidth / svgElHeight) : svgWidth;
    var scaledSvgHeight = factorY < factorX ? Math.floor(svgWidth *
      svgElHeight / svgElWidth) : svgHeight;
    var left = 0;
    var top = 0;
    var width = scaledSvgWidth;
    var height = scaledSvgHeight;
    var zoomLevel = 1;
    var touchOneLastX;
    var touchOneLastY;
    var touchTwoLastX;
    var touchTwoLastY;
    var mouseLastX;
    var mouseLastY;
    var mousePanning = false;
    var handPanning = false;
    var sync = new window.thr0w.Sync(
      grid,
      'thr0w_svg_' + contentEl.id,
      message,
      receive
    );
    var animationSync = new window.thr0w.Sync(
      grid,
      'thr0w_svg_animation_' + contentEl.id,
      message,
      receive,
      true
    );
    var oobSync = new window.thr0w.Sync(
      grid,
      'thr0w_svg_oob_' + contentEl.id,
      messageOob,
      receiveOob
    );
    svgEl.addEventListener('mousedown', handleMouseDown);
    svgEl.addEventListener('mousemove', handleMouseMove);
    svgEl.addEventListener('mouseup', handleMouseEnd);
    svgEl.addEventListener('mouseleave', handleMouseEnd);
    svgEl.addEventListener('touchstart', handleTouchStart);
    svgEl.addEventListener('touchmove', handleTouchMove);
    svgEl.addEventListener('touchend', handleTouchEnd);
    svgEl.addEventListener('touchcancel', handleTouchEnd);
    palatteEl.querySelector('.thr0w_svg_palette__row__cell--plus')
      .addEventListener('click', zoomIn);
    palatteEl.querySelector('.thr0w_svg_palette__row__cell--minus')
      .addEventListener('click', zoomOut);
    setSVGViewBox(left, top, width, height);
    // jscs:disable
    /**
    * This method will animate zoom and then move the SVG.
    * @method moveTo
    * @param duration {Integer} The maximum number of milliseconds for each zoom / move.
    * @param x {Number} The horizontal center position.
    * @param y {Number} The vertical center position.
    * @param z {Number} Optional zoom level.
    */
    // jscs:enable
    function moveTo(duration, x, y, z) {
      if (duration !== parseInt(duration)) {
        throw 400;
      }
      if (x === undefined || typeof x !== 'number') {
        throw 400;
      }
      if (y === undefined || typeof y !== 'number') {
        throw 400;
      }
      if (z === undefined) {
        z = zoomLevel;
      }
      if (typeof z !== 'number') {
        throw 400;
      }
      var zoomIncrement;
      var zoomTime;
      var zoomAnimationTime = 0;
      if (syncing) {
        if (iAmSyncing) {
          iAmSyncing = false;
          sync.idle();
        }
        syncing = false;
        oobSync.update();
        oobSync.idle();
      }
      if (animationSyncing) {
        if (iAmAnimationSyncing) {
          clearAnimation();
        } else {
          nextMove = true;
          nextMoveDuration = duration;
          nextMoveX = x;
          nextMoveY = y;
          nextMoveZ = z;
          oobSync.update();
          oobSync.idle();
          return;
        }
      }
      iAmAnimationSyncing = true;
      animationSyncing = true;
      oobSync.update();
      oobSync.idle();
      z = Math.max(Math.min(z, max), 1);
      zoomTime = Math.floor(duration *
        Math.abs(z - zoomLevel) / (max - 1));
      zoomIncrement = zoomTime !== 0 ?
        (z - zoomLevel) / (zoomTime / INTERVAL) : 0;
      zoomAnimationInterval = window.setInterval(zoomAnimation, INTERVAL);
      function zoomAnimation() {
        zoomAnimationTime += INTERVAL;
        if (zoomAnimationTime > zoomTime) {
          window.clearInterval(zoomAnimationInterval);
          zoomAnimationInterval = null;
          zoom(z);
          animationSync.update();
          move();
        } else {
          zoom(zoomLevel + zoomIncrement);
          animationSync.update();
        }
      }
      function move() {
        var newLeft;
        var newTop;
        var moveTimeLeft;
        var moveTimeTop;
        var moveTime;
        var moveIncrementLeft;
        var moveIncrementTop;
        var moveAnimationTime = 0;
        newLeft = x - width / 2;
        newLeft = newLeft >= 0 ? newLeft : 0;
        newLeft = newLeft <= scaledSvgWidth - width ?
          newLeft : scaledSvgWidth - width;
        newTop = y - height / 2;
        newTop = newTop >= 0 ? newTop : 0;
        newTop = newTop <= scaledSvgHeight - height ?
          newTop : scaledSvgHeight - height;
        moveTimeLeft = scaledSvgWidth - width !== 0 ? Math.floor(duration *
          Math.abs(newLeft - left) / (scaledSvgWidth - width)) : 0;
        moveTimeTop = scaledSvgHeight - height !== 0 ? Math.floor(duration *
          Math.abs(newTop - top) / (scaledSvgHeight - height)) : 0;
        moveTime = Math.max(moveTimeLeft, moveTimeTop);
        moveIncrementLeft = moveTime !== 0 ?
          (newLeft - left) / (moveTime / INTERVAL) : 0;
        moveIncrementTop = moveTime !== 0 ?
          (newTop - top) / (moveTime / INTERVAL) : 0;
        moveAnimationInterval = window.setInterval(moveAnimation, INTERVAL);
        function moveAnimation() {
          moveAnimationTime += INTERVAL;
          if (moveAnimationTime > moveTime) {
            window.clearInterval(moveAnimationInterval);
            moveAnimationInterval = null;
            left = newLeft;
            top = newTop;
            setSVGViewBox(left, top, width, height);
            animationSync.update();
            animationSync.idle();
            iAmAnimationSyncing = false;
            animationSyncing = false;
            oobSync.update();
            oobSync.idle();
          } else {
            left += moveIncrementLeft;
            top += moveIncrementTop;
            setSVGViewBox(left, top, width, height);
            animationSync.update();
          }
        }
      }
    }
    // jscs:disable
    /**
    * This method will stop active SVG animations.
    * @method moveStop
    */
    // jscs:enable
    function moveStop() {
      if (animationSyncing) {
        if (iAmAnimationSyncing) {
          iAmAnimationSyncing = false;
          clearAnimation();
          animationSync.idle();
        }
        animationSyncing = false;
        oobSync.update();
        oobSync.idle();
      }
    }
    function message() {
      return {
        left: left,
        top: top,
        width: width,
        height: height,
        zoomLevel: zoomLevel
      };
    }
    function receive(data) {
      left = data.left;
      top = data.top;
      width = data.width;
      height = data.height;
      zoomLevel = data.zoomLevel;
      setSVGViewBox(left, top, width, height);
    }
    function messageOob() {
      return {
        syncing: syncing,
        animationSyncing: animationSyncing,
        nextMove: nextMove,
        nextMoveDuration: nextMoveDuration,
        nextMoveX: nextMoveX,
        nextMoveY: nextMoveY,
        nextMoveZ: nextMoveZ
      };
    }
    function receiveOob(data) {
      syncing = data.syncing;
      animationSyncing = data.animationSyncing;
      if (iAmSyncing && !syncing) {
        iAmSyncing = false;
        sync.idle();
      }
      if (iAmAnimationSyncing && !animationSyncing) {
        iAmAnimationSyncing = false;
        clearAnimation();
        animationSync.idle();
      }
      if (iAmAnimationSyncing && data.nextMove) {
        moveTo(data.nextMoveDuration, data.nextMoveX,
          data.nextMoveY, data.netMoveZ);
      }
    }
    function handleMouseDown(e) {
      mousePanning = true;
      mouseLastX = (e.pageX - frameOffsetLeft) * scale + contentLeft;
      mouseLastY = (e.pageY - frameOffsetTop) * scale + contentTop;
      sync.update();
      iAmSyncing = true;
      syncing = true;
      oobSync.update();
      oobSync.idle();
    }
    function handleMouseMove(e) {
      if (iAmSyncing && mousePanning) {
        var mouseCurrentX = (e.pageX - frameOffsetLeft) * scale + contentLeft;
        var mouseCurrentY = (e.pageY - frameOffsetTop) * scale + contentTop;
        var shiftX;
        var shiftY;
        shiftX = -1 * (mouseCurrentX - mouseLastX) *
          (scaledSvgWidth / svgElWidth) / zoomLevel;
        shiftY = -1 * (mouseCurrentY - mouseLastY) *
          (scaledSvgHeight / svgElHeight) / zoomLevel;
        pan(shiftX, shiftY);
        mouseLastX = mouseCurrentX;
        mouseLastY = mouseCurrentY;
        sync.update();
      }
    }
    function handleMouseEnd() {
      if (iAmSyncing && mousePanning) {
        sync.idle();
        iAmSyncing = false;
        syncing = false;
        oobSync.update();
        oobSync.idle();
      }
    }
    function handleTouchStart(e) {
      touchOneLastX = (e.touches[0].pageX - frameOffsetLeft) *
        scale + contentLeft;
      touchOneLastY = (e.touches[0].pageY - frameOffsetTop) *
        scale + contentTop;
      if (e.touches.length > 2) {
        handPanning = true;
      }
      if (e.touches.length === 2) {
        touchTwoLastX = (e.touches[1].pageX - frameOffsetLeft) *
          scale + contentLeft;
        touchTwoLastY = (e.touches[1].pageY - frameOffsetTop) *
          scale + contentTop;
      }
      if (e.touches.length === 1) {
        handPanning = false;
        sync.update();
        iAmSyncing = true;
        syncing = true;
        oobSync.update();
        oobSync.idle();
      }
    }
    function handleTouchMove(e) {
      var touchOneCurrentX = (e.touches[0].pageX - frameOffsetLeft) *
        scale + contentLeft;
      var touchOneCurrentY = (e.touches[0].pageY - frameOffsetTop) *
        scale + contentTop;
      var touchTwoCurrentX;
      var touchTwoCurrentY;
      var touchLeftLast;
      var touchLeftCurrent;
      var touchRightLast;
      var touchRightCurrent;
      var touchTopLast;
      var touchTopCurrent;
      var touchBottomLast;
      var touchBottomCurrent;
      var shiftX;
      var shiftY;
      var newWidth;
      var newHeight;
      var leftPosition;
      var topPosition;
      var touchRadiusCurrent;
      var touchRadiusLast;
      if (iAmSyncing) {
        if (!handPanning && e.touches.length === 2) {
          touchTwoCurrentX = (e.touches[1].pageX - frameOffsetLeft) *
            scale + contentLeft;
          touchTwoCurrentY = (e.touches[1].pageY - frameOffsetTop) *
            scale + contentTop;
          // DECIDING LEFT - RIGHT - TOP - BOTTOM
          if (touchOneCurrentX < touchTwoCurrentX) {
            touchLeftLast = touchOneLastX;
            touchLeftCurrent = touchOneCurrentX;
            touchRightLast = touchTwoLastX;
            touchRightCurrent = touchTwoCurrentX;
          } else {
            touchLeftLast = touchTwoLastX;
            touchLeftCurrent = touchTwoCurrentX;
            touchRightLast = touchOneLastX;
            touchRightCurrent = touchOneCurrentX;
          }
          if (touchOneCurrentY < touchTwoCurrentY) {
            touchTopLast = touchOneLastY;
            touchTopCurrent = touchOneCurrentY;
            touchBottomLast = touchTwoLastY;
            touchBottomCurrent = touchTwoCurrentY;
          } else {
            touchTopLast = touchTwoLastY;
            touchTopCurrent = touchTwoCurrentY;
            touchBottomLast = touchOneLastY;
            touchBottomCurrent = touchOneCurrentY;
          }
          // SHIFTING LEFT AND TOP BASED ON LAST ZOOM
          shiftX = -1 * (touchLeftCurrent - touchLeftLast) *
            (scaledSvgWidth / svgElWidth) / zoomLevel;
          shiftY = -1 * (touchTopCurrent - touchTopLast) *
            (scaledSvgWidth / svgElWidth) / zoomLevel;
          left += shiftX;
          top += shiftY;
          // CALCULATING ZOOM
          touchRadiusLast = Math.floor(Math.sqrt(
            Math.pow(touchLeftLast - touchRightLast, 2) +
            Math.pow(touchTopLast - touchBottomLast, 2)
          ));
          touchRadiusCurrent = Math.floor(Math.sqrt(
            Math.pow(touchLeftCurrent - touchRightCurrent, 2) +
            Math.pow(touchTopCurrent - touchBottomCurrent, 2)
          ));
          zoomLevel = Math.max(
            Math.min(
              zoomLevel * touchRadiusCurrent / touchRadiusLast,
              max
            ),
            1
          );
          newWidth = scaledSvgWidth / zoomLevel;
          newHeight = scaledSvgHeight / zoomLevel;
          // SHIFTING LEFT AND TOP BASED ON CURRENT ZOOM
          leftPosition = touchLeftCurrent / svgElWidth * width;
          left = leftPosition + left - leftPosition * newWidth / width;
          topPosition = touchTopCurrent / svgElHeight * height;
          top = topPosition + top - topPosition * newHeight / height;
          width = newWidth;
          height = newHeight;
          // KEEPING LEFT AND TOP IN BOUNDS
          left = Math.max(left, 0);
          left = Math.min(left, scaledSvgWidth - width);
          top = Math.max(top, 0);
          top = Math.min(top, scaledSvgHeight - height);
          // FINISH
          setSVGViewBox(left, top, width, height);
          touchTwoLastX = touchTwoCurrentX;
          touchTwoLastY = touchTwoCurrentY;
        } else {
          shiftX = -1 * (touchOneCurrentX - touchOneLastX) *
            (scaledSvgWidth / svgElWidth) / zoomLevel;
          shiftY = -1 * (touchOneCurrentY - touchOneLastY) *
            (scaledSvgHeight / svgElHeight) / zoomLevel;
          pan(shiftX, shiftY);
        }
        touchOneLastX = touchOneCurrentX;
        touchOneLastY = touchOneCurrentY;
        sync.update();
      }
    }
    function handleTouchEnd(e) {
      if (iAmSyncing) {
        if (e.touches.length === 1) {
          touchOneLastX = (e.touches[0].pageX - frameOffsetLeft) *
            scale + contentLeft;
          touchOneLastY = (e.touches[0].pageY - frameOffsetTop) *
            scale + contentTop;
        }
        if (e.touches.length === 0) {
          sync.idle();
          iAmSyncing = false;
          syncing = false;
          oobSync.update();
          oobSync.idle();
        }
      }
    }
    function clearAnimation() {
      if (zoomAnimationInterval) {
        window.clearInterval(zoomAnimationInterval);
        zoomAnimationInterval = null;
      }
      if (moveAnimationInterval) {
        window.clearInterval(moveAnimationInterval);
        moveAnimationInterval = null;
      }
    }
    function zoomIn() {
      zoom(zoomLevel + 0.5);
      sync.update();
      sync.idle();
    }
    function zoomOut() {
      zoom(zoomLevel - 0.5);
      sync.update();
      sync.idle();
    }
    function pan(shiftX, shiftY) {
      if (shiftX >= 0) {
        left = left + shiftX <= scaledSvgWidth - width ?
          left + shiftX : scaledSvgWidth - width;
      } else {
        left = left + shiftX > 0 ? left + shiftX : 0;
      }
      if (shiftY >= 0) {
        top = top + shiftY <= scaledSvgHeight - height ?
          top + shiftY :  scaledSvgHeight - height;
      } else {
        top = top + shiftY > 0 ? top + shiftY : 0;
      }
      setSVGViewBox(left, top, width, height);
    }
    function zoom(factor) {
      var centerX = left + width / 2;
      var centerY = top + height / 2;
      zoomLevel = Math.max(Math.min(factor, max), 1);
      width = scaledSvgWidth / zoomLevel;
      height = scaledSvgHeight / zoomLevel;
      left = Math.max(centerX - width / 2, 0);
      left = Math.min(left, scaledSvgWidth - width);
      top = Math.max(centerY - height / 2, 0);
      top = Math.min(top, scaledSvgHeight - height);
      setSVGViewBox(left, top, width, height);
    }
    function setSVGViewBox(newLeft, newTop, newWidth, newHeight) {
      window.requestAnimationFrame(animation);
      function animation() {
        svgEl.setAttribute('viewBox', newLeft + ' ' + newTop +
          ' ' + newWidth + ' ' + newHeight);
      }
    }
  }
})();
