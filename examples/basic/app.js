(function() {
  'use strict';
  var thr0w = window.thr0w;
  document.addEventListener('DOMContentLoaded', ready);
  function ready() {
    var frameEl = document.getElementById('my_frame');
    thr0w.setBase('http://localhost');
    thr0w.addAdminTools(frameEl,
      connectCallback, messageCallback);
    function connectCallback() {
      var svgEl = document.getElementById('my_svg');
      var grid = new thr0w.Grid(
        frameEl,
        document.getElementById('my_content'), [
          [0, 1, 2]
        ]);
      // MANAGES THE SVG ACROSS THE GRID WITH
      // MAXIMUM ZOOM OF 10 TIMES
      new thr0w.svg.Svg(grid, svgEl, 10);
    }
    function messageCallback() {}
  }
})();
