let { TileEngine, Sprite, GameLoop } = kontra
kontra.init();
kontra.initKeys();

let charPos = {
    row: 4,
    col: 4
}
let timePassed = 0;
const CHAR_TILE = 169;

let img = new Image();
img.src = 'assets/imgs/mapPack_tilesheet.png';
let tileEngine;
img.onload = function() {
  tileEngine = TileEngine({
    // tile size
    tilewidth: 64,
    tileheight: 64,

    // map size in tiles
    width: 9,
    height: 9,

    // tileset object
    tilesets: [{
      firstgid: 1,
      image: img
    }],

    // layer object
    layers: [{
      name: 'ground',
      data: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,
              0,  0,  6,  7,  7,  8,  0,  0,  0,
              0,  6,  27, 24, 24, 25, 0,  0,  0,
              0,  23, 24, 24, 24, 26, 8,  0,  0,
              0,  23, 24, 24, 24, 24, 26, 8,  0,
              0,  23, 24, 24, 24, 24, 24, 25, 0,
              0,  40, 41, 41, 10, 24, 24, 25, 0,
              0,  0,  0,  0,  40, 41, 41, 42, 0,
              0,  0,  0,  0,  0,  0,  0,  0,  0 ]
    },{
        name: 'char',
        data: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0, 0, 0, CHAR_TILE, 0, 0, 0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0 ],
    },{
        name: 'collisions',
        data: [ 0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0, 112,  0,  44,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  43,  0,  0,  0,
            0,  0, 43, 0, 0, 0, 0, 0,  0,
            0,  0,  0,  44,  0,  0,  48,  0,  0,
            0,  0,  0,  0,  44,  40,  42,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0,
            0,  0,  0,  0,  0,  0,  0,  0,  0 ],
    }]
  });
}

let loop = kontra.GameLoop({
    update: function(dt) {
        timePassed += 1/60;
        let newCharPos = charPos;
        if (kontra.keyPressed('right') && timePassed > 0.25) {
            timePassed = 0;
            newCharPos = { row: charPos.row, col: charPos.col + 1 };
        }
        if (kontra.keyPressed('left') && timePassed > 0.25) {
            timePassed = 0;
            newCharPos = { row: charPos.row, col: charPos.col - 1 };
        }
        if (kontra.keyPressed('up') && timePassed > 0.25) {
            timePassed = 0;
            newCharPos = { row: charPos.row - 1, col: charPos.col };
        }
        if (kontra.keyPressed('down') && timePassed > 0.25) {
            timePassed = 0;
            newCharPos = { row: charPos.row + 1, col: charPos.col };
        }
        if (tileEngine.tileAtLayer('collisions', newCharPos) === 0 && tileEngine.tileAtLayer('ground', newCharPos) !== 0) {
            tileEngine.setTileAtLayer('char', charPos, 0);
            charPos = newCharPos;
            tileEngine.setTileAtLayer('char', newCharPos, CHAR_TILE);
        }
    },
    render: function() {
        tileEngine.render();
    }
})
loop.start();