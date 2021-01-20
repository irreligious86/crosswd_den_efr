function getOtherIndex(idx, length) {
  return length * (idx % length) + ~~(idx / length);
}

function Word(config = { length: 0, letters: '' }) {
  Array.apply(this, arguments);
  this.start = null;
}
Word.prototype = Object.create(Array.prototype);
Word.prototype.constructor = Word;

Word.prototype.toString = function () {
  return this.join('');
};

function Grid(config = { width: 15, height: 15 }) {
  this.width = config.width;
  this.height = config.height;
  this.wrapper = window['grid-wrapper'];
  this.el = window.grid;

  this.controls = {
    incrementWidth: this.wrapper.querySelector('.increment.width'),
    incrementHeight: this.wrapper.querySelector('.increment.height'),
    decrementWidth: this.wrapper.querySelector('.decrement.width'),
    decrementHeight: this.wrapper.querySelector('.decrement.height') };


  this.rebuildStore();

  Object.keys(this.controls).forEach(key => {
    this.controls[key].addEventListener('click', e => {
      this[key]();
    });
  });
}

Grid.prototype.rebuildStore = function () {
  this.hArr = new Array(this.width * this.height).fill(' ');
  this.vArr = new Array(this.height * this.width).fill(' ');
};

Grid.prototype.toggleSymmetricBlanks = function (hIdx) {
  const hMirrorIdx = this.width * ~~(hIdx / this.width) + (this.width - hIdx % this.width - 1);
  const fullLength = this.hArr.length - 1;
  const cells = [...new Set([+hIdx, hMirrorIdx, fullLength - hIdx, fullLength - hMirrorIdx])];

  for (let i = 0; i < cells.length; i += 1) {
    this.toggleBlank(cells[i]);
  }
};

Grid.prototype.toggleBlank = function (hIdx) {
  this.hArr[hIdx] = this.hArr[hIdx] ? 0 : ' ';
  const vIdx = getOtherIndex(hIdx, this.width);
  this.vArr[vIdx] = this.vArr[vIdx] ? 0 : ' ';
};

Grid.prototype.getWords = function (list, len) {
  const full = list.join('');
  const lines = full.match(new RegExp(`.{1,${len}}`, 'g'));
  const arr = [];

  for (let i = 0; i < lines.length; i += 1) {
    const a = [...lines[i].matchAll(/[^0]{3,}/g)];
    for (let j = 0; j < a.length; j += 1) {
      const w = new Word();
      w.push(...a[j][0]);
      w.start = i * len + a[j].index;
      arr.push(w);
    }
  }

  return arr;
};

Grid.prototype.verticalWords = function () {
  return this.getWords(this.vArr, this.height);
};

Grid.prototype.horizontalWords = function () {
  return this.getWords(this.hArr, this.width);
};

Grid.prototype.incrementWidth = function (value = 1) {
  this.width += value;
  this.rebuildStore();
  this.render();
};

Grid.prototype.incrementHeight = function (value = 1) {
  this.height += value;
  this.rebuildStore();
  this.render();
};

Grid.prototype.decrementWidth = function (value = 1) {
  this.width -= value;
  this.rebuildStore();
  this.render();
};

Grid.prototype.decrementHeight = function (value = 1) {
  this.height -= value;
  this.rebuildStore();
  this.render();
};

Grid.prototype.setForm = function (form) {
  this.form = form;
  return this;
};

Grid.prototype.render = function () {
  // console.time('render')
  this.el.innerHTML = '';
  this.el.style.gridTemplateColumns = `repeat(${this.width}, 21px)`;

  for (let i = 0; i < this.hArr.length; i += 1) {
    const cell = document.createElement('div');
    cell.dataset.hIdx = i;
    // cell.dataset.vIdx = getOtherIndex(i, width)
    cell.classList.add('cell');
    if (this.hArr[i] === 0) {
      cell.classList.add('black');
    } else {
      // cell.innerHTML = i
      cell.innerHTML = this.hArr[i];
    }

    cell.addEventListener('click', e => {
      this.toggleSymmetricBlanks(e.target.dataset.hIdx);
      this.render();
    });
    this.el.appendChild(cell);
  }

  this.hor = this.horizontalWords();
  this.ver = this.verticalWords();

  const gridArr = [];
  for (let i = 0; i < this.ver.length; i += 1) {
    gridArr.push(getOtherIndex(this.ver[i].start, this.height));
  }
  for (let i = 0; i < this.hor.length; i += 1) {
    gridArr.push(this.hor[i].start);
  }
  this.numbers = [...new Set(gridArr)].sort((a, b) => a - b);

  for (let i = 0; i < this.numbers.length; i += 1) {
    const startEl = this.el.querySelector(`[data-h-idx="${this.numbers[i]}"]`);
    startEl.innerHTML = `<sup>${i + 1}</sup>${startEl.innerHTML}`;

    const verWord = this.ver.find(({ start }) => start === getOtherIndex(this.numbers[i], this.height));
    if (verWord) {
      verWord.number = i + 1;
    }
    const horWord = this.hor.find(({ start }) => start === this.numbers[i]);
    if (horWord) {
      horWord.number = i + 1;
    }
  }

  this.form.render();
  // console.timeEnd('render')
};

function Form(grid) {
  this.el = window['form-wrapper'];
  this.grid = grid;
}

Form.prototype.createArea = function (words = [], name) {
  const area = document.createElement('div');
  area.classList.add('area');
  area.classList.add(name);

  for (let i = 0; i < words.length; i += 1) {
    const field = document.createElement('div');
    field.classList.add('field');

    for (let j = 0; j < words[i].length; j += 1) {
      const letter = document.createElement('div');
      letter.classList.add('letter');
      letter.innerHTML = j > 0 ? words[i][j] : `<big>${words[i].number}</big>${words[i][j]}`;
      letter.dataset.hIdx = words[i].start + j;

      field.appendChild(letter);
    }

    area.appendChild(field);
  }

  return area;
};

Form.prototype.render = function () {
  this.el.innerHTML = '';

  const hor = this.createArea(this.grid.hor, 'horizontal');
  const ver = this.createArea(this.grid.ver, 'vertical');

  this.el.appendChild(hor);
  this.el.appendChild(ver);
};

const grid = new Grid({ width: 25, height: 25 });

grid.setForm(new Form(grid)).render();

// console.log(grid.verticalWords())