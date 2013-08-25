"use strict";
(function () {
    var TILEW = 32;
    var TILEH = 32;
    var w = 1024;
    var h = 768;
    var ballsTexture = PIXI.Texture.fromImage("assets/balls.png");
    var tilesTexture = PIXI.Texture.fromImage("assets/tiles.png");
    var stage = new PIXI.Stage(0x000000, true);
    stage.setInteractive(true);
    var renderer = PIXI.autoDetectRenderer(w, h);
    renderer.view.style.display = "block";

    var ballTextures = [];
    for (var i=0; i<4; ++i)
        ballTextures[i] = new PIXI.Texture(ballsTexture, { x:TILEW*i, y:0, width:TILEW, height:TILEH });

    var tileTextures = [];
    for (var i=0; i<4; ++i)
        tileTextures[i] = new PIXI.Texture(tilesTexture, { x:TILEW*i, y:0, width:TILEW, height:TILEH });

    function getRandomColor() {
        return 1 + Math.floor(2.99*Math.random());
    }

    var clock = new function() {
        var self = this;
        var sprites = [];
        var colors = [];
        var startTime = -1;
        var clockTime = 0;
        var currentColor = 0;

        var container = new PIXI.DisplayObjectContainer();
        stage.addChild(container);

        var arrowSpr = PIXI.Sprite.fromImage("assets/arrow.png");
        arrowSpr.position.x = 0;
        arrowSpr.position.y = 0;
        container.addChild(arrowSpr);

        shuffleColors();

        function shuffleColors() {
            for (var i=0; i<10; ++i) {
                if (sprites[i]) {
                    container.removeChild(sprites[i]);
                    delete sprites[i];
                }
            }

            var color = getRandomColor();
            for (var i=0; i<10; ++i) {
                colors[i] = color;
                if (i & 1) {
                    var newColor;
                    do {
                        newColor = getRandomColor();
                    } while (newColor == color);
                    color = newColor;
                }

                sprites[i] = new PIXI.Sprite(tileTextures[colors[i]]);
                sprites[i].position.x = TILEW;
                sprites[i].position.y = i*TILEH + TILEH/2;
                container.addChild(sprites[i]);
            }
        }

        self.currentColor = function() {
            return colors[currentColor];
        }

        self.update = function(time) {
            container.position.x = w/2 - tiles.w()*TILEW/2 - TILEW*2.5;
            container.position.y = h/2 - tiles.h()*TILEH/2 - TILEH;

            if (startTime < 0)
                startTime = time;

            clockTime = (time - startTime) / 1000.0;
            if (clockTime > 10) {
                clockTime = 0;
                startTime = time;

                shuffleColors();
                tiles.clear();
                player.fillTiles();
                player.resetCombo();
                tiles.regenerate();
            }

            arrowSpr.position.y = clockTime * arrowSpr.height;
            currentColor = Math.floor(clockTime);
            if (currentColor > 9)
                currentColor = 9;
        }

        return self;
    }

    var tiles = new function() {
        var self = this;
        var data_w = 9;
        var data_h = 9;
        var data = [];
        var sprites = [];
        var container = new PIXI.DisplayObjectContainer();
        stage.addChild(container);

        clear();

        var c = 0;
        for (var i=0; i<data_h; ++i) {
            for (var j=0; j<data_w; ++j, ++c) {
                sprites[c] = new PIXI.Sprite(tileTextures[0]);
                sprites[c].position.x = j*TILEW;
                sprites[c].position.y = i*TILEH;
                container.addChild(sprites[c]);
            }
        }

        function clear() {
            for (var i=0; i<data_h; ++i)
                for (var j=0; j<data_w; ++j)
                    data[i*data_w + j] = 0;
        }

        function put(u, v, value) {
            if (u >= 0 && v >= 0 && u < self.w() && v < self.h()) {
                if (value == 0 || data[v*data_w + u] == 0)
                    data[v*data_w + u] = value;
            }
        }

        self.clear = function() {
            clear();
        }
        
        self.update = function(time) {
            container.position.x = w/2 - data_w*TILEW/2;
            container.position.y = h/2 - data_h*TILEH/2;
        }
        self.container = function() {
            return container;
        }
        self.w = function() { return data_w; }
        self.h = function() { return data_h; }
        self.cx = function() { return Math.floor(data_w / 2); }
        self.cy = function() { return Math.floor(data_h / 2); }
        self.getAt = function(u, v) {
            return data[v*data_w + u];
        }
        self.fillPos = function(u, v) {
            put(u, v, 0);
            put((u-1), v, getRandomColor());
            put((u+1), v, getRandomColor());
            put(u, (v-1), getRandomColor());
            put(u, (v+1), getRandomColor());
        }
        self.regenerate = function() {
            var c = 0;
            for (var i=0; i<data_h; ++i) {
                for (var j=0; j<data_w; ++j, ++c) {
                    sprites[c].setTexture(tileTextures[data[c]]);
                }
            }
        }

        return self;
    }

    var player = new function() {
        var self = this;
        var x = 0;
        var y = 0;
        var lastColor = -1;
        var comboCounter = 0;
        var failCounter = 0;
        var ballSprite = new PIXI.Sprite(ballTextures[0]);
        stage.addChild(ballSprite);

        self.pos = function() {
            return ballSprite.position;
        }

        self.fillTiles = function() {
            tiles.fillPos(x+tiles.cx(),
                          y+tiles.cy());
            tiles.regenerate();
        }
        self.update = function(time) {
            ballSprite.setTexture(ballTextures[clock.currentColor()]);
            
            if (ballSprite.position.x == 0) {
                ballSprite.position.x = tiles.container().position.x + (tiles.cx()+x)*TILEW;
                ballSprite.position.y = tiles.container().position.y + (tiles.cy()+y)*TILEH;
            }
        }
        self.up = function() { move(x, y-1); }
        self.down = function() { move(x, y+1); }
        self.left = function() { move(x-1, y); }
        self.right = function() { move(x+1, y); }

        function canMove(u, v) {
            u += tiles.cx();
            v += tiles.cy(); 
            return (u >= 0 && v >= 0 && u < tiles.w() && v < tiles.h());
        }

        function move(u, v) {
            if (canMove(u, v)) {
                x = u;
                y = v;

                new TWEEN.Tween({ x: ballSprite.position.x,
                                  y: ballSprite.position.y })
                .to({ x: tiles.container().position.x + (tiles.cx()+x)*TILEW,
                      y: tiles.container().position.y + (tiles.cy()+y)*TILEH }, 100)
                .onUpdate(function() {
                    ballSprite.position.x = this.x;
                    ballSprite.position.y = this.y;
                })
                .start();

                var color = tiles.getAt(x+tiles.cx(), y+tiles.cy());
                if (clock.currentColor() == color) {
                    if (color == lastColor)
                        comboCounter++;
                    else {
                        comboCounter = 1;
                    }
                    lastColor = color;

                    score.addScore(10 * comboCounter);
                    failCounter = 0;
                }
                else {
                    lastColor = -1;
                    failCounter++;
                    score.removeScore(20 * failCounter);
                }

                self.fillTiles();
            }
        }

        self.resetCombo = function() {
            lastColor = -1;
            comboCounter = 0;
        }

        self.updateByResize = function() {
            tiles.update();
            ballSprite.position.x = tiles.container().position.x + (tiles.cx()+x)*TILEW;
            ballSprite.position.y = tiles.container().position.y + (tiles.cy()+y)*TILEH;
        }

        return self;
    }

    function ScoreDecorator(text, color, pos) {
        var self = this;
        var text;

        text = new PIXI.Text(text, { strokeThickness: 2,
                                     stroke: "#000",
                                     fill: color,
                                     align: "center" });
        text.position.x = pos.x;
        text.position.y = pos.y-TILEH/2;
        stage.addChild(text);
        
        var tween = new TWEEN.Tween({ x: text.position.x,
                                      y: text.position.y })
            .to({ y: text.position.y-TILEH*0.75 }, 250)
            .easing(TWEEN.Easing.Exponential.Out)
            .onUpdate(function() {
                text.position.x = this.x;
                text.position.y = this.y;
            })
            .chain(new TWEEN.Tween({}).to({}, 100)
                   .onComplete(function() {
                       stage.removeChild(text);
                   })) 
            .start();

        return self;
    }

    var score = new function() {
        var self = this;
        var container = new PIXI.DisplayObjectContainer();
        stage.addChild(container);
        var text;
        var score = 0;

        self.addScore = function(bonus) {
            score += bonus;
            new ScoreDecorator("+" + bonus, "#fff", player.pos());
        }

        self.removeScore = function(bonus) {
            score -= bonus;
            new ScoreDecorator("-" + bonus, "#f00", player.pos());
        }
       
        self.update = function(time) {
            if (text) {
                container.removeChild(text);
                text = null;
            }
            text = new PIXI.Text("TIME: " + Math.ceil(10 - (time%10000)/1000) + "\n" +
                                 "SCORE: " + score,
                                 { fill: "#fff" });
            text.position.x = 4;
            text.position.y = 4;
            container.addChild(text);
        }
    }

    function init() {
        Mousetrap.bind('up', up);
        Mousetrap.bind('down', down);
        Mousetrap.bind('left', left);
        Mousetrap.bind('right', right);

        document.body.appendChild(renderer.view);

        player.fillTiles();

        resize();
        requestAnimationFrame(update);
    }

    function resize() {
        w = window.innerWidth - 16;
        h = window.innerHeight - 16;
        player.updateByResize();
        renderer.resize(w, h);
    }

    function update(time) {
        score.update(time);
        clock.update(time);
        tiles.update(time);
        player.update(time);

        renderer.render(stage);
        requestAnimFrame(update);
        TWEEN.update();
    }

    function up() { player.up(); }
    function down() { player.down(); }
    function left() { player.left(); }
    function right() { player.right(); }

    document.addEventListener("DOMContentLoaded", function(event) {
        init();
    });

    resize();
    window.onresize = resize;
    window.onorientationchange = resize;
})();
