(function() {
  

$('.labels.vertical').each(function (i, item) {
  var labelsHtml = '';
  for (var i = 1, size = 19; i <= size; i += 1) {
    labelsHtml += '<b><br>' + i + '</br></b>';
  }
  $(this).html(labelsHtml);
});

$('.labels.horizontal').each(function (i, item) {
  var labels = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
  var labelsHtml = '';
  for (var i = 0, size = 19; i < size; i += 1) {
    labelsHtml += '<b>' + labels.substring(i, i + 1) + '</b>';
  }
  $(this).html(labelsHtml);
});


  var GoBoard, GoCell, GoControls, GoGame, GoPlayers, GoStone, MoveBranch, TreeView,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  GoBoard = (function() {
    function GoBoard(id, game) {
      this.handleClick = bind(this.handleClick, this);
      this.$el = $("" + id);
      this.size = this.$el.children().length;
      this.$el.on('click', this.handleClick);
      this.game = game;
      this.cells = [];
      this.states = [];
      this.buildCells();
    }

    GoBoard.prototype.handleClick = function(e) {
      var $t;
      $t = $(e.target);
      if (!(($t.data('x') != null) && ($t.data('y') != null))) {
        return;
      }
      return this.game.handleClick($t.data('x'), $t.data('y'));
    };

    GoBoard.prototype.addCell = function(c) {
      if (!this.cells[c.x]) {
        this.cells[c.x] = [];
      }
      return this.cells[c.x][c.y] = c;
    };

    GoBoard.prototype.buildCells = function() {
      var c, cell, i, len, ref, results;
      ref = this.$el.find(".cell");
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        c = new GoCell($(cell).data('x'), $(cell).data('y'), this);
        results.push(this.addCell(c));
      }
      return results;
    };

    GoBoard.prototype.isEmpty = function(x, y) {
      return this.cells[x][y].isEmpty();
    };

    GoBoard.prototype.updateColor = function() {
      this.$el.removeClass(this.game.currentColor());
      return this.$el.addClass(this.game.nextColor());
    };

    GoBoard.prototype.removeStone = function(stone) {
      var ref, ref1;
      return (ref = this.cells[stone.x]) != null ? (ref1 = ref[stone.y]) != null ? ref1.removeStone() : void 0 : void 0;
    };

    GoBoard.prototype.addStone = function(stone) {
      var captures, cell, state;
      cell = this.cells[stone.x][stone.y];
      captures = cell.opponentGroupCaptures(stone.color);
      if (cell.addStone(stone)) {
        state = this.encodeState();
        if (this.game.move_tree.stateArray().indexOf(state) === -1) {
          return {
            captures: captures,
            state: state
          };
        } else {
          cell.removeStone();
          this.freeCaptures(captures);
          return false;
        }
      } else {
        return false;
      }
    };

    GoBoard.prototype.freeCaptures = function(captures) {
      var i, len, ref, ref1, results, stone;
      results = [];
      for (i = 0, len = captures.length; i < len; i++) {
        stone = captures[i];
        results.push((ref = this.cells[stone.x]) != null ? (ref1 = ref[stone.y]) != null ? ref1.addStone(stone) : void 0 : void 0);
      }
      return results;
    };

    GoBoard.prototype.encodeState = function() {
      var row;
      return ((function() {
        var i, len, ref, results;
        ref = this.cells;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          row = ref[i];
          results.push(parseInt(row.map(function(cell) {
            return cell.state();
          }).join(''), 3).toString(36));
        }
        return results;
      }).call(this)).join(',');
    };

    GoBoard.prototype.state = function() {
      var cell, i, j, len, len1, ref, row, s;
      s = [];
      ref = this.cells;
      for (i = 0, len = ref.length; i < len; i++) {
        row = ref[i];
        for (j = 0, len1 = row.length; j < len1; j++) {
          cell = row[j];
          s.push(cell.state());
        }
      }
      return s;
    };

    GoBoard.prototype.cellArray = function() {
      var cell, cells, i, j, len, len1, ref, row;
      cells = [];
      ref = this.cells;
      for (i = 0, len = ref.length; i < len; i++) {
        row = ref[i];
        for (j = 0, len1 = row.length; j < len1; j++) {
          cell = row[j];
          cells.push(cell);
        }
      }
      return cells;
    };

    GoBoard.prototype.unlockAll = function() {
      var cell, i, len, ref, results;
      ref = this.cellArray();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        results.push(cell.unLock());
      }
      return results;
    };

    GoBoard.prototype.unColorAll = function() {
      var cell, i, len, ref, results;
      ref = this.cellArray();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        results.push(cell.$el.removeClass("counted-white").removeClass("counted-black"));
      }
      return results;
    };

    GoBoard.prototype.score = function() {
      var bc, bd, cell, i, len, ref, wc, wd;
      this.unlockAll();
      this.unColorAll();
      ref = this.cellArray();
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell.isUnlocked() && cell.isEmpty()) {
          cell.scoreArea();
        }
      }
      wc = this.$el.find('.counted-white').length;
      bc = this.$el.find('.counted-black').length;
      wd = this.$el.find('.dead.white').length;
      bd = this.$el.find('.dead.black').length;
      this.game.players.player_score.white = wc + bd * 2;
      this.game.players.player_score.black = bc + wd * 2;
      return this.game.players.drawStats();
    };

    return GoBoard;

  })();

  GoCell = (function() {
    function GoCell(x, y, board) {
      var ref;
      this.board = board;
      this.locked = false;
      ref = [x, y], this.x = ref[0], this.y = ref[1];
      this.stone = false;
      this.$el = this.board.$el.find("[data-x=" + x + "][data-y=" + y + "]");
      this.dead = false;
    }

    GoCell.prototype.state = function() {
      if (this.isEmpty()) {
        return 0;
      }
      if (this.isBlack()) {
        return 1;
      }
      if (this.isWhite()) {
        return 2;
      }
    };

    GoCell.prototype.isEmpty = function() {
      return !this.stone;
    };

    GoCell.prototype.isWhite = function() {
      var ref;
      return ((ref = this.stone) != null ? ref.color : void 0) === 'white';
    };

    GoCell.prototype.isBlack = function() {
      var ref;
      return ((ref = this.stone) != null ? ref.color : void 0) === 'black';
    };

    GoCell.prototype.isAlive = function() {
      return !this.dead;
    };

    GoCell.prototype.color = function(c) {
      var ref, ref1;
      if (c == null) {
        c = false;
      }
      if (c) {
        return ((ref = this.stone) != null ? ref.color : void 0) === c;
      } else {
        return ((ref1 = this.stone) != null ? ref1.color : void 0) || 'empty';
      }
    };

    GoCell.prototype.oppositeColor = function() {
      if (!'stone') {
        return 'empty';
      }
      if (this.stone.color === 'black') {
        return 'white';
      } else {
        return 'black';
      }
    };

    GoCell.prototype.addStone = function(stone) {
      if (!(this.groupLiberties(stone.color).length > 0)) {
        return false;
      }
      this.stone = stone;
      this.$el.data('stone', this.stone);
      return this.$el.addClass(this.stone.color);
    };

    GoCell.prototype.captureStone = function() {
      return this.removeStone();
    };

    GoCell.prototype.removeStone = function() {
      var c;
      if (!this.stone) {
        return;
      }
      c = this.color();
      this.stone = false;
      this.$el.data('stone', this.stone);
      return this.$el.removeClass(c);
    };

    GoCell.prototype.neighbors = function() {
      var cell, i, len, ref, results;
      ref = this.neighborCells();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell !== void 0) {
          results.push(cell);
        }
      }
      return results;
    };

    GoCell.prototype.neighborCells = function() {
      var ref, ref1, ref2, ref3;
      return [(ref = this.board.cells[this.x - 1]) != null ? ref[this.y] : void 0, (ref1 = this.board.cells[this.x]) != null ? ref1[this.y + 1] : void 0, (ref2 = this.board.cells[this.x + 1]) != null ? ref2[this.y] : void 0, (ref3 = this.board.cells[this.x]) != null ? ref3[this.y - 1] : void 0];
    };

    GoCell.prototype.liberties = function(locked_flag) {
      var cell, i, len, ref, results;
      if (locked_flag == null) {
        locked_flag = false;
      }
      ref = this.neighbors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell.isEmpty() && cell.isLocked() === locked_flag) {
          results.push(cell);
        }
      }
      return results;
    };

    GoCell.prototype.lockLiberties = function() {
      var cell, i, len, ref, results;
      ref = this.liberties();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        results.push(cell.lock());
      }
      return results;
    };

    GoCell.prototype.unLockLiberties = function() {
      var cell, i, len, ref, results;
      ref = this.liberties(true);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        results.push(cell.unLock());
      }
      return results;
    };

    GoCell.prototype.scoreArea = function() {
      var cell, happy, i, len, ref, results, s;
      s = this.areaSummary();
      happy = s.stones.indexOf('black') === -1 || s.stones.indexOf('white') === -1;
      if (happy) {
        ref = s.cells;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          cell = ref[i];
          results.push(cell.$el.addClass("counted-" + s.stones[0]));
        }
        return results;
      }
    };

    GoCell.prototype.areaSummary = function() {
      var cell, cells, i, j, len, len1, ref, ref1, stones, summary;
      stones = [];
      cells = [this];
      this.lock();
      ref = this.neighbors();
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (!(cell.isEmpty() && cell.isUnlocked())) {
          continue;
        }
        summary = cell.areaSummary();
        stones = stones.concat(summary.stones);
        cells = cells.concat(summary.cells);
      }
      ref1 = this.neighbors();
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        cell = ref1[j];
        if (!cell.isEmpty() && cell.isUnlocked()) {
          if (cell.isAlive()) {
            stones.push(cell.color());
          } else {
            stones.push(cell.oppositeColor());
          }
        }
      }
      return {
        stones: stones,
        cells: cells
      };
    };

    GoCell.prototype.opponentGroupCaptures = function(color) {
      var captures, cell, i, l, len, ref;
      captures = [];
      ref = this.neighbors();
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (!(!cell.isEmpty() && cell.color() !== color)) {
          continue;
        }
        this.lock();
        l = cell.groupLiberties().length;
        cell.groupUnlock();
        if (l === 0) {
          captures = captures.concat(cell.captureGroup());
        }
        this.unLock();
      }
      return captures;
    };

    GoCell.prototype.captureGroup = function() {
      var captures, cell, color, i, len, ref;
      captures = [this.stone];
      color = this.color();
      this.captureStone();
      ref = this.neighbors();
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell.color(color)) {
          captures = captures.concat(cell.captureGroup());
        }
      }
      return captures;
    };

    GoCell.prototype.markAlive = function() {
      var cell, i, len, ref, results;
      if (this.isEmpty()) {
        return;
      }
      this.dead = false;
      this.$el.removeClass('dead');
      ref = this.neighbors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell.color(this.color()) && cell.dead) {
          results.push(cell.markAlive());
        }
      }
      return results;
    };

    GoCell.prototype.markDead = function() {
      var cell, i, len, ref, results;
      if (this.isEmpty()) {
        return;
      }
      this.dead = true;
      this.$el.addClass('dead');
      ref = this.neighbors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell.color(this.color()) && !cell.dead) {
          results.push(cell.markDead());
        }
      }
      return results;
    };

    GoCell.prototype.groupLiberties = function(color) {
      var cell, i, l, len, ref;
      if (color == null) {
        color = this.color();
      }
      if (this.isLocked()) {
        return [];
      }
      this.lock();
      l = this.liberties();
      this.lockLiberties();
      ref = this.neighbors();
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell.color(color) && cell.isUnlocked()) {
          l = l.concat(cell.groupLiberties(color));
        }
      }
      if (this.isEmpty()) {
        this.groupUnlock(color);
      }
      return l;
    };

    GoCell.prototype.groupUnlock = function(color) {
      var cell, i, len, ref, results;
      if (color == null) {
        color = this.color();
      }
      this.unLock();
      this.unLockLiberties();
      ref = this.neighbors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cell = ref[i];
        if (cell.color(color) && cell.isLocked()) {
          results.push(cell.groupUnlock(color));
        }
      }
      return results;
    };

    GoCell.prototype.lock = function() {
      return this.locked = true;
    };

    GoCell.prototype.unLock = function() {
      return this.locked = false;
    };

    GoCell.prototype.isLocked = function() {
      return this.locked;
    };

    GoCell.prototype.isUnlocked = function() {
      return !this.locked;
    };

    return GoCell;

  })();

  GoStone = (function() {
    function GoStone(game, x, y, color, pass) {
      if (pass == null) {
        pass = false;
      }
      this.game = game;
      this.x = x;
      this.y = y;
      this.color = color;
      this.pass = pass;
    }

    return GoStone;

  })();

  MoveBranch = (function() {
    function MoveBranch(game, parent, stone, captures, state) {
      if (parent == null) {
        parent = false;
      }
      if (stone == null) {
        stone = false;
      }
      if (captures == null) {
        captures = false;
      }
      if (state == null) {
        state = false;
      }
      this.game = game;
      this.parent = parent;
      this.stone = stone;
      this.captures = captures;
      this.state = state;
      this.current_move = true;
      this.active = true;
      this.move_branches = [];
    }

    MoveBranch.prototype.addMove = function(stone, captures, state) {
      var branch, i, len, m, ref, ref1;
      if ((ref = this.activeBranch()) != null) {
        ref.deactivate();
      }
      ref1 = this.move_branches;
      for (i = 0, len = ref1.length; i < len; i++) {
        branch = ref1[i];
        if (branch.state === state) {
          branch.active = true;
          branch.activateDefault();
          branch.current_move = true;
        }
      }
      if (!this.activeBranch()) {
        m = new MoveBranch(this.game, this, stone, captures, state);
        this.move_branches.push(m);
      }
      return this.current_move = false;
    };

    MoveBranch.prototype.deactivate = function() {
      var ref;
      this.active = false;
      return (ref = this.activeBranch()) != null ? ref.deactivate() : void 0;
    };

    MoveBranch.prototype.activateDefault = function() {
      var ref;
      if (this.move_branches.length > 0) {
        this.move_branches[0].active = true;
      }
      return (ref = this.activeBranch()) != null ? ref.activateDefault() : void 0;
    };

    MoveBranch.prototype.currentMove = function() {
      var ref;
      if (this.current_move) {
        return this;
      } else {
        return (ref = this.activeBranch()) != null ? ref.currentMove() : void 0;
      }
    };

    MoveBranch.prototype.activeBranch = function() {
      var move_branch;
      return ((function() {
        var i, len, ref, results;
        ref = this.move_branches;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          move_branch = ref[i];
          if (move_branch.active) {
            results.push(move_branch);
          }
        }
        return results;
      }).call(this))[0];
    };

    MoveBranch.prototype.parentArray = function() {
      if (this.parent) {
        return [this.parent].concat(this.parent.parentArray());
      } else {
        return [];
      }
    };

    MoveBranch.prototype.activeArray = function() {
      var ref, ref1;
      if (this.current_move) {
        return [this];
      } else if (this.stone) {
        return [this].concat((ref = this.activeBranch()) != null ? ref.activeArray() : void 0);
      } else {
        return (ref1 = this.activeBranch()) != null ? ref1.activeArray() : void 0;
      }
    };

    MoveBranch.prototype.stateArray = function() {
      var i, len, move, ref, results;
      ref = this.activeArray();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        move = ref[i];
        results.push(move.state);
      }
      return results;
    };

    MoveBranch.prototype.nextStone = function() {
      var ref;
      if (this.current_move) {
        return (ref = this.activeBranch()) != null ? ref.stone : void 0;
      } else {
        return this.currentMove().nextStone();
      }
    };

    MoveBranch.prototype.forward = function() {
      if (this.current_move) {
        this.current_move = false;
        this.activeBranch().current_move = true;
        return this.activeBranch().stone;
      } else {
        return this.currentMove().forward();
      }
    };

    MoveBranch.prototype.back = function() {
      if (this.current_move) {
        if (!this.parent) {
          return;
        }
        this.current_move = false;
        this.parent.current_move = true;
        return {
          stone: this.stone,
          captures: this.captures
        };
      } else {
        return this.currentMove().back();
      }
    };

    return MoveBranch;

  })();

  GoPlayers = (function() {
    function GoPlayers(id, game) {
      this.doPass = bind(this.doPass, this);
      this.$el = $(id + " .goPlayers");
      this.game = game;
      this.captures = {
        black: 0,
        white: 0
      };
      this.player_score = {
        black: 0,
        white: 0
      };
      this.drawStats();
      this.$el.find('.pass').on('click', this.doPass);
    }

    GoPlayers.prototype.score = function(player) {
      return this.captures[player === 'white' ? 'black' : 'white'] + this.player_score[player];
    };

    GoPlayers.prototype.addCaptures = function(captures) {
      var i, len, stone;
      for (i = 0, len = captures.length; i < len; i++) {
        stone = captures[i];
        this.captures[stone.color] += 1;
      }
      return this.drawStats();
    };

    GoPlayers.prototype.freeCaptures = function(captures) {
      var i, len, stone;
      for (i = 0, len = captures.length; i < len; i++) {
        stone = captures[i];
        this.captures[stone.color] -= 1;
      }
      return this.drawStats();
    };

    GoPlayers.prototype.drawStats = function() {
      var color, i, len, ref, results;
      ref = ['black', 'white'];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        color = ref[i];
        results.push(this.$el.find(".stats." + color + " .captures").text(this.score(color)));
      }
      return results;
    };

    GoPlayers.prototype.doPass = function(e) {
      var c;
      c = $(e.currentTarget).parent().hasClass('black') ? 'black' : 'white';
      if (this.game.nextColor() !== c) {
        return;
      }
      this.game.doPass(c);
      return this.game.tree_view.render();
    };

    return GoPlayers;

  })();

  GoControls = (function() {
    function GoControls(id, game) {
      this.playClicked = bind(this.playClicked, this);
      this.backClicked = bind(this.backClicked, this);
      this.forwardClicked = bind(this.forwardClicked, this);
      this.game = game;
      this.$el = $(id + " .goControls");
      this.registerEvents();
    }

    GoControls.prototype.registerEvents = function() {
      this.$el.find('.forward').on('click', this.forwardClicked);
      return this.$el.find('.back').on('click', this.backClicked);
    };

    GoControls.prototype.forwardClicked = function() {
      this.game.goForward();
      return this.game.tree_view.render();
    };

    GoControls.prototype.backClicked = function() {
      this.game.goBack();
      return this.game.tree_view.render();
    };

    GoControls.prototype.playClicked = function() {};

    return GoControls;

  })();

  TreeView = (function() {
    function TreeView(id, game) {
      this.clicked = bind(this.clicked, this);
      this.$el = $(id + " .tree");
      this.game = game;
    }

    TreeView.prototype.render = function() {
      this.$el.html(this.renderTree(this.game.move_tree));
      this.renderLines();
      return this.$el.find('.stone').on('click', this.clicked);
    };

    TreeView.prototype.renderLines = function() {
      var dest, i, len, ref, results, stone;
      ref = this.$el.find('.stone');
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        stone = ref[i];
        results.push((function() {
          var j, len1, ref1, results1;
          ref1 = $(stone).parent().children('.branches').children('.branch').children('.stone');
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            dest = ref1[j];
            results1.push(this.drawLine(stone, dest));
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    TreeView.prototype.drawLine = function(stone, dest) {
      var a, active, as, b, bs, c, d, el, et, sl, st;
      st = stone.offsetTop;
      sl = stone.offsetLeft;
      et = dest.offsetTop;
      el = dest.offsetLeft;
      active = $(dest).data('branch').active;
      a = et - st;
      b = el - sl;
      as = Math.pow(a, 2);
      bs = Math.pow(b, 2);
      c = Math.sqrt(as + bs);
      d = Math.atan2(a, b) * 180 / Math.PI;
      return this.$el.append($('<div>').addClass('line').toggleClass('active', active).css({
        width: c + "px",
        top: st + 9,
        left: sl + 8,
        transform: "rotate(" + d + "deg)",
        'transform-origin': "0 0"
      }));
    };

    TreeView.prototype.clicked = function(e) {
      var branch, current, i, len, move, moves;
      branch = $(e.currentTarget).data('branch');
      if (branch.active) {
        while (!branch.currentMove()) {
          this.game.goForward();
        }
        while (!branch.current_move) {
          this.game.goBack();
        }
      } else {
        moves = [branch];
        while (moves[0].active === false) {
          moves.unshift(moves[0].parent);
        }
        current = moves.shift();
        if (current.parentArray().length < this.game.move_tree.currentMove().parentArray().length) {
          while (!current.current_move) {
            this.game.goBack();
          }
        } else {
          while (!current.current_move) {
            this.game.goForward();
          }
        }
        current.activeBranch().deactivate();
        for (i = 0, len = moves.length; i < len; i++) {
          move = moves[i];
          move.active = true;
        }
        while (!branch.currentMove()) {
          this.game.goForward();
        }
        branch.activateDefault();
      }
      return this.render();
    };

    TreeView.prototype.renderTree = function(tree) {
      var $b, $bs, branch, i, len, ref;
      $b = $('<div>').addClass('branch');
      $b.append(this.renderNode(tree));
      $bs = $('<div>').addClass('branches');
      ref = tree.move_branches;
      for (i = 0, len = ref.length; i < len; i++) {
        branch = ref[i];
        $bs.append(this.renderTree(branch));
      }
      return $b.append($bs);
    };

    TreeView.prototype.renderNode = function(b) {
      return $("<div>").addClass('stone').addClass("" + (b.stone.color || 'start')).toggleClass('current', b.current_move).data('branch', b);
    };

    return TreeView;

  })();

  GoGame = (function() {
    function GoGame(id) {
      this.board = new GoBoard(id, this);
      this.move_tree = new MoveBranch(this);
      this.players = new GoPlayers(id, this);
      this.controls = new GoControls(id, this);
      this.tree_view = new TreeView(id, this);
      this.tree_view.render();
      this.scoring = false;
    }

    GoGame.prototype.handleClick = function(x, y) {
      var c;
      if (!this.scoring) {
        if (!this.board.isEmpty(x, y)) {
          return;
        }
        this.addStone(new GoStone(this, x, y, this.nextColor()));
        this.tree_view.render();
      }
      if (this.scoring) {
        c = this.board.cells[x][y];
        if (c.dead) {
          c.markAlive();
        } else {
          c.markDead();
        }
        return this.board.score();
      }
    };

    GoGame.prototype.addStone = function(stone) {
      var ret;
      if (ret = this.board.addStone(stone)) {
        this.players.addCaptures(ret.captures);
        this.move_tree.currentMove().addMove(stone, ret.captures, ret.state);
        return this.board.updateColor();
      }
    };

    GoGame.prototype.doPass = function(color) {
      var doscore, stone;
      stone = new GoStone(this, false, false, color, true);
      //this.players.addCaptures([stone]);               // pass is not counted as capture
      doscore = this.move_tree.currentMove().stone.pass;
      this.move_tree.currentMove().addMove(stone, [stone], '');
      this.board.updateColor();
      if (doscore) {
        return this.startScoring();
      }
    };

    GoGame.prototype.nextColor = function() {
      if (this.currentColor() === 'black') {
        return 'white';
      } else {
        return 'black';
      }
    };

    GoGame.prototype.currentColor = function() {
      return this.move_tree.currentMove().stone.color || 'white';
    };

    GoGame.prototype.goForward = function() {
      var ret, stone;
      stone = this.move_tree.nextStone();
      if (stone) {
        if (!stone.pass) {
          ret = this.board.addStone(stone);
          this.players.addCaptures(ret.captures);
        } else {
          this.players.addCaptures([stone]);
        }
        this.move_tree.forward();
        return this.board.updateColor();
      }
    };

    GoGame.prototype.goBack = function() {
      var undos;
      undos = this.move_tree.back();
      if (undos) {
        this.board.removeStone(undos.stone);
        this.board.freeCaptures(undos.captures);
        this.players.freeCaptures(undos.captures);
        return this.board.updateColor();
      }
    };

    GoGame.prototype.startScoring = function() {
      this.scoring = true;
      return this.board.score();
    };

    return GoGame;

  })();

  new GoGame('#board19');

  new GoGame('#board13');

  new GoGame('#board9');

}).call(this);