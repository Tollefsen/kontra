let { TileEngine, Sprite, GameLoop } = kontra

const tilesWidth = 30;
const tilesHeigth = 30;
const tilesN = tilesWidth * tilesHeigth;
document.querySelector('#canvas').setAttribute('width', tilesWidth * 64);
document.querySelector('#canvas').setAttribute('height', tilesHeigth * 64);
let simplex = new SimplexNoise();
kontra.init();
kontra.initKeys();

const tiles = {
    WOODS_FILLED: 24,
    WOODS_UPPERLEFT: 6,
    WOODS_UPPER: 7,
    WOODS_UPPERRIGHT: 8,
    WOODS_LEFT: 23,
    WOODS_RIGHT: 25,
    WOODS_LOWERLEFT: 40,
    WOODS_LOWER: 41,
    WOODS_LOWERRIGHT: 42,
    '1': {
        FILLED: 24,
        UPPERLEFT: 6,
        UPPER: 7,
        UPPERRIGHT: 8,
        LEFT: 23,
        RIGHT: 25,
        LOWERLEFT: 40,
        LOWER: 41,
        LOWERRIGHT: 42,
        CORNERLOWERLEFT: 10,
        CORNERLOWERRIGHT: 9,
        CORNERUPPERLEFT: 27,
        CORNERUPPERRIGHT: 26,
    },
    '2': {
        FILLED: 24+68,
        UPPERLEFT: 6+68,
        UPPER: 7+68,
        UPPERRIGHT: 8+68,
        LEFT: 23+68,
        RIGHT: 25+68,
        LOWERLEFT: 40+68,
        LOWER: 41+68,
        LOWERRIGHT: 42+68,
        CORNERLOWERLEFT: 10+68,
        CORNERLOWERRIGHT: 9+68,
        CORNERUPPERLEFT: 27+68,
        CORNERUPPERRIGHT: 26+68,
    },
    '4': {
        FILLED: 24-5,
        UPPERLEFT: 6-5,
        UPPER: 7-5,
        UPPERRIGHT: 8-5,
        LEFT: 23-5,
        RIGHT: 25-5,
        LOWERLEFT: 40-5,
        LOWER: 41-5,
        LOWERRIGHT: 42-5,
        CORNERLOWERLEFT: 10-5,
        CORNERLOWERRIGHT: 9-5,
        CORNERUPPERLEFT: 27-5,
        CORNERUPPERRIGHT: 26-5,
    }
}

const tileAbove = t => t < tilesWidth ? 0 : t - tilesWidth;
const tileBelow = t => t > tilesN - tilesWidth ? 0 : t + tilesWidth;
const tileLeftOf = t => t % tilesWidth === 0 ? 0 : t - 1;
const tileRightOf = t => (t+1) % tilesWidth === 0 ? 0 : t + 1;

class GridNode {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.value = 0;
        this.above = null;
        this.below = null;
        this.left = null;
        this.right = null;
    }

    setAbove(above) {
        this.above = above;
    }

    get() {
        return this.value;
    }
}

class Grid {
    constructor(width, heigth) {
        const tempObj = (x, y) => ({
            x: x,
            y: y,
            value: 0,
            above: () => (y > 0) ? this.grid[y-1][x] : null,
            below: () => (y < this.height) ? this.grid[y+1][x] : null,
            left: () => (x > 0) ? this.grid[y][x-1] : null,
            right: () => (x < this.width) ? this.grid[y][x+1] : null,
        })
        this.width = width;
        this.height = heigth;
        this.grid = new Array(heigth).fill(0).map(_ => new Array(width).fill(0));
        this.grid = this.grid.map((y, i) => y.map((x, ind) => x = tempObj(ind, i)));
    }

    get(x, y) {
        return this.grid[y][x];
    }

    set(x, y, value) {
        this.grid[y][x].value = value;
    }

    forEach(func) {
        this.grid.map((y) => y.map((x) => {
            let newObj = x;
            newObj.value = func(x.value);
            return newObj;
        }));
    }

    toArray() {
        return this.grid.reduce((a, c) => a.concat(c), []);
    }

    clear() {
        this.grid = this.grid.map((y, i) => y.map((x, ind) => x = {value: 0, x: ind, y: i}));
    }
}

Grid.fromArray = (width, height, array) => {
    const grid = new Grid(width, height);
    let i = 0;
    grid.forEach((_) => array[i++]);
    return grid;
}

const grid = new Grid(2, 2);
grid.set(1, 0, 1);
grid.forEach((v => v+1));
console.log(grid.get(1, 1).above().value)
console.log(grid.toArray());

class TileMap {
    constructor(width, height, z) {
        this.z = z || 3;
        this.width = width;
        this.height = height;
        this.grid = new Array(width).fill(0).map((_) => new Array(height).fill(0));
        this.current = { x: 0, y: 0, tile: 0}
    }
    setTile(x, y, value) {
        this.grid[x][y] = value;
    }

    noisyfy() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.setTile(x, y, simplex.noise3D(1+y / 10, 1+x / 10, this.z / 10))
            }
        }
    }

    normalize() {
        const flatmap = this.getMap();
        const average = flatmap.reduce((a,c) => a + c, 0) / (this.width * this.height);
        console.log(average, 'average')
        //const max = Math.max(flatmap)
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                (this.grid[x][y] >= average) ? this.setTile(x, y, 1) : this.setTile(x, y, 0)
                
            }
        }
    }

    removeBorder() {
        for (let x = 0; x < this.width; x++) {
            this.setTile(x, 0, 0);
            this.setTile(x, this.height-1, 0);        
        }
        for (let y = 0; y < this.height; y++) {
            this.setTile(0, y, 0);
            this.setTile(this.width-1, y, 0);        
        }
    }



    gameOfLife() {
        let runAgain = true;
        while(runAgain) {
            runAgain = false;
            for (let x = 1; x < this.width -1; x++) {
                for (let y = 1; y < this.height-1; y++) {
                    if(this.grid[x][y] === 0) continue;
                    if(this.grid[x-1][y] === 0 && this.grid[x+1][y] === 0) {
                        this.setTile(x, y, 0);
                        runAgain = true;
                    }
                    if(this.grid[x][y-1] === 0 && this.grid[x][y+1] === 0) {
                        this.setTile(x, y, 0);
                        runAgain = true;
                    }
                    if(this.grid[x-1][y-1] === 0 && this.grid[x+1][y+1] === 0) {
                        this.setTile(x, y, 0);
                        runAgain = true;
                    }
                    if(this.grid[x+1][y-1] === 0 && this.grid[x-1][y+1] === 0) {
                        this.setTile(x, y, 0);
                        runAgain = true;
                    }
                }
            }
        }
    }


    getMap() {
        return this.grid.reduce((a, c) => a.concat(c), []);
    }

    tile() {
        const setTile = (x, y, value) => this.setTile(x-1, y-1, value);
        const allAdjecentGround = (grid, x, y) => grid[x-1][y] === 1 && grid[x+1][y] === 1 && grid[x][y+1] === 1 && grid[x][y-1] === 1
        let grid = new Array(1).fill(1).concat(this.grid);
        grid.push(new Array(1).fill(1));
        grid = grid.map(e => {
            if (e.length === 1) {
                e = e.concat(new Array(24).fill)
            }
            e = [1].concat(e);
            e.push(1);
            return e;
        })
        for (let x = 1; x < this.width+1; x++) {
            for (let y = 1; y < this.height+1; y++) {
                if (grid[x][y] === 0) continue;
                let tileSet = false;
                if(grid[x][y-1] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].LEFT);
                }
                if(grid[x][y+1] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].RIGHT);
                }
                if(grid[x-1][y] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].UPPER);
                }
                if(grid[x+1][y] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].LOWER);
                }
                if(grid[x-1][y-1] === 0 && grid[x][y-1] === 0 && grid[x-1][y] === 0 && grid[x][y] === 1 ) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].UPPERLEFT);
                }
                if(grid[x-1][y] === 0 && grid[x-1][y+1] === 0 && grid[x][y+1] === 0 && grid[x][y] === 1 ) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].UPPERRIGHT);
                }
                if(grid[x][y-1] === 0 && grid[x+1][y-1] === 0 && grid[x+1][y] === 0 && grid[x][y] === 1 ) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].LOWERLEFT);
                }
                if(grid[x][y+1] === 0 && grid[x+1][y] === 0 && grid[x+1][y+1] === 0 && grid[x][y] === 1 ) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].LOWERRIGHT);
                }
                if(allAdjecentGround(grid, x, y) && grid[x-1][y-1] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].CORNERUPPERLEFT);
                }
                if(allAdjecentGround(grid, x, y) && grid[x-1][y+1] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].CORNERUPPERRIGHT);
                }
                if(allAdjecentGround(grid, x, y) && grid[x+1][y+1] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].CORNERLOWERRIGHT);
                }
                if(allAdjecentGround(grid, x, y) && grid[x+1][y-1] === 0 && grid[x][y] === 1) {
                    tileSet = true;
                    setTile(x, y, tiles[grid[x][y]].CORNERLOWERLEFT);
                }
                if(!tileSet) setTile(x, y, tiles[grid[x][y]].FILLED);
                
            }
        }
    }
}


let map = new TileMap(tilesWidth, tilesHeigth);
map.noisyfy();
map.normalize();
//map.removeBorder();
map.gameOfLife();
map.tile();

let z = 0;
const updateMap = () => {
    map = new TileMap(tilesWidth, tilesHeigth, z++)
    map.noisyfy();
    map.normalize();
    map.gameOfLife();
    map.tile();
}

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
    width: tilesWidth,
    height: tilesHeigth,

    // tileset object
    tilesets: [{
      firstgid: 1,
      image: img
    }],

    // layer object
    layers: [
        {
            name: 'sea',
            data: new Array(tilesN).fill(204)
        },
        {
            name: 'ground',
            data: map.getMap()
        }
    ]
  });
}

let loop = kontra.GameLoop({
    update: function(dt) {
        timePassed += 1;
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
        if (timePassed % 30 === 0) {
            updateMap();
            tileEngine.setLayer('ground', map.getMap());
        }
        if (timePassed % 300 === 0) {
            console.log(tileEngine.layers[1])
        }
    },
    render: function() {
        tileEngine.render();
    }
})
loop.start();
loop.stop();

