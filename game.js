(function () {
    var TILEW = 32;
    var TILEH = 32;
    var w = 1024;
    var h = 768;
    var ballsTexture = PIXI.Texture.fromImage("assets/balls.png");
    var tilesTexture = PIXI.Texture.fromImage("assets/tiles.png");
    var stage = new PIXI.Stage(0x000000, true);
    var renderer = PIXI.autoDetectRenderer(w, h);
    renderer.view.style.display = "block";

    var score = new function() {
        var self = this;
        var container = new PIXI.DisplayObjectContainer();
        stage.addChild(container);
        var text;
        var score = 0;

        self.addScore = function(bonus) {
            score += bonus;
        }

        self.removeScore = function(bonus) {
            score -= bonus;
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

    var clock = new function() {
        var self = this;
        var sprites = [];
        var colors = [];

        var container = new PIXI.DisplayObjectContainer();
        stage.addChild(container);

        var arrowSpr = PIXI.Sprite.fromImage("assets/arrow.png");
        arrowSpr.position.x = 0;
        arrowSpr.position.y = 0;
        container.addChild(arrowSpr);

        for (var i=0; i<10; ++i) {
            colors[i] = 1 + Math.floor(2.99*Math.random());

            sprites[i] = new PIXI.Sprite(new PIXI.Texture(tilesTexture, { x:TILEW*colors[i], y:0, width:TILEW, height:TILEH }));
            sprites[i].position.x = TILEW;
            sprites[i].position.y = i*TILEH+TILEH/2;
            container.addChild(sprites[i]);
        }

        self.currentColor = function() {
            var i = Math.floor(arrowSpr.position.y / TILEH);
            return colors[i];
        }

        self.update = function(time) {
            container.position.x = w/2 - tiles.w()*TILEW/2 - TILEW*2.5;
            container.position.y = h/2 - tiles.h()*TILEH/2 - TILEH;

            arrowSpr.position.y = ((time % 10000) / 1000) * arrowSpr.height;
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
            put((u-1), v, 1 + Math.floor(2.99*Math.random()));
            put((u+1), v, 1 + Math.floor(2.99*Math.random()));
            put(u, (v-1), 1 + Math.floor(2.99*Math.random()));
            put(u, (v+1), 1 + Math.floor(2.99*Math.random()));
        }
        self.regenerate = function() {
            for (var i=0; i<sprites.length; ++i) {
                if (sprites[i]) {
                    sprites[i].parent.removeChild(sprites[i]);
                    delete sprites[i];
                }
            }

            var c = 0;
            for (var i=0; i<data_h; ++i) {
                for (var j=0; j<data_w; ++j, ++c) {
                    var t = data[i*data_w + j];
                    if (t) {
                        sprites[c] = new PIXI.Sprite(new PIXI.Texture(tilesTexture, { x:TILEW*t, y:0, width:TILEW, height:TILEH }));
                        sprites[c].position.x = j*TILEW;
                        sprites[c].position.y = i*TILEH;
                        container.addChild(sprites[c]);
                    }
                }
            }
        }

        return self;
    }

    var player = new function() {
        var self = this;
        var x = 0;
        var y = 0;
        var ballTextures = [];
        for (var i=0; i<4; ++i)
            ballTextures[i] = new PIXI.Texture(ballsTexture, { x:TILEW*i, y:0, width:TILEW, height:TILEH });

        var ballSprite = new PIXI.Sprite(ballTextures[0]);
        stage.addChild(ballSprite);

        self.fillTiles = function() {
            tiles.fillPos(x+tiles.cx(),
                          y+tiles.cy());
            tiles.regenerate();
        }
        self.update = function(time) {
            ballSprite.setTexture(ballTextures[clock.currentColor()]);
            
            ballSprite.position.x = tiles.container().position.x + (tiles.cx()+x)*TILEW;
            ballSprite.position.y = tiles.container().position.y + (tiles.cy()+y)*TILEH;
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

                var color = tiles.getAt(x+tiles.cx(), y+tiles.cy());
                if (clock.currentColor() == color)
                    score.addScore(10);
                else
                    score.removeScore(20);

                self.fillTiles();
            }
        }

        return self;
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
        w = $(window).width() - 16;
        h = $(window).height() - 16;
        renderer.resize(w, h);
    }

    function update(time) {
        score.update(time);
        clock.update(time);
        tiles.update(time);
        player.update(time);

        renderer.render(stage);
        requestAnimFrame(update);
    }

    function up() { player.up(); }
    function down() { player.down(); }
    function left() { player.left(); }
    function right() { player.right(); }

    $(init);
    resize();
    $(window).resize(resize);
    window.onorientationchange = resize;
})();
