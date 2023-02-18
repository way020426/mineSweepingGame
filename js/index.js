/**
 * 游戏主要逻辑
 */

// 用于存储生成的雷
var mineArray = null;

// 获取雷区容器
var mineArea = $(".mineArea");

// 用于存储整张地图每个格子额为的信息
var tableData = [];

// 用于存储插旗的 dom 元素
var flagArray = [];

// 目前插旗的数量
var flagNum = $(".flagNum");

// 当前级别的雷数
var mineNumber = $(".mineNum");

/**
 * 生成地雷的方法
 * @returns 返回地雷数组
 */
function initMine() {
  // 生成对应的数组
  var arr = new Array(curLevel.row * curLevel.col);
  // 往数组里面填充值
  for (var i = 0; i < arr.length; i++) {
    arr[i] = i;
  }
  // 让数组中的数字在范围内乱序
  arr.sort(() => 0.5 - Math.random());
  // 只保留对应雷数量的数组
  return arr.slice(0, curLevel.mineNum);
}
/**
 * 场景重置
 */
function clearScene() {
  mineArea.innerHTML = "";
  flagArray = []; // 清空插旗的数组
  flagNum.innerHTML = 0; // 重置插旗数
  mineNumber.innerHTML = curLevel.mineNum; // 修改当前级别的总雷数
}

/**
 * 游戏初始化函数
 */
function init() {
  // 清空场景 重置信息
  clearScene();
  // 随机生成雷
  mineArray = initMine();
  // console.log(mineArray);

  // 生成所选配置数量的表格
  var table = document.createElement("table");
  // 初始化格子的下标
  var index = 0;
  for (var i = 0; i < curLevel.row; i++) {
    // 行
    var tr = document.createElement("tr");
    tableData[i] = [];
    for (var j = 0; j < curLevel.col; j++) {
      // 列
      var td = document.createElement("td");
      var div = document.createElement("div");
      // 每一个小格子都会对应一个 js 对象
      tableData[i][j] = {
        row: i, // 行
        col: j, // 列
        type: "number", // 数字或雷
        value: 0, // 周围雷的数量
        index, // 格子的下标
        checked: false, // 是否被检测过
      };
      // 为每一个div添加一个下标
      div.dataset.id = index;
      div.classList.add("canFlag");

      if (mineArray.includes(tableData[i][j].index)) {
        tableData[i][j].type = "mine";
        div.classList.add("mine");
      }
      td.appendChild(div);
      tr.appendChild(td);
      index++;
    }
    table.appendChild(tr);
  }
  mineArea.appendChild(table);
  // console.log(table);
  mineArea.onmousedown = function (e) {
    // console.log(e.button);
    if (e.button === 0) {
      // 左键 进行区域搜索
      searchArea(e.target);
    }
    if (e.button === 2) {
      // 右键 插旗
      flag(e.target);
    }
  };
}

/**
 * 显示答案
 */
function showAnswer() {
  // 要把所有的雷显示出来
  // 雷可能插了旗 判断是否正确
  // 正确加 right 错误加 error
  var isAllRight = true;
  var mineArr = $$("td div.mine");
  for (var i = 0; i < mineArr.length; i++) {
    mineArr[i].style.opacity = 1;
  }
  // 遍历用户的插旗 看是否争取
  for (var i = 0; i < flagArray.length; i++) {
    if (flagArray[i].classList.contains("mine")) {
      flagArray[i].classList.add("right");
    } else {
      flagArray[i].classList.add("error");
      isAllRight = false;
    }
  }
  if (!isAllRight || flagArray.length !== curLevel.mineNum) {
    gameOver(false);
  }
  mineArea.onmousedown = null;
}

/**
 * 会返回该对象对应的四周的边界
 * @param {*} obj
 */
function getBound(obj) {
  var rowTop = obj.row - 1 < 0 ? 0 : obj.row - 1;
  var rowBottom = obj.row + 1 === curLevel.row ? curLevel.row - 1 : obj.row + 1;
  var colLeft = obj.col - 1 < 0 ? 0 : obj.col - 1;
  var colRight = obj.col + 1 === curLevel.col ? curLevel.col - 1 : obj.col + 1;
  return {
    rowTop,
    rowBottom,
    colLeft,
    colRight,
  };
}

/**
 * 返回周围九宫格内雷的数量
 * @param {*} obj 格子对应的js对象
 */
function findMineNum(obj) {
  var count = 0;
  var { rowTop, rowBottom, colLeft, colRight } = getBound(obj);
  for (var i = rowTop; i <= rowBottom; i++) {
    for (var j = colLeft; j <= colRight; j++) {
      if (tableData[i][j].type === "mine") {
        count++;
      }
    }
  }
  return count;
}

/**
 * 找到对应 dom 在 tableData 里面的 js 对象
 * @param {*} cell
 */
function getTableItem(cell) {
  var index = cell.dataset.id;
  var flatTableData = tableData.flat();
  return flatTableData.filter((item) => item.index == index)[0];
}

/**
 * 根据 js 对象返回 div
 * @param {*} obj
 */
function getDOM(obj) {
  var divArray = $$("td div");
  return divArray[obj.index];
}

/**
 * 搜索当前单元格周围的九宫格
 * @param {*} cell 被点击的单元格
 */
function getAround(cell) {
  if (!cell.classList.contains("flag")) {
    // 当前的单元格没有被插旗
    cell.parentNode.style.border = "none";
    cell.classList.remove("canFlag");
    var tableItem = getTableItem(cell);
    if (!tableItem) {
      return;
    }
    tableItem.checked = true;
    var mineNum = findMineNum(tableItem);
    if (!mineNum) {
      var { rowTop, rowBottom, colLeft, colRight } = getBound(tableItem);
      for (var i = rowTop; i <= rowBottom; i++) {
        for (var j = colLeft; j <= colRight; j++) {
          if (!tableData[i][j].checked) {
            getAround(getDOM(tableData[i][j]));
          }
        }
      }
    } else {
      var cl = [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
      ];
      cell.classList.add(cl[mineNum]);
      cell.innerHTML = mineNum;
    }
  }
}

/**
 *  区域搜索函数
 * @param {*} cell 用户点击的 dom 元素
 */
function searchArea(cell) {
  // 1. 当前单元格是雷 游戏结束
  if (cell.classList.contains("mine")) {
    cell.classList.add("error");
    showAnswer();
    return;
  }
  // 2. 当前单元格不是雷 判断周围九宫格内有没有雷
  //   2.1 有雷 显示雷的数量
  //   2.2 没雷 继续递归搜索
  getAround(cell);
}

/**
 * 判断是否游戏成功
 */
function isWin() {
  for (var i = 0; i < flagArray.length; i++) {
    if (!flagArray[i].classList.contains("mine")) {
      return false;
    }
  }
  return true;
}

/**
 * 游戏结束
 * 分为两种情况
 */
function gameOver(bol) {
  var mess = "";
  if (bol) {
    mess = "游戏胜利~";
  } else {
    mess = "游戏失败!";
  }
  setTimeout(function () {
    window.alert(mess);
  }, 0);
}

/**
 *  插旗函数
 * @param {*} cell 用户点击的 dom 元素
 */
function flag(cell) {
  if (cell.classList.contains("canFlag")) {
    if (!flagArray.includes(cell)) {
      // 目前格子还没有旗子可以插旗
      flagArray.push(cell);
      cell.classList.add("flag");
      if (flagArray.length === curLevel.mineNum) {
        if (isWin()) {
          gameOver(true);
        }
        showAnswer();
      }
    } else {
      // // 目前格子里有旗子了 取消旗子
      var index = flagArray.indexOf(cell);
      flagArray.splice(index, 1);
      cell.classList.remove("flag");
    }
    flagNum.innerHTML = flagArray.length;
  }
}

/**
 * 绑定事件函数
 */
function bindEvent() {
  // 鼠标点击事件

  // 阻止右键弹出窗口
  mineArea.oncontextmenu = function (e) {
    e.preventDefault();
  };

  // 游戏难度选择
  var btns = $$(".level button");
  $(".level").onclick = function (e) {
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove("active");
    }
    e.target.classList.add("active");
    switch (e.target.innerHTML) {
      case "初级": {
        curLevel = config.easy;
        break;
      }
      case "中级": {
        curLevel = config.normal;
        break;
      }
      case "高级": {
        curLevel = config.hard;
        break;
      }
    }
    init();
  };
}

/**
 * 程序入口
 */
function main() {
  // 游戏初始化
  init();
  // 绑定事件
  bindEvent();
}

main();
