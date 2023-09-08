
//import {Jodit} from "jodit";
// import Quill from "quill";
//import "quill/dist/quill.snow.css"
//import  pell  from 'pell'


export default class CubicGantt {
  /*
   *		tasks.data -> 상위노드 parent 값은 무조건 0
   *		main - sub 구조시 main 순서대로 정렬되어야 빠름.
   */
  constructor(name) {
    this.name = name;
    this.gantt_id = "";
    this.config = {
      min_column_width: 40, //
      min_column_height: 30, //
      start_date: new Date(2018, 0, 1),
      end_date: new Date(2019, 0, 1),
      gantt_padding: 2.5, //	gantt padding
      use_gantt_progress: true, //	progress
      subscale_height: 21,
      subscales: ["year", "month", "day"], //
      check_weekend: true, //
      use_add: true, //	add button
      fn_load_info: null,
      fn_add_main: null,
      fn_add_sub: null,
      fn_delete_main: null,
      fn_delete_sub: null,
      fn_scroll_horizon: null,
      fn_after_reset: null,
      left_type: [], //	left
    };

    this.visible_order = [];

    this.tasks = {};
    this.max_level = -1;
    this.show_level = -1;

    this.total_height = 0; //
    this.total_width = 0; //
    this.left_width = 0; //
    this.resize_left_width = null;
    this.scroll_size = 17;
    this.date_count = 0; //	end_date - start_date
    this.list_length = 0; //	end_date - start_date
    this.subscales_height = 0;

    this.show_vertical_count = 0; //	몇개 보여줄지 (세로)
    this.show_horizontal_count = 0; //	몇개 보여줄지 (가로)

    this.is_div_resize = false;
    this.is_gantt_move = false;
    this.is_gantt_resize_left = false;
    this.is_gantt_resize_right = false;
    this.is_gantt_progress = false;
    this.mouse_x = 0;
    this.gantt_x = 0;
    this.gantt_width = 0;

    this.target_gantt = null;

    this.last_vscroll_position = 0;
    this.last_hscroll_position = 0;

    this.gantt_left_edit = false; /* GS */
    this.gantt_code_editer = null;
    this.gantt_code = "ABCDEFGHI";

    this.v_split_id = 0;
    this.h_split_id = 0;
    this.v_split_gantt = [];
    this.h_split_gantt = [];
    this.not_show_left_panel = false;
    this.splitview = null;
    this.v_sync_mode = false;
    this.show_grid_mode = false;
    this.memo_ndoe = [];
  }
  init_gantt(gantt_id) {
    if (document.getElementById("divRTMCContent")) {
      document.getElementById("divRTMCContent").style.padding = 0;
    }

    let obj_gantt = document.getElementById(gantt_id);
    this.gantt_id = gantt_id;
    this.obj_gantt = obj_gantt;

    if (this.config.left_type.length == 0) {
      alert("config.left_type를 설정해주십시오.");
      return;
    }

    this.reset_visible(obj_gantt);
  }

  is_show_grid() {
    return document.getElementById("show_grid").checked;
  }

  set_splitview(sv) {
    this.splitview = sv;
  }

  px_to_int(px) {
    return parseInt(px.replace("px", ""), 10);
  }
  date_diff(type, from, to) {
    return (
      Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1
    );
    //return DateDiff(type, from, to);
  }
  date_add(type, from, count) {
    if (type == null) type = "S";
    type = type.toUpperCase();

    let result = new Date(from);

    switch (type) {
      case "S":
        result.setSeconds(count + result.getSeconds());
        break;
      case "N":
        result.setMinutes(count + result.getMinutes());
        break;
      case "H":
        result.setHours(count + result.getHours());
        break;
      case "D":
        result.setDate(count + result.getDate());
        break;
      case "W":
        result.setDate(count * 7 + result.getDate());
        break;
    }
    return result;
  }
  format_date(date) {
    let d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }
  set_multiple_style(el, styles) {
    Object.assign(el.style, styles);
  }

  v_sync() {
    console.log("v_sync");
  }
  sort_visible() {
    //	계층별로 나열되어있는 배열 => TREE 순서로 나열되어있는 배열로 변환, 거꾸로 됨
    let copy_data = JSON.parse(JSON.stringify(this.tasks.data)); //	참조없이 복사
    let copy_length = copy_data.length;

    this.visible_order = [];

    let t = 0;

    for (let copy_idx = 0; copy_idx < copy_length; copy_idx++) {
      if (copy_data[copy_idx].parent == 0) {
        this.visible_order.push({
          n_id: copy_data[copy_idx].n_id,
          parent: 0,
          index: copy_idx,
          open: copy_data[copy_idx].open,
          n_children: 0,
        });
      } else {
        //	find parent
        let sub_idx = 0;
        for (let n = 0; n < this.visible_order.length; ) {
          if (this.visible_order[n].n_id == copy_data[copy_idx].parent) {
            sub_idx = n;
            break;
          }
          if (this.visible_order[n].n_children == 0) n++;
          else n = n + this.visible_order[n].n_children + 1;
        }

        if (
          this.tasks.data[this.visible_order[sub_idx].index].start_date ==
          undefined
        ) {
          this.tasks.data[this.visible_order[sub_idx].index].start_date =
            new Date(copy_data[copy_idx].start_date);
        }
        if (
          this.tasks.data[this.visible_order[sub_idx].index].end_date ==
          undefined
        ) {
          this.tasks.data[this.visible_order[sub_idx].index].end_date =
            new Date(copy_data[copy_idx].end_date);
        }

        if (
          this.tasks.data[this.visible_order[sub_idx].index].start_date >
          new Date(copy_data[copy_idx].start_date)
        ) {
          this.tasks.data[this.visible_order[sub_idx].index].start_date =
            new Date(copy_data[copy_idx].start_date);
        }
        if (
          this.tasks.data[this.visible_order[sub_idx].index].end_date <
          new Date(copy_data[copy_idx].end_date)
        ) {
          this.tasks.data[this.visible_order[sub_idx].index].end_date =
            new Date(copy_data[copy_idx].end_date);
        }

        if (this.visible_order[sub_idx].open) {
          this.visible_order.splice(
            sub_idx + 1 + this.visible_order[sub_idx].n_children,
            0,
            {
              n_id: copy_data[copy_idx].n_id,
              parent: copy_data[copy_idx].parent,
              index: copy_idx,
            },
          );
          this.visible_order[sub_idx].n_children++;
        }
      }
    }
  }

  sort_visible2() {
    let copy_data = JSON.parse(JSON.stringify(this.tasks.data)); //	참조없이 복사
    let copy_length = copy_data.length;

    this.visible_order = [];

    let t = 0;

    for (let copy_idx = 0; copy_idx < copy_length; copy_idx++) {
      if (copy_data[copy_idx].parent == 0) {
        this.visible_order.push({
          n_id: copy_data[copy_idx].n_id,
          parent: 0,
          index: copy_idx,
          open: copy_data[copy_idx].open,
          n_children: 0,
        });
      } else {
        this.visible_order.push({
          n_id: copy_data[copy_idx].n_id,
          parent: 0,
          index: copy_idx,
          open: copy_data[copy_idx].open,
          n_children: 0,
        });
      }
    }
  }

  dump() {
    let that = this;

    var task = class {
      constructor(data, copy_index) {
        this._data = data;
        this._copy_index = copy_index;
        this._children = [];
      }
      get id() {
        return this._data.n_id;
      }
      get data() {
        return this._data;
      }
      get copy_idx() {
        return this._copy_index;
      }
      get open() {
        return this._data.open;
      }
      get open_animate() {
        return this._data.open_animate;
      }
      get parent_id() {
        return this._data.parent;
      }
      get parent() {
        return this._parent;
      }
      set parent(p) {
        this._parent = p;
      }
      get children() {
        return this._children;
      }
      set children(c_array) {
        this._children = c_array;
      }
      addchild(c) {
        this._children.push(c);
      }
    };

    let copy_data = JSON.parse(JSON.stringify(this.tasks.data)); //	참조없이 복사
    let copy_length = copy_data.length;
    //this.visible_order = [];

    let t = 0;

    let task_dict = {};
    let top_level = [];
    let parent = null;

    for (let i = 0; i < copy_data.length; ++i) {
      let data = copy_data[i];
      let new_task = new task(data, i);
      task_dict[data.n_id] = new_task;
      if (data.level == 0) {
        top_level.push(new_task);
      }
    }

    for (let key in task_dict) {
      let child_task = task_dict[key];
      if (child_task.parent_id != undefined) {
        let parent_task = task_dict[child_task.parent_id];
        parent_task.addchild(child_task);
      }
    }

    //-------------------------------------------
    function indent(level) {
      let str = "";
      for (let i = 0; i <= level; i++) {
        str += "   ";
      }
      return str;
    }

    function task_walk(task, level) {
      //let level_ = task.data.level;
      //gantt_code += indent(level_);
      let _code = indent(level);
      _code += task.data.n_id;
      _code += " ";
      _code += task.data.text;
      _code += "\n";
      for (let i = 0; i < task.children.length; ++i) {
        let code_nest = task_walk(task.children[i], level);
        _code += code_nest;
      }
      return _code;
    }
    this.gantt_code = "";

    for (let i = 0; i < top_level.length; ++i) {
      let task = top_level[i];
      let _code = task_walk(task, -1);
      this.gantt_code += _code;
    }

    //return "ABC\nDEF\nGHI\nJKL\n";
    return this.gantt_code;
  }

  sort_visible3() {
    let that = this;

    var task = class {
      constructor(data, copy_index) {
        this._data = data;
        this._copy_index = copy_index;
        this._children = [];
      }
      get id() {
        return this._data.n_id;
      }
      get data() {
        return this._data;
      }
      get copy_idx() {
        return this._copy_index;
      }
      get open() {
        return this._data.open;
      }
      get open_animate() {
        return this._data.open_animate;
      }
      get parent_id() {
        return this._data.parent;
      }
      get parent() {
        return this._parent;
      }
      set parent(p) {
        this._parent = p;
      }
      get children() {
        return this._children;
      }
      set children(c_array) {
        this._children = c_array;
      }
      addchild(c) {
        this._children.push(c);
      }
    };

    for (let i = 0; i < this.tasks.data.length; ++i) {
      if (this.tasks.data[i].start_date != undefined) {
        this.tasks.data[i].d_start = format_date(this.tasks.data[i].start_date);
      }
      if (this.tasks.data[i].end_date != undefined) {
        this.tasks.data[i].d_end = format_date(this.tasks.data[i].end_date);
      }
      if (this.tasks.data[i].open_animate == undefined) {
        this.tasks.data[i].open_animate = false;
      }
    }

    let copy_data = JSON.parse(JSON.stringify(this.tasks.data)); //	참조없이 복사
    let copy_length = copy_data.length;
    //this.visible_order = [];

    let t = 0;

    let task_dict = {};
    let top_level = [];
    let parent = null;

    for (let i = 0; i < copy_data.length; ++i) {
      let data = copy_data[i];
      let new_task = new task(data, i);
      task_dict[data.n_id] = new_task;
      if (data.level == 0) {
        top_level.push(new_task);
      }
    }

    for (let key in task_dict) {
      let child_task = task_dict[key];
      if (child_task.parent_id != undefined) {
        let parent_task = task_dict[child_task.parent_id];
        parent_task.addchild(child_task);
      }
    }

    //-------------------------------------------
    function task_dfs_org(task, data) {
      for (let i = 0; i < task.children.length; ++i) {
        let r = task_dfs(task.children[i], data);
        if (task.data.start_date > r[0]) {
          //task.data.start_date = r[0];
          data[task.copy_idx].start_date = new Date(r[0]);
        }
        if (task.data.end_date < r[1]) {
          //task.data.end_date = r[1];
          //data[task.idx].end_date = r[1];
          data[task.copy_idx].end_date = new Date(r[1]);
        }
      }
      if (task.open == undefined) {
        return [task.data.start_date, task.data.end_date];
      } else {
        return [task.data.start_date, task.data.end_date];
      }
    } // end func

    function format_date(d) {
      let month = "" + (d.getMonth() + 1);
      let day = "" + d.getDate();
      let year = d.getFullYear();

      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;

      return [year, month, day].join("-");
    }

    function task_dfs(task, data, level) {
      level = level + 1;
      //if (level > max) { max = level; }
      if (level > that.max_level) {
        that.max_level = level;
      }

      let min_start_date = null;
      let max_end_date = null;

      for (let i = 0; i < task.children.length; ++i) {
        let r = task_dfs(task.children[i], data, level);

        if (min_start_date == null) {
          min_start_date = new Date(r[0]);
        } else {
          if (min_start_date.getTime() > new Date(r[0]).getTime()) {
            min_start_date = new Date(r[0]);
          }
        }
        if (max_end_date == null) {
          max_end_date = new Date(r[1]);
        } else {
          if (max_end_date.getTime() < new Date(r[1]).getTime()) {
            max_end_date = new Date(r[1]);
          }
        }
      }

      if (min_start_date != null && max_end_date != null) {
        data[task.copy_idx].start_date = new Date(min_start_date);
        data[task.copy_idx].end_date = new Date(max_end_date);
        data[task.copy_idx].d_start = format_date(new Date(min_start_date));
        data[task.copy_idx].d_end = format_date(new Date(max_end_date));
        task.data.start_date = min_start_date;
        task.data.end_date = max_end_date;
      }

      return [task.data.start_date, task.data.end_date];
    } // end func

    for (let i = 0; i < top_level.length; ++i) {
      let task = top_level[i];
      let r = task_dfs(task, this.tasks.data, -1);
    }
    if (this.show_level == -1) {
      this.show_level = this.max_level;
    }

    //-------------------------------------------
    function task_walk(task, visible_order, level) {
      level = level + 1;
      if (level > that.show_level) {
        return;
      }
      visible_order.push({
        n_id: task.id,
        parent: 0,
        index: task.copy_idx,
        open: task.open,
        n_children: 0,
        open_animate: task.open_animate,
      });
      if (task.open == false) {
        return;
      }
      for (let i = 0; i < task.children.length; ++i) {
        task_walk(task.children[i], visible_order, level);
      }
    }

    this.visible_order = [];
    for (let i = 0; i < top_level.length; ++i) {
      let task = top_level[i];
      task_walk(task, this.visible_order, -1);
    }
  }

  task_visible() {
    this.sort_visible3();

    this.draw_task(0, this.list_length);

    for (let i = 0; i < this.v_split_gantt.length; i++) {
      this.v_split_gantt[i].v_task_visible_unsync(this);
    }
    for (let i = 0; i < this.h_split_gantt.length; i++) {
      this.h_split_gantt[i].h_task_visible_unsync(this);
    }
  }

  v_task_visible_unsync(src_gantt) {
    this.sort_visible3();

    this.draw_task(0, this.list_length);

    for (let i = 0; i < this.h_split_gantt.length; i++) {
      this.h_split_gantt[i].h_task_visible_unsync();
    }
    for (let i = 0; i < this.v_split_gantt.length; i++) {
      if (this.v_split_gantt[i] != src_gantt) {
        this.v_split_gantt[i].v_task_visible_unsync_endpoint();
      }
    }
  }
  v_task_visible_unsync_endpoint(src_gantt) {
    this.sort_visible3();

    this.draw_task(0, this.list_length);
  }

  h_task_visible_unsync(src_gantt) {
    this.sort_visible3();

    this.draw_task(0, this.list_length);

    for (let i = 0; i < this.v_split_gantt.length; i++) {
      this.v_split_gantt[i].v_task_visible_unsync();
    }
    for (let i = 0; i < this.h_split_gantt.length; i++) {
      if (this.h_split_gantt[i] != src_gantt) {
        this.h_split_gantt[i].h_task_visible_unsync_endpoint();
      }
    }
  }

  h_task_visible_unsync_endpoint(src_gantt) {
    this.sort_visible3();

    this.draw_task(0, this.list_length);
  }

  push_v_split_gantt(gantt) {
    this.v_split_gantt.push(gantt);
    this.v_split_id = 2;
  }

  push_h_split_gantt(gantt) {
    this.h_split_gantt.push(gantt);
    this.h_split_id = 2;
  }

  v_split() {
    let that = this;

    if (this.v_split_id == 2) {
      this.v_split2();
      return;
    }

    this.v_split_id = 1;
    function byId(id) {
      return document.getElementById(id);
    }

    if (this.v_split_gantt.length == 2) {
      console.log("no more v split");
      return;
    }

    let split_no = (this.v_split_gantt.length + 1).toString();
    let gantt = new CubicGantt("v_split_" + split_no);
    this.v_split_gantt.push(gantt);
    gantt.push_v_split_gantt(this);
    gantt.splitview = this.splitview;

    let split_number = this.v_split_gantt.length;
    let Id = "gantt_here_v_split_" + split_number.toString();
    gantt.gantt_id = Id;
    let gantt_face = document.getElementById("gantt_face");
    gantt_face.classList.add("split-view");
    gantt_face.classList.add("vertical");

    gantt.tasks = {};
    gantt.tasks = this.tasks;
    //let Id = "gantt_here2";
    let add_gantt_element = byId(Id);
    //if (add_gantt_element == null) {
    gantt_face = byId("gantt_face");

    let separator = document.createElement("div");
    separator.id = "v_split_spt_1";
    separator.classList.add("gutter");

    gantt_face.appendChild(separator); //	add button

    add_gantt_element = document.createElement("div");
    add_gantt_element.id = Id;
    gantt_face.appendChild(add_gantt_element);
    //}
    add_gantt_element.style.width = "100%";
    add_gantt_element.style.height = "100%";
    add_gantt_element.style.overflow = "visible";
    let gantt_here = document.getElementById("gantt_here");
    gantt_here.style.overflow = "visible";
    gantt_here.style.height = "100%";
    this.splitview.activate(document.getElementById("gantt_face"));
    //gantt_here.style.height = "45%";
    //add_gantt_element.style.height = "45%";

    this.splitview.initsplit(gantt_face);
    //this.reset();

    if (split_number == 1) {
      //----------------------------------------------------
      let cell = document.createElement("div");
      cell.classList.add("gantt_close_button");
      cell.addEventListener("click", function () {
        for (let i = 0; i < that.v_split_gantt.length; i++) {
          that.v_split_gantt[i].v_split_remove(that);
        }

        //that.h_split_gantt = [];
        for (let i = 0; i < that.v_split_gantt.length; i++) {
          if (that.v_split_gantt[i] === gantt) {
            that.v_split_gantt.splice(i, 1);
          }
        }

        let gantt_face = document.getElementById("gantt_face");
        gantt_face.classList.remove("split-view");
        gantt_face.classList.remove("vertical");
        add_gantt_element.remove();
        let gutter_element = document.getElementById("v_split_spt_1");
        gutter_element.remove();
        //that.splitview.activate(document.getElementById("gantt_face"));
        let gantt_here = document.getElementById("gantt_here");
        //gantt_here.style.height("calc(100%-5px)");
        gantt_here.style.height = "100%";
        that.resize();
      });

      cell.style.top = "2px";
      cell.style.right = "0px";
      //cell.style.position =  "relative";
      cell.style.position = "absolute";
      cell.style.width = "20px";
      cell.style.height = "20px";
      add_gantt_element.style.position = "relative";
      //add_gantt_element.appendChild(cell); //	add button

      //----------------------------------------------------

      //gantt.config = this.config;

      let clone_config = {};
      for (let key in this.config) {
        clone_config[key] = this.config[key];
      }
      gantt.config = clone_config;

      gantt.init_gantt(Id);

      add_gantt_element.appendChild(cell); //	add button
    }
  }
  v_split2() {
    let that = this;
    /*
    if (this.v_split_id = 2) {

            v_split2() ;
	    return;
    }
*/
    this.v_split_id = 2;
    function byId(id) {
      return document.getElementById(id);
    }

    //if (this.v_split_gantt.length == 2) {
    //  console.log("no more v split");
    //  return;
    //}

    let split_no = (this.v_split_gantt.length + 1).toString();
    //let gantt = new CubicGantt("v_split_" + split_no);
    let gantt = new CubicGantt("v_split_2");
    this.v_split_gantt.push(gantt);
    gantt.push_v_split_gantt(this);
    gantt.splitview = this.splitview;

    let split_number = this.v_split_gantt.length;
    //let Id = "gantt_here_v_split_" + split_number.toString();
    let Id = "gantt_here_v_split_2";
    gantt.gantt_id = Id;
    let gantt_face = document.getElementById("gantt_here_v_split_1");
    gantt_face.classList.add("split-view");
    gantt_face.classList.add("vertical");

    gantt.tasks = {};
    gantt.tasks = this.tasks;
    //let Id = "gantt_here2";
    let add_gantt_element = byId(Id);
    //if (add_gantt_element == null) {
    //gantt_face = byId("gantt_face");

    let separator = document.createElement("div");
    separator.id = "v_split_spt_2";
    separator.classList.add("gutter");

    gantt_face.appendChild(separator); //	add button

    add_gantt_element = document.createElement("div");
    add_gantt_element.id = Id;
    gantt_face.appendChild(add_gantt_element);
    add_gantt_element.addEventListener("splitresize", function (data) {
      //console.log("gantt_here resize", gantt.name);
      //gantt.reset();
      gantt.resize();
      //gantt.task_visible();
    });
    //}
    add_gantt_element.style.width = "100%";
    add_gantt_element.style.height = "100%";
    add_gantt_element.style.overflow = "visible";
    let gantt_here = document.getElementById("gantt_here");
    gantt_here.style.overflow = "visible";
    gantt_here.style.height = "100%";
    this.splitview.activate(document.getElementById("gantt_face"));
    //gantt_here.style.height = "45%";
    //add_gantt_element.style.height = "45%";

    this.splitview.initsplit(gantt_face);
    //this.reset();

    if (split_number == 2) {
      //----------------------------------------------------
      let cell = document.createElement("div");
      cell.classList.add("gantt_close_button");
      cell.addEventListener("click", function () {
        for (let i = 0; i < that.v_split_gantt.length; i++) {
          that.v_split_gantt[i].v_split_remove(that);
        }

        //that.h_split_gantt = [];
        for (let i = 0; i < that.v_split_gantt.length; i++) {
          if (that.v_split_gantt[i] === gantt) {
            that.v_split_gantt.splice(i, 1);
          }
        }

        let gantt_face = document.getElementById("gantt_face");
        gantt_face.classList.remove("split-view");
        gantt_face.classList.remove("vertical");
        add_gantt_element.remove();
        let gutter_element = document.getElementById("v_split_spt_1");
        gutter_element.remove();
        //that.splitview.activate(document.getElementById("gantt_face"));
        let gantt_here = document.getElementById("gantt_here");
        //gantt_here.style.height("calc(100%-5px)");
        gantt_here.style.height = "100%";
        that.resize();
      });

      cell.style.top = "2px";
      cell.style.right = "0px";
      //cell.style.position =  "relative";
      cell.style.position = "absolute";
      cell.style.width = "20px";
      cell.style.height = "20px";
      add_gantt_element.style.position = "relative";
      //add_gantt_element.appendChild(cell); //	add button

      //----------------------------------------------------

      //gantt.config = this.config;

      let clone_config = {};
      for (let key in this.config) {
        clone_config[key] = this.config[key];
      }
      gantt.config = clone_config;

      gantt.init_gantt(Id);

      add_gantt_element.appendChild(cell); //	add button
    }
  }

  h_split_on_v() {
    console.log("h_split_on_v");
    this.h_split_id = 1;

    function byId(id) {
      return document.getElementById(id);
    }

    if (this.h_split_gantt.length == 2) {
      console.log("no more h split");
      return;
    }
    let split_no = (this.h_split_gantt.length + 1).toString();
    let gantt = new CubicGantt("h_split_" + split_no);
    gantt.not_show_left_panel = true;
    gantt.visible_order = this.visible_order; /* visible_order link   */

    this.h_split_gantt.push(gantt);
    gantt.push_h_split_gantt(this);

    let split_number = this.h_split_gantt.length;
    let Id = "gantt_here_h_split_" + split_number.toString();
    gantt.gantt_id = Id;
    let gantt_face = document.getElementById("gantt_here"); /* split parent */
    gantt_face.classList.add("split-view");
    gantt_face.classList.add("horizontal");

    gantt.tasks = {};
    gantt.tasks = this.tasks;
    let add_gantt_element = byId(Id);
    //if (add_gantt_element == null) {
    gantt_face = byId("gantt_here");

    let separator = document.createElement("div");
    separator.id = "h_split_spt_1";
    separator.classList.add("gutter");

    gantt_face.appendChild(separator); //	add button

    add_gantt_element = document.createElement("div");
    add_gantt_element.id = Id;
    gantt_face.appendChild(add_gantt_element);

    add_gantt_element.addEventListener("splitresize", function (data) {
      //console.log("gantt_here resize", gantt.name);
      //gantt.reset();
      gantt.resize();
      //gantt.task_visible();
    });

    add_gantt_element.style.width = "100%";
    add_gantt_element.style.height = "100%";
    add_gantt_element.style.overflow = "visible";
    //add_gantt_element.style.overflow = "hidden";
    let gantt_here = document.getElementById("gantt_here");
    //gantt_here.style.overflow = "visible";
    gantt_here.children[0].style.overflow = "clip";
    gantt_here.style.height = "100%";
    gantt_here.style.width = "100%";
    //this.splitview.activate(document.getElementById("gantt_face"));
    this.splitview.activate(document.getElementById("gantt_here"));
    //gantt_here.style.height = "45%";
    //add_gantt_element.style.height = "45%";

    this.splitview.initsplit(gantt_face);

    //gantt.config = this.config;
    //gantt.init_gantt(Id);

    if (split_number == 1) {
      console.log("h_split add close button");
      //let gantt_element = byId("gantt_here");

      //gantt_element.classList.add("left");
      //gantt_element.style.width = "60%";
      //add_gantt_element.classList.add("left");
      //add_gantt_element.style.width = "40%";
      //this.task_visible();
      //----------------------------------------------------
      let cell = document.createElement("div");
      cell.classList.add("gantt_close_button");
      cell.addEventListener("click", function () {
        for (let i = 0; i < that.h_split_gantt.length; i++) {
          that.h_split_gantt[i].h_split_remove(that);
        }

        //that.h_split_gantt = [];
        for (let i = 0; i < that.h_split_gantt.length; i++) {
          if (that.h_split_gantt[i] === gantt) {
            that.h_split_gantt.splice(i, 1);
          }
        }

        gantt_face.classList.remove("split-view");
        gantt_face.classList.remove("horizontal");

        add_gantt_element.remove();
        that.task_visible(); /*GS  bug fix*/
        let gutter_element = document.getElementById("h_split_spt_1");
        gutter_element.remove();
        //that.splitview.activate(document.getElementById("gantt_face"));
        let gantt_here = document.getElementById("gantt_here");
        //gantt_here.style.height("calc(100%-5px)");
        gantt_here.style.width = "100%";
        that.resize();
      });

      cell.style.top = "2px";
      cell.style.right = "10px";
      //cell.style.left = "10px";
      //cell.style.position =  "relative";
      cell.style.position = "absolute";
      cell.style.width = "20px";
      cell.style.height = "20px";
      cell.style.zIndex = "20000";
      add_gantt_element.style.position = "relative";
      //add_gantt_element.appendChild(cell); //	add button
      gantt.config = this.config;
      gantt.init_gantt(Id);
      add_gantt_element.appendChild(cell); //	add button
    }
  }

  h_split_on_v2() {
    console.log("h_split_on_v");
    this.h_split_id = 1;

    function byId(id) {
      return document.getElementById(id);
    }

    if (this.h_split_gantt.length == 2) {
      console.log("no more h split");
      return;
    }
    let split_no = (this.h_split_gantt.length + 1).toString();
    let gantt = new CubicGantt("h_split_" + split_no);
    gantt.not_show_left_panel = true;
    gantt.visible_order = this.visible_order; /* visible_order link   */

    this.h_split_gantt.push(gantt);
    gantt.push_h_split_gantt(this);
    gantt.splitview = this.splitview;

    let split_number = this.h_split_gantt.length;
    let Id = "gantt_here_h_split_" + split_number.toString();
    gantt.gantt_id = Id;
    let gantt_face = document.getElementById(
      "gantt_here_v_split_1",
    ); /* split parent */
    gantt_face.classList.add("split-view");
    gantt_face.classList.add("horizontal");

    gantt.tasks = {};
    gantt.tasks = this.tasks;
    let add_gantt_element = byId(Id);
    //if (add_gantt_element == null) {
    gantt_face = byId("gantt_here_v_split_1");

    let gantt_close_button = gantt_face.querySelector(".gantt_close_button");
    gantt_face.removeChild(gantt_close_button);

    let separator = document.createElement("div");
    separator.id = "h_split_spt_1";
    separator.classList.add("gutter");

    gantt_face.appendChild(separator); //	add button

    add_gantt_element = document.createElement("div");
    add_gantt_element.id = Id;
    gantt_face.appendChild(add_gantt_element);

    add_gantt_element.addEventListener("splitresize", function (data) {
      //console.log("gantt_here resize", gantt.name);
      //gantt.reset();
      gantt.resize();
      //gantt.task_visible();
    });

    add_gantt_element.style.width = "100%";
    add_gantt_element.style.height = "100%";
    add_gantt_element.style.overflow = "visible";
    //add_gantt_element.style.overflow = "hidden";
    let gantt_here = document.getElementById("gantt_here_v_split_1");
    //gantt_here.style.overflow = "visible";
    gantt_here.children[0].style.overflow = "clip";
    gantt_here.style.height = "100%";
    gantt_here.style.width = "100%";
    this.splitview.activate(document.getElementById("gantt_face"));
    //this.splitview.activate(document.getElementById("gantt_here_v_split_1"));
    //gantt_here.style.height = "45%";
    //add_gantt_element.style.height = "45%";

    this.splitview.initsplit(gantt_here);

    //gantt.config = this.config;
    //gantt.init_gantt(Id);

    if (split_number == 1) {
      console.log("h_split add close button");
      let cell = document.createElement("div");
      cell.classList.add("gantt_close_button");
      cell.addEventListener("click", function () {
        for (let i = 0; i < that.h_split_gantt.length; i++) {
          that.h_split_gantt[i].h_split_remove(that);
        }

        //that.h_split_gantt = [];
        for (let i = 0; i < that.h_split_gantt.length; i++) {
          if (that.h_split_gantt[i] === gantt) {
            that.h_split_gantt.splice(i, 1);
          }
        }

        gantt_face.classList.remove("split-view");
        gantt_face.classList.remove("horizontal");

        add_gantt_element.remove();
        that.task_visible(); /*GS  bug fix*/
        let gutter_element = document.getElementById("h_split_spt_1");
        gutter_element.remove();
        //that.splitview.activate(document.getElementById("gantt_face"));
        let gantt_here = document.getElementById("gantt_here");
        //gantt_here.style.height("calc(100%-5px)");
        gantt_here.style.width = "100%";
        that.resize();
      });

      cell.style.top = "2px";
      cell.style.right = "10px";
      //cell.style.left = "10px";
      //cell.style.position =  "relative";
      cell.style.position = "absolute";
      cell.style.width = "20px";
      cell.style.height = "20px";
      cell.style.zIndex = "20000";
      add_gantt_element.style.position = "relative";
      //add_gantt_element.appendChild(cell); //	add button
      gantt.config = this.config;
      gantt.init_gantt(Id);
      add_gantt_element.appendChild(cell); //	add button
    }
  }

  h_split() {
    let that = this;

    console.log("v_split_id", this.v_split_id);

    if (this.v_split_id == 1) {
      this.h_split_on_v();
      return;
    }
    if (this.v_split_id == 2) {
      this.h_split_on_v2();
      return;
    }

    this.h_split_id = 1;

    function byId(id) {
      return document.getElementById(id);
    }

    if (this.h_split_gantt.length == 2) {
      console.log("no more h split");
      return;
    }
    let split_no = (this.h_split_gantt.length + 1).toString();
    let gantt = new CubicGantt("h_split_" + split_no);
    gantt.not_show_left_panel = true;
    gantt.visible_order = this.visible_order; /* visible_order link   */

    this.h_split_gantt.push(gantt);
    gantt.push_h_split_gantt(this);

    let split_number = this.h_split_gantt.length;
    let Id = "gantt_here_h_split_" + split_number.toString();
    gantt.gantt_id = Id;
    let gantt_face = document.getElementById("gantt_face");
    gantt_face.classList.add("split-view");
    gantt_face.classList.add("horizontal");

    gantt.tasks = {};
    gantt.tasks = this.tasks;
    let add_gantt_element = byId(Id);
    //if (add_gantt_element == null) {
    gantt_face = byId("gantt_face");

    let separator = document.createElement("div");
    separator.id = "h_split_spt_1";
    separator.classList.add("gutter");

    gantt_face.appendChild(separator); //	add button

    add_gantt_element = document.createElement("div");
    add_gantt_element.id = Id;
    gantt_face.appendChild(add_gantt_element);

    add_gantt_element.addEventListener("splitresize", function (data) {
      //console.log("gantt_here resize", gantt.name);
      //gantt.reset();
      gantt.resize();
      //gantt.task_visible();
    });

    add_gantt_element.style.width = "100%";
    add_gantt_element.style.height = "100%";
    add_gantt_element.style.overflow =
      "visible"; /* BUG FIX  resize  scroll set */
    //add_gantt_element.style.overflow = "hidden";
    let gantt_here = document.getElementById("gantt_here");
    gantt_here.style.overflow = "visible";
    //gantt_here.children[0].style.overflow = "clip";  /* fix */
    gantt_here.style.height = "100%";
    gantt_here.style.width = "100%";
    this.splitview.activate(document.getElementById("gantt_face"));
    //gantt_here.style.height = "45%";
    //add_gantt_element.style.height = "45%";

    this.splitview.initsplit(gantt_face);

    //gantt.config = this.config;
    //gantt.init_gantt(Id);

    if (split_number == 1) {
      console.log("h_split add close button");
      //let gantt_element = byId("gantt_here");

      //gantt_element.classList.add("left");
      //gantt_element.style.width = "60%";
      //add_gantt_element.classList.add("left");
      //add_gantt_element.style.width = "40%";
      //this.task_visible();
      //----------------------------------------------------
      let cell = document.createElement("div");
      cell.classList.add("gantt_close_button");
      cell.addEventListener("click", function () {
        for (let i = 0; i < that.h_split_gantt.length; i++) {
          that.h_split_gantt[i].h_split_remove(that);
        }

        //that.h_split_gantt = [];
        for (let i = 0; i < that.h_split_gantt.length; i++) {
          if (that.h_split_gantt[i] === gantt) {
            that.h_split_gantt.splice(i, 1);
          }
        }

        gantt_face.classList.remove("split-view");
        gantt_face.classList.remove("horizontal");

        add_gantt_element.remove();
        that.task_visible(); /*GS  bug fix*/
        let gutter_element = document.getElementById("h_split_spt_1");
        gutter_element.remove();
        //that.splitview.activate(document.getElementById("gantt_face"));
        let gantt_here = document.getElementById("gantt_here");
        //gantt_here.style.height("calc(100%-5px)");
        gantt_here.style.width = "100%";
        that.resize();
      });

      cell.style.top = "2px";
      cell.style.right = "10px";
      //cell.style.left = "10px";
      //cell.style.position =  "relative";
      cell.style.position = "absolute";
      cell.style.width = "20px";
      cell.style.height = "20px";
      cell.style.zIndex = "20000";
      add_gantt_element.style.position = "relative";
      //add_gantt_element.appendChild(cell); //	add button
      gantt.config = this.config;
      gantt.init_gantt(Id);
      add_gantt_element.appendChild(cell); //	add button
    }

    // this.task_visible(); /*GS  bug fix*/
  }

  v_split_remove(element) {
    for (let i = 0; i < this.v_split_gantt.length; i++) {
      if (this.v_split_gantt[i] === element) {
        this.v_split_gantt.splice(i, 1);
      }
    }
  }

  h_split_remove(element) {
    for (let i = 0; i < this.h_split_gantt.length; i++) {
      if (this.h_split_gantt[i] === element) {
        this.h_split_gantt.splice(i, 1);
      }
    }
  }

  h_scroll(value) {
    // v_sync
    //console.log(this.name, "h_scroll");
    if (document.getElementById("v_sync").checked) {
      for (let i = 0; i < this.v_split_gantt.length; i++) {
        this.v_split_gantt[i].v_split_h_scroll_sync(value);
      }
    }
  }
  v_split_h_scroll_sync(value) {
    // v_sync
    //console.log(this.name, "v_split_h_scroll_sync");
    const slider = this.obj_gantt.querySelector(".right_content_hscroll");
    slider.scrollLeft = value;
  }

  h_split_v_scroll_sync(value) {
    let gantt_data_area = this.obj_gantt.querySelector(".gantt_data_area");
    gantt_data_area.scrollTop = value;
    let gantt_grid_data = this.obj_gantt.querySelector(".gantt_grid_data");
    gantt_grid_data.scrollTop = value;
    this.draw_task(0, this.list_length); /* fix */
  }

  reset() {
    console.log("reset", this.name);
    this.reset_visible(document.getElementById(this.gantt_id));
    for (let i = 0; i < this.v_split_gantt.length; i++) {
      this.v_split_gantt[i].reset_unsync();
    }
    for (let i = 0; i < this.h_split_gantt.length; i++) {
      this.h_split_gantt[i].reset_unsync();
    }
  }

  reset_unsync() {
    this.reset_visible(document.getElementById(this.gantt_id));
  }
  reset_visible(obj_gantt) {
    let that = this;
    console.log("reset_visible", this.name);
    //this.sort_visible2();
    this.sort_visible3();

    //	remove child
    obj_gantt
      .querySelectorAll("div")
      .forEach((e) => e.parentNode.removeChild(e));

    //	init config
    this.date_count = this.date_diff(
      "D",
      this.config.start_date,
      this.config.end_date,
    );
    this.list_length = this.visible_order.length;
    this.subscales_height =
      this.config.subscale_height * this.config.subscales.length + 1;

    if (this.resize_left_width != null) {
      this.left_width = this.resize_left_width;
    } else {
      this.left_width = 0;
      for (let el of this.config.left_type) {
        this.left_width += parseInt(el.width, 10);
      }
      this.left_width += 50;
    }

    //	draw div
    this.draw_div(obj_gantt);

    //	calc width, height
    this.calc_size(obj_gantt);

    //	draw menu
    if (this.is_show_grid()) {
      this.draw_menu(obj_gantt);
    }
    //	draw date
    this.draw_date(obj_gantt);

    //	define show_vertical_count & show_horizontal_count
    this.show_vertical_count =
      Math.ceil(
        (this.total_height - 2 - this.scroll_size - this.subscales_height - 2) /
          this.config.min_column_height,
      ) + 1;
    this.show_horizontal_count =
      Math.ceil(
        (this.total_width - 2 - this.left_width) / this.config.min_column_width,
      ) + 1;

    //	add scroll, wheel event
    obj_gantt.addEventListener("wheel", this.event_wheel.bind(this));
    obj_gantt
      .querySelector(".gantt_ver_scroll")
      .addEventListener("scroll", this.event_vertical_scroll.bind(this));
    obj_gantt
      .querySelector(".gantt_hor_scroll")
      .addEventListener("scroll", this.event_horizontal_scroll.bind(this));
    /*

document.onkeydown = function(e) {
    switch (e.keyCode) {
        case 37:
            alert("left"); //show the message saying left"
            break;
        case 38:
            alert("up"); //show the message saying up"
            break;
        case 39:
            alert("right"); //show the message saying right"
            break;
        case 40:
            alert("down"); //show the message saying down"
            break;
    }
};
*/
    /*  bug delete
		if (this.show_vertical_count > this.list_length) {
			this.draw_task(0, this.list_length);
		} else {
			//	fire scroll event, cf) chrome, firefox scrollTo(0, 0) not working.
			obj_gantt.querySelector('.gantt_ver_scroll').scrollTo(0, 1);
			obj_gantt.querySelector('.gantt_ver_scroll').scrollTo(0, -1);
			obj_gantt.querySelector('.gantt_ver_scroll').scrollTo(0, this.last_vscroll_position);
			
			obj_gantt.querySelector('.gantt_hor_scroll').scrollTo(1, 0);
			obj_gantt.querySelector('.gantt_hor_scroll').scrollTo(-1, 0);
			obj_gantt.querySelector('.gantt_hor_scroll').scrollTo(this.last_hscroll_position, 0);
		}
                */
    // bug append
    this.draw_task(0, this.list_length);

    //------------------------------------  right panel h scroll    /*GS*/

    //const slider = document.querySelector(".right_content_hscroll");
    const slider = obj_gantt.querySelector(".right_content_hscroll");
    //const sliders = document.querySelectorAll(".right_content_hscroll");
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener("mousedown", (e) => {
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener("mouseleave", () => {
      isDown = false;
      slider.classList.remove("active");
    });
    slider.addEventListener("mouseup", () => {
      isDown = false;
      slider.classList.remove("active");
    });
    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      //console.log("right_pane_h_scroll");
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 3; //scroll-fast
      slider.scrollLeft = scrollLeft - walk;
      that.h_scroll(slider.scrollLeft);
    });

    //-------------------------------------

    if (this.config.fn_after_reset != null) {
      this.config.fn_after_reset({
        left_width: this.left_width,
        min_column_width: this.config.min_column_width,
        min_column_height: this.config.min_column_height,
        total_width: this.total_width,
        date_count: this.date_count,
        scroll_left: this.last_hscroll_position,
      });
    }
  }

  draw_div(obj_gantt) {
    let main_content = document.createElement("div");
    main_content.classList.add("gantt_layout_cell");
    main_content.classList.add("gantt_layout_root");
    main_content.classList.add("gantt_layout");
    main_content.classList.add("gantt_layout_y");
    main_content.classList.add("gantt_container");
    main_content.classList.add("gantt_layout_cell_border_left");
    main_content.classList.add("gantt_layout_cell_border_top");
    main_content.classList.add("gantt_layout_cell_border_right");
    main_content.classList.add("gantt_layout_cell_border_bottom");
    main_content.style.padding = "0px";
    obj_gantt.appendChild(main_content);

    this.draw_div_content(obj_gantt);
    this.draw_div_horizontal(obj_gantt);
  }
  draw_div_content(obj_gantt) {
    let that = this;
    let main_content = obj_gantt.children[0];

    let content_wrapper = document.createElement("div");
    content_wrapper.classList.add("gantt_layout_cell");
    content_wrapper.classList.add("gantt_layout");
    content_wrapper.classList.add("gantt_layout_x");
    content_wrapper.classList.add("gantt_layout_cell_border_transparent");
    content_wrapper.classList.add("gantt_layout_cell_border_bottom");
    content_wrapper.style.marginBottom = "0px";
    content_wrapper.style.padding = "0px";

    //	left menu
    let div_left_menu = document.createElement("div");
    div_left_menu.classList.add("gantt_layout_cell");
    div_left_menu.classList.add("grid_cell");
    div_left_menu.classList.add("gantt_layout_outer_scroll");
    div_left_menu.classList.add("gantt_layout_outer_scroll_vertical");
    div_left_menu.classList.add("gantt_layout_outer_scroll");
    div_left_menu.classList.add("gantt_layout_outer_scroll_horizontal");
    div_left_menu.classList.add("gantt_layout_cell_border_right");
    div_left_menu.style.marginRight = "0px";

    let gantt_layout_content = document.createElement("div");
    gantt_layout_content.classList.add("gantt_layout_content");

    let gantt_grid = document.createElement("div");
    gantt_grid.classList.add("gantt_grid");
    gantt_grid.style.height = "inherit";
    gantt_grid.style.width = "inherit";

    let gantt_grid_panel = document.createElement("div"); /*GS*/
    gantt_grid_panel.classList.add("gantt_grid_panel");
    gantt_grid_panel.style.width = "inherit";
    gantt_grid_panel.style.height = "22px";

    let gantt_grid_index = document.createElement("div"); /*GS*/
    gantt_grid_index.classList.add("gantt_grid_index");
    gantt_grid_index.style.width = "inherit";
    gantt_grid_index.style.overflow = "hidden";
    gantt_grid_index.style.height = "43px";

    //	button element
    let bw = 20; //but
    // left
    let cell = null;
    //----------------------------------------------------   <=
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_button");
    cell.classList.add("gantt_menu_level_left");
    cell.style.float = "right";
    if (!this.is_show_grid()) {
      cell.style.marginTop = "70px";
    }
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      if (that.show_level == 0) {
        return;
      }
      that.show_level = that.show_level - 1;
      that.reset();
    });

    cell.style.width = bw + "px";
    gantt_grid_panel.appendChild(cell); //	add button

    //----------------------------------------------------

    if (this.is_show_grid()) {
      cell = document.createElement("div"); // TEXT node
      //cell.classList.add("gantt_menu_button");
      cell.classList.add("gantt_menu_text_label");
      cell.innerHTML = that.show_level;
      //let text = document.createTextNode(that.show_level);
      //cell.appendChild(text); //	add button

      cell.style.float = "right";
      cell.style.marginTop = "-18px";
      cell.style.marginRight = "8px";
      cell.style.textAlign = "center";

      cell.style.width = bw + "px";
      gantt_grid_panel.appendChild(cell); //	add button
    } else {
      cell = document.createElement("div"); // TEXT node
      //cell.classList.add("gantt_menu_button");
      cell.classList.add("gantt_menu_text_label");
      cell.innerHTML = that.show_level;
      //let text = document.createTextNode(that.show_level);
      //cell.appendChild(text); //	add button

      cell.style.float = "right";
      cell.style.marginTop = "-18px";
      cell.style.marginRight = "2px";
      cell.style.textAlign = "left";

      cell.style.width = bw + "px";
      gantt_grid_panel.appendChild(cell); //	add button
    }

    //----------------------------------------------------  =>
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_button");
    cell.classList.add("gantt_menu_level_right");
    cell.style.float = "right";
    if (!this.is_show_grid()) {
      cell.style.marginTop = "18px";
    }
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      if (that.show_level == that.max_level) {
        return;
      }
      that.show_level = that.show_level + 1;
      that.reset();
    });

    cell.style.width = bw + "px";
    gantt_grid_panel.appendChild(cell); //	add button

    // right
    //----------------------------------------------------  Y
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_text_button");
    cell.style.float = "right";
    cell.style.marginTop = "-18px";
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      //that.v_split();
      that.config.min_column_width = 4;
      that.reset();
    });

    let cell_inner_text = document.createTextNode("Y");
    cell.appendChild(cell_inner_text);
    cell.style.width = bw + "px";
    cell.style.textAlign = "center";
    gantt_grid_panel.appendChild(cell); //	add button

    //---------------------------------------------------- Q
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_text_button");
    cell.style.float = "right";
    cell.style.marginTop = "-18px";
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      //that.v_split();
      that.config.min_column_width = 15;
      that.reset();
    });

    cell_inner_text = document.createTextNode("Q");
    cell.appendChild(cell_inner_text);
    cell.style.width = bw + "px";
    cell.style.textAlign = "center";
    gantt_grid_panel.appendChild(cell); //	add button

    //---------------------------------------------------- M
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_text_button");
    cell.style.float = "right";
    cell.style.marginTop = "-18px";
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      that.config.min_column_width = 40;
      that.reset();
    });

    cell_inner_text = document.createTextNode("M");
    cell.appendChild(cell_inner_text);
    cell.style.width = bw + "px";
    cell.style.textAlign = "center";
    gantt_grid_panel.appendChild(cell); //	add button

    //---------------------------------------------------- W
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_text_button");
    cell.style.float = "right";
    cell.style.marginTop = "-18px";
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      that.config.min_column_width = 100;
      that.reset();
    });

    cell_inner_text = document.createTextNode("W");
    cell.appendChild(cell_inner_text);
    cell.style.width = bw + "px";
    cell.style.textAlign = "center";
    gantt_grid_panel.appendChild(cell); //	add button

    //----------------------------------------------------
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_button");
    cell.classList.add("gantt_menu_v_split");
    cell.style.float = "right";
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      that.v_split();
    });

    cell.style.width = bw + "px";
    gantt_grid_panel.appendChild(cell); //	add button

    //----------------------------------------------------
    cell = document.createElement("div");
    cell.classList.add("gantt_menu_button");
    cell.classList.add("gantt_menu_h_split");
    cell.style.float = "right";
    cell.style.marginRight = "8px";
    cell.addEventListener("click", function () {
      that.h_split();
    });

    cell.style.width = bw + "px";
    gantt_grid_panel.appendChild(cell); //	add button

    if (this.is_show_grid()) {
      //----------------------------------------------------
      cell = document.createElement("div");
      cell.classList.add("gantt_menu_button");
      cell.classList.add("gantt_menu_edit");
      cell.style.float = "right";
      cell.style.marginRight = "8px";
      cell.addEventListener("click", function () {
        if (that.gantt_left_edit) {
          that.gantt_left_edit = false;
        } else {
          that.gantt_left_edit = true;
        }
        that.reset();
      });

      cell.style.width = bw + "px";
      gantt_grid_panel.appendChild(cell); //	add button
      //----------------------------------------------------
      cell = document.createElement("div");
      cell.classList.add("gantt_menu_button");
      cell.classList.add("gantt_menu_code");
      cell.style.float = "right";
      cell.style.marginRight = "8px";
      cell.addEventListener("click", function () {
        let code = that.dump();
        if (that.gantt_code_editor == null) {
		 console.log("ace edit");
          let obj_ = document.getElementById("gantt_face");
          let main_content = document.createElement("div");
          main_content.id = "codeeditor";
          main_content.style.height = "300px";
          obj_.appendChild(main_content);
          let session = ace.createEditSession(code);
          that.gantt_code_editor = ace.edit("codeeditor");
          that.gantt_code_editor.setSession(session);
        } else {
          that.gantt_code_editor.container.remove();
          that.gantt_code_editor.destroy();
          that.gantt_code_editor = null;
        }
        /*
                           if (that.gant_left_edit ) {
                                  that.gant_left_edit = false;
   			          ace.edit("editor");


			   } else {
                                  that.gant_left_edit = true;

			   }
			   that.reset();
			   */
      });

      cell.style.width = bw + "px";
      gantt_grid_panel.appendChild(cell); //	add button
    }
    let gantt_grid_scale = document.createElement("div");
    gantt_grid_scale.classList.add("gantt_grid_scale");
    gantt_grid_scale.style.width = "inherit";
    gantt_grid_scale.style.innerHTML = "TEST";

    let gantt_grid_data = document.createElement("div");
    gantt_grid_data.classList.add("gantt_grid_data");
    gantt_grid_data.classList.add("left_menu_vscroll");
    gantt_grid_data.style.width = "inherit";

    let hidden_height = document.createElement("div");
    hidden_height.classList.add("hidden_height");
    hidden_height.style.visibility = "hidden";
    hidden_height.style.width = "1px";

    gantt_grid_data.appendChild(hidden_height);

    gantt_grid.appendChild(gantt_grid_scale);
    gantt_grid_scale.appendChild(gantt_grid_panel); /*GS*/
    if (this.is_show_grid()) {
      gantt_grid_scale.appendChild(gantt_grid_index); /*GS*/
    }
    gantt_grid.appendChild(gantt_grid_data);
    gantt_layout_content.appendChild(gantt_grid);
    div_left_menu.appendChild(gantt_layout_content);

    content_wrapper.appendChild(div_left_menu);

    //	resizer
    let div_resizer = document.createElement("div");
    div_resizer.classList.add("gantt_layout_cell");
    div_resizer.classList.add("gantt_resizer");
    div_resizer.classList.add("gantt_resizer_x");
    div_resizer.classList.add("gantt_layout_cell_border_right");
    div_resizer.style.marginRight = "-1px";
    div_resizer.style.width = "1px";
    div_resizer.style.overflow = "visible";

    let resizer_content = document.createElement("div");
    resizer_content.classList.add("gantt_layout_content");
    resizer_content.classList.add("gantt_resizer_x");
    resizer_content.classList.add("gantt_grid_resize_wrap");

    div_resizer.appendChild(resizer_content);
    div_resizer.addEventListener("mousedown", function (e) {
      //e.preventDefault(); //  drag로 인한 highlight 해제시켜줌.
      e.stopPropagation(); /*GS*/
      let resizer_stick = document.createElement("div");
      resizer_stick.classList.add("gantt_resizer_stick");
      resizer_stick.style.height = that.total_height + "px";

      div_resizer.appendChild(resizer_stick);

      for (let el of content_wrapper.children) {
        if (el.classList.contains("gantt_layout_outer_scroll")) {
          el.classList.add("gantt_resizing");
        }
      }

      that.is_div_resize = true;
    });
    content_wrapper.addEventListener("mousemove", function (event) {
      event.stopPropagation(); /*GS*/
      if (that.is_div_resize) {
        div_resizer.querySelector(".gantt_resizer_stick").style.left =
          event.clientX - div_resizer.getBoundingClientRect().left + "px";
      }
    });
    content_wrapper.addEventListener("mouseup", function (event) {
      event.stopPropagation(); /*GS*/
      if (that.is_div_resize) {
        that.is_div_resize = false;
        that.resize_left_width =
          that.left_width +
          (that.px_to_int(
            div_resizer.querySelector(".gantt_resizer_stick").style.left,
          ) || 0);
        that.reset_visible(document.getElementById(that.gantt_id));
      }
    });

    content_wrapper.appendChild(div_resizer);

    //	right content
    let div_right_content = document.createElement("div");
    div_right_content.classList.add("gantt_layout_cell");
    div_right_content.classList.add("timeline_cell");
    div_right_content.classList.add("gantt_layout_outer_scroll");
    div_right_content.classList.add("gantt_layout_outer_scroll_vertical");
    div_right_content.classList.add("gantt_layout_outer_scroll");
    div_right_content.classList.add("gantt_layout_outer_scroll_horizontal");
    div_right_content.style.marginRight = "0px";

    let right_content_content = document.createElement("div");
    right_content_content.classList.add("gantt_layout_content");

    let gantt_task = document.createElement("div");
    gantt_task.classList.add("gantt_task");
    gantt_task.classList.add("right_content_hscroll");
    gantt_task.style.width = "inherit";
    gantt_task.style.height = "inherit";

    let gantt_task_scale = document.createElement("div");
    gantt_task_scale.classList.add("gantt_task_scale");

    gantt_task.appendChild(gantt_task_scale);

    let gantt_data_area = document.createElement("div");
    gantt_data_area.classList.add("gantt_data_area");
    gantt_data_area.classList.add("right_content_vscroll");

    //==================
    //let gantt_data_area_svg = document.createElement("svg");
    let gantt_data_area_svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

    gantt_data_area.style.position = "relative";
    gantt_data_area_svg.style.position = "absolute";
    gantt_data_area_svg.style.top = "0px";
    gantt_data_area_svg.style.left = "0px";
    gantt_data_area_svg.style.width = "100%";
    gantt_data_area_svg.style.height = "100%";
    gantt_data_area_svg.style.zIndex = "900";
    //gantt_data_area_svg.style.overflow = "hidden";
    gantt_data_area_svg.style.overflow = "visible";
    gantt_data_area_svg.style.pointerEvents = "none";

    gantt_data_area.appendChild(gantt_data_area_svg);

    this.gantt_data_area_svg = gantt_data_area_svg;

    //let c = document.createElement("circle");
    let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    c.setAttribute("cx", "300");
    c.setAttribute("cy", "300");
    c.setAttribute("r", "100");
    c.setAttribute("fill", "red");
    gantt_data_area_svg.appendChild(c);
    //==================

    //	gantt_data_area drag
    gantt_data_area.addEventListener("mouseleave", onMouseUp);
    gantt_data_area.addEventListener("mouseup", onMouseUp);

    gantt_data_area.addEventListener("scroll", onScroll_v);

    let step = this.config.min_column_width;

    function onScroll_v(event) {
      for (let i = 0; i < that.h_split_gantt.length; i++) {
        that.h_split_gantt[i].h_split_v_scroll_sync(gantt_data_area.scrollTop);
      }
    }

    function onMouseUp(event) {
      //event.stopPropagation();  /*GS*/
      function format_date(d) {
        let month = "" + (d.getMonth() + 1);
        let day = "" + d.getDate();
        let year = d.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        return [year, month, day].join("-");
      }

      if (that.is_gantt_move) {
        let calc_left =
          event.clientX -
          gantt_data_area.getBoundingClientRect().left -
          that.mouse_x;
        let temp = calc_left % step;
        calc_left += temp * 2 >= step ? step - temp : -temp;
        that.target_gantt.style.left = calc_left + "px";

        //	modify
        let task_idx = that.target_gantt.getAttribute("task_idx");

        let temp_days =
          that.date_diff(
            "D",
            that.tasks.data[that.visible_order[task_idx].index].start_date,
            that.tasks.data[that.visible_order[task_idx].index].end_date,
          ) - 1;

        that.tasks.data[that.visible_order[task_idx].index].start_date =
          that.date_add(
            "D",
            that.config.start_date,
            Math.floor(
              that.px_to_int(that.target_gantt.style.left) /
                that.config.min_column_width,
            ),
          );
        that.tasks.data[that.visible_order[task_idx].index].end_date =
          that.date_add(
            "D",
            that.tasks.data[that.visible_order[task_idx].index].start_date,
            temp_days,
          );

        // left d_start/d_end update
        that.tasks.data[that.visible_order[task_idx].index].d_start =
          format_date(
            that.tasks.data[that.visible_order[task_idx].index].start_date,
          );
        that.tasks.data[that.visible_order[task_idx].index].d_end = format_date(
          that.tasks.data[that.visible_order[task_idx].index].end_date,
        );

        //	trigger gantt_change event
        obj_gantt.dispatchEvent(
          new CustomEvent("gantt_change", {
            bubbles: true,
            detail: {
              task: that.tasks.data[that.visible_order[task_idx].index],
            },
          }),
        );

        that.is_gantt_move = false;
        that.task_visible(document.getElementById(that.gantt_id));
      } else if (that.is_gantt_resize_left) {
        let calc_width = that.px_to_int(that.target_gantt.style.width);
        let temp = calc_width % step;
        calc_width += temp * 2 >= step ? step - temp : -temp;
        that.target_gantt.style.width = calc_width + "px";

        let calc_left = that.px_to_int(that.target_gantt.style.left);
        temp = calc_left % step;
        calc_left += temp * 2 >= step ? step - temp : -temp;
        that.target_gantt.style.left = calc_left + "px";

        //	modify
        let task_idx = that.target_gantt.getAttribute("task_idx");

        let temp_days = Math.floor(calc_width / that.config.min_column_width);

        that.tasks.data[that.visible_order[task_idx].index].start_date =
          that.date_add(
            "D",
            that.tasks.data[that.visible_order[task_idx].index].end_date,
            -temp_days + 1,
          );

        // left d_start/d_end update
        that.tasks.data[that.visible_order[task_idx].index].d_start =
          format_date(
            that.tasks.data[that.visible_order[task_idx].index].start_date,
          );
        that.tasks.data[that.visible_order[task_idx].index].d_end = format_date(
          that.tasks.data[that.visible_order[task_idx].index].end_date,
        );

        //	trigger gantt_change event
        obj_gantt.dispatchEvent(
          new CustomEvent("gantt_change", {
            bubbles: true,
            detail: {
              task: that.tasks.data[that.visible_order[task_idx].index],
            },
          }),
        );

        that.is_gantt_resize_left = false;
        that.task_visible(document.getElementById(that.gantt_id));
      } else if (that.is_gantt_resize_right) {
        let calc_width = that.px_to_int(that.target_gantt.style.width);
        let temp = calc_width % step;
        calc_width += temp * 2 >= step ? step - temp : -temp;
        that.target_gantt.style.width = calc_width + "px";

        //	modify
        let task_idx = that.target_gantt.getAttribute("task_idx");
        let temp_days = Math.floor(calc_width / that.config.min_column_width);

        that.tasks.data[that.visible_order[task_idx].index].end_date =
          that.date_add(
            "D",
            that.tasks.data[that.visible_order[task_idx].index].start_date,
            temp_days - 1,
          );

        // left d_start/d_end update
        that.tasks.data[that.visible_order[task_idx].index].d_start =
          format_date(
            that.tasks.data[that.visible_order[task_idx].index].start_date,
          );
        that.tasks.data[that.visible_order[task_idx].index].d_end = format_date(
          that.tasks.data[that.visible_order[task_idx].index].end_date,
        );

        //	trigger gantt_change event
        obj_gantt.dispatchEvent(
          new CustomEvent("gantt_change", {
            bubbles: true,
            detail: {
              task: that.tasks.data[that.visible_order[task_idx].index],
            },
          }),
        );

        that.is_gantt_resize_right = false;
        that.task_visible(document.getElementById(that.gantt_id));
      } else if (that.is_gantt_progress) {
        that.is_gantt_progress = false;

        let task_idx = that.target_gantt.getAttribute("task_idx");
        //	trigger gantt_change event
        obj_gantt.dispatchEvent(
          new CustomEvent("gantt_change", {
            bubbles: true,
            detail: {
              task: that.tasks.data[that.visible_order[task_idx].index],
            },
          }),
        );
      }
    }

    gantt_data_area.addEventListener("mousemove", onMouseMove);

    function onMouseMove(event) {
      //event.stopPropagation();  /*GS*/
      if (that.is_gantt_move) {
        that.target_gantt.style.left =
          event.clientX -
          gantt_data_area.getBoundingClientRect().left -
          that.mouse_x +
          "px";
      } else if (that.is_gantt_resize_left) {
        let _l =
          event.clientX -
          gantt_data_area.getBoundingClientRect().left -
          that.mouse_x;
        let _w = that.gantt_width + that.gantt_x - event.clientX;
        if (_w <= that.config.min_column_width) {
          _w = that.config.min_column_width;
          _l =
            that.gantt_x +
            that.gantt_width -
            that.config.min_column_width -
            gantt_data_area.getBoundingClientRect().left -
            that.mouse_x;
        }

        let task_idx = that.target_gantt.getAttribute("task_idx");
        let _result =
          that.tasks.data[that.visible_order[task_idx].index].progress || 0;
        that.target_gantt.querySelector(".gantt_task_progress").style.width =
          (_result / 100) * _w + "px";
        that.target_gantt.querySelector(
          ".gantt_task_progress_drag",
        ).style.left = (_result / 100) * _w + "px";

        that.target_gantt.style.left = _l + "px";
        that.target_gantt.style.width = _w + "px";
      } else if (that.is_gantt_resize_right) {
        let _w = that.gantt_width + event.clientX - that.mouse_x;
        if (_w <= that.config.min_column_width) {
          _w = that.config.min_column_width;
        }

        let task_idx = that.target_gantt.getAttribute("task_idx");
        let _result =
          that.tasks.data[that.visible_order[task_idx].index].progress || 0;
        that.target_gantt.querySelector(".gantt_task_progress").style.width =
          (_result / 100) * _w + "px";
        that.target_gantt.querySelector(
          ".gantt_task_progress_drag",
        ).style.left = (_result / 100) * _w + "px";

        that.target_gantt.style.width = _w + "px";
      } else if (that.is_gantt_progress) {
        let max_width = that.px_to_int(that.target_gantt.style.width);
        let _v = event.clientX - that.mouse_x;

        if (_v > max_width) {
          _v = max_width;
        }
        if (_v < 0) {
          _v = 0;
        }

        let _result = Math.round((_v / max_width) * 100);

        that.target_gantt.querySelector(".gantt_task_progress").style.width =
          (_result / 100) * max_width + "px";
        that.target_gantt.querySelector(
          ".gantt_task_progress_drag",
        ).style.left = (_result / 100) * max_width + "px";

        //	modify
        let task_idx = that.target_gantt.getAttribute("task_idx");
        that.tasks.data[that.visible_order[task_idx].index].progress = _result;
      }
    }
    //	gantt_data_area drag end

    let gantt_task_bg = document.createElement("div");
    gantt_task_bg.classList.add("gantt_task_bg");
    gantt_data_area.appendChild(gantt_task_bg);

    let gantt_bars_area = document.createElement("div");
    gantt_bars_area.classList.add("gantt_bars_area");
    gantt_data_area.appendChild(gantt_bars_area);

    gantt_task.appendChild(gantt_data_area);

    right_content_content.appendChild(gantt_task);

    div_right_content.appendChild(right_content_content);

    content_wrapper.appendChild(div_right_content);

    //	vertical scroll
    let div_vertical_scroll = document.createElement("div");
    div_vertical_scroll.classList.add("gantt_layout_cell");
    div_vertical_scroll.classList.add("scrollVer_cell");

    let vertical_scroll_content = document.createElement("div");
    vertical_scroll_content.classList.add("gantt_layout_content");
    vertical_scroll_content.classList.add("gantt_task_vscroll");

    let vertical_scroll = document.createElement("div");
    vertical_scroll.classList.add("gantt_layout_cell");
    vertical_scroll.classList.add("gantt_ver_scroll");
    vertical_scroll.classList.add("gantt_layout_cell_border_top");
    vertical_scroll.classList.add("vertical_scroll");

    let vertical_scroll_last = document.createElement("div");
    vertical_scroll.appendChild(vertical_scroll_last);

    vertical_scroll_content.appendChild(vertical_scroll);

    div_vertical_scroll.appendChild(vertical_scroll_content);

    content_wrapper.appendChild(div_vertical_scroll);

    main_content.appendChild(content_wrapper);
  }

  draw_div_horizontal(obj_gantt) {
    let main_content = obj_gantt.children[0];

    let gantt_layout_cell = document.createElement("div");
    gantt_layout_cell.classList.add("gantt_layout_cell");
    gantt_layout_cell.classList.add("scrollHor_cell");

    let gantt_layout_content = document.createElement("div");
    gantt_layout_content.classList.add("gantt_layout_content");

    let gantt_hor_scroll = document.createElement("div");
    gantt_hor_scroll.classList.add("gantt_hor_scroll");
    gantt_hor_scroll.classList.add("gantt_layout_cell");
    gantt_hor_scroll.style.top = "auto";

    let last_div = document.createElement("div");

    gantt_hor_scroll.appendChild(last_div);
    gantt_layout_content.appendChild(gantt_hor_scroll);
    gantt_layout_cell.appendChild(gantt_layout_content);
    main_content.appendChild(gantt_layout_cell);
  }
  calc_size(obj_gantt) {
    //if (obj_gantt == null) {
    //   console.log("calc_size  obj_gantt is null");
    //   return;
    //}
    this.total_height = obj_gantt.offsetHeight;
    this.total_width = obj_gantt.offsetWidth;

    let inner_height = this.total_height - this.scroll_size - 3; //	580
    let main_content = obj_gantt.children[0];

    if (main_content == undefined) {
      return;
    }

    main_content.style.height = this.total_height + "px";
    main_content.style.width = this.total_width + "px";

    //	gantt
    let gantt_wrapper = main_content.children[0];
    gantt_wrapper.style.height =
      this.total_height - this.scroll_size - 2 + "px";
    gantt_wrapper.style.width = this.total_width - 2 + "px";

    //	left menu
    let div_left = gantt_wrapper.children[0];
    div_left.style.height = inner_height + "px";
    div_left.style.width = this.left_width + "px";
    div_left.children[0].style.height = inner_height + "px";

    //	left menu - gantt_grid_scale
    let div_left_header = div_left.children[0].children[0].children[0];
    div_left_header.style.height = this.subscales_height + 1 + "px";
    div_left_header.style.lineHeight = this.subscales_height + 1 + "px";

    //	left menu - gantt_grid_data
    let div_left_content = div_left.children[0].children[0].children[1];
    div_left_content.style.height =
      this.total_height -
      2 -
      this.scroll_size -
      this.subscales_height -
      2 +
      "px";
    div_left_content.querySelector(".hidden_height").style.height =
      this.list_length * this.config.min_column_height + 2 + "px";

    //	resizer
    let div_resizer = gantt_wrapper.children[1];
    div_resizer.style.height = inner_height + "px";

    //	right content
    let div_right = gantt_wrapper.children[2];
    div_right.style.height = inner_height + "px";
    div_right.style.width =
      this.total_width - this.left_width - this.scroll_size - 2 + "px";
    div_right.children[0].style.height = inner_height + "px";

    //	right content - gantt_task_scale
    let div_right_header = obj_gantt.querySelector(".right_content_hscroll")
      .children[0];
    div_right_header.style.height = this.subscales_height + 1 + "px";
    div_right_header.style.width =
      this.date_count * this.config.min_column_width + "px";

    //	right content - gantt_data_area
    let div_right_content = obj_gantt.querySelector(".right_content_hscroll")
      .children[1];
    div_right_content.style.height =
      this.total_height -
      2 -
      this.scroll_size -
      this.subscales_height -
      2 +
      "px";
    div_right_content.style.width =
      this.date_count * this.config.min_column_width + "px";

    div_right_content.querySelector(".gantt_task_bg").style.height =
      this.config.min_column_height * this.list_length + "px";
    div_right_content.querySelector(".gantt_task_bg").style.width =
      this.date_count * this.config.min_column_width + "px";

    //	draw grid line
    if (this.config.check_weekend) {
      div_right_content.querySelector(".gantt_task_bg").style.backgroundImage =
        "linear-gradient(#e5e5e5 1px, transparent 1px),linear-gradient(90deg, #e5e5e5 1px, transparent 1px),linear-gradient(90deg, rgba(242, 222, 222, 0.5) " +
        this.config.min_column_width +
        "px, transparent " +
        this.config.min_column_width +
        "px),linear-gradient(90deg, rgba(217, 237, 247, 0.5) " +
        this.config.min_column_width +
        "px, transparent " +
        this.config.min_column_width +
        "px)";
      div_right_content.querySelector(".gantt_task_bg").style.backgroundSize =
        this.config.min_column_width +
        "px " +
        this.config.min_column_height +
        "px, " +
        this.config.min_column_width +
        "px " +
        this.config.min_column_height +
        "px, " +
        this.config.min_column_width * 7 +
        "px " +
        this.config.min_column_height +
        "px, " +
        this.config.min_column_width * 7 +
        "px " +
        this.config.min_column_height +
        "px";
      div_right_content.querySelector(
        ".gantt_task_bg",
      ).style.backgroundPosition =
        "-1px -1px, -1px -1px, -" +
        this.config.start_date.getDay() * this.config.min_column_width +
        "px -1px, -" +
        (this.config.start_date.getDay() + 1) * this.config.min_column_width +
        "px -1px";
    } else {
      div_right_content.querySelector(".gantt_task_bg").style.backgroundImage =
        "linear-gradient(#e5e5e5 1px, transparent 1px),linear-gradient(90deg, #e5e5e5 1px, transparent 1px)";
      div_right_content.querySelector(".gantt_task_bg").style.backgroundSize =
        this.config.min_column_width +
        "px " +
        this.config.min_column_height +
        "px, " +
        this.config.min_column_width +
        "px " +
        this.config.min_column_height +
        "px";
      div_right_content.querySelector(
        ".gantt_task_bg",
      ).style.backgroundPosition = "-1px -1px, -1px -1px";
    }

    div_right_content.querySelector(".gantt_bars_area").style.width =
      this.date_count * this.config.min_column_width + "px";

    //	vertical scroll
    let div_vertical = gantt_wrapper.children[3];
    div_vertical.style.height = inner_height + "px";
    div_vertical.style.width = this.scroll_size + "px";

    div_vertical.children[0].style.height = inner_height + "px";
    div_vertical.children[0].children[0].style.top =
      this.subscales_height + "px";
    div_vertical.children[0].children[0].style.height =
      this.total_height - this.scroll_size - this.subscales_height - 1 + "px";
    div_vertical.children[0].children[0].style.width = this.scroll_size + "px";
    div_vertical.children[0].children[0].children[0].style.height =
      this.list_length * this.config.min_column_height + 2 + "px";

    //	horizontal scroll
    let div_horizontal = main_content.querySelector(".scrollHor_cell");
    div_horizontal.style.height = this.scroll_size + "px";
    div_horizontal.style.width = this.total_width - 2 + "px";

    div_horizontal.children[0].style.height = this.scroll_size + "px";
    div_horizontal.children[0].children[0].style.height =
      this.scroll_size + "px";
    div_horizontal.children[0].children[0].style.width =
      this.total_width - 2 + "px";
    div_horizontal.children[0].children[0].children[0].style.width =
      this.date_count * this.config.min_column_width +
      this.left_width +
      1 +
      "px";
  }
  draw_menu(obj_gantt) {
    let that = this;
    //let obj_menu = obj_gantt.querySelector(".gantt_grid_scale");
    let obj_menu = obj_gantt.querySelector(".gantt_grid_index");

    let cell, cell_inner, cell_inner_text, format_str;
    for (let el of this.config.left_type) {
      cell = document.createElement("div");
      cell.classList.add("gantt_grid_head_cell");
      cell.setAttribute("data-column-index", 1);
      cell.setAttribute("data-column-name", "start_date");
      cell.style.width = el.width + "px";
      //cell.style.textAlign = el.align || "center";
      cell.style.textAlign = "center";
      cell.style.float = "left";
      /*
      cell.animate({
      transform: [
        "translateX(0px) rotate(0deg)", // 開始値
        "translateX(800px) rotate(360deg)" // 終了値
      ]
    }, {
      duration: 3000, // ミリ秒指定
      iterations: Infinity, // 繰り返し回数
      direction: "normal", // 繰り返し挙動
      easing: "ease" // 加減速種類
    });
*/

      cell_inner = document.createElement("div");
      cell_inner.classList.add("gantt_tree_content");
      if (el.title == undefined) {
        format_str = "";
      } else {
        format_str = el.title;
      }
      cell_inner_text = document.createTextNode(format_str);
      cell_inner.appendChild(cell_inner_text);
      cell.appendChild(cell_inner);

      obj_menu.appendChild(cell);
    }

    //	button element
    cell = document.createElement("div");
    cell.classList.add("gantt_grid_head_cell");
    cell.classList.add("gantt_last_cell");
    if (this.config.use_add) {
      cell.classList.add("gantt_grid_head_add");
      cell.addEventListener("click", function () {
        if (that.config.fn_add_main != null) {
          let obj = that.config.fn_add_main();
          if (typeof obj == "object") {
            that.tasks.data.push(obj);
            that.reset_visible(document.getElementById(that.gantt_id));
          }
        }
      });
    }
    cell.style.width = 50 + "px";

    obj_menu.appendChild(cell); //	add button
  }
  draw_date(obj_gantt) {
    //const format_month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    obj_gantt
      .querySelectorAll(".gantt_scale_line")
      .forEach((e) => e.parentNode.removeChild(e));
    let gantt_task_scale = obj_gantt.querySelector(".gantt_task_scale");

    let start_date;
    let end_date;
    let d_year, d_month, d_day;

    this.config.subscales.forEach((subscale) => {
      switch (subscale.toUpperCase()) {
        case "Y":
        case "YEAR":
          let gantt_scale_line_year = document.createElement("div");
          gantt_scale_line_year.classList.add("gantt_scale_line");
          gantt_scale_line_year.style.position = "relative";
          gantt_scale_line_year.style.height =
            this.config.subscale_height + "px";
          gantt_scale_line_year.style.lineHeight =
            this.config.subscale_height + "px";

          start_date = new Date(this.config.start_date);
          end_date = new Date(this.config.end_date);

          d_year = new Date(start_date.getFullYear(), 0, 1);
          while (true) {
            let temp_first = new Date(d_year.getFullYear(), 0, 1); //	연초
            let temp_end = new Date(d_year.getFullYear(), 11, 31); //	연말

            if (temp_first < start_date) {
              temp_first = start_date;
            }
            if (temp_end > end_date) {
              temp_end = end_date;
            }

            let gantt_scale_cell = document.createElement("div");
            gantt_scale_cell.classList.add("gantt_scale_cell");
            gantt_scale_cell.style.position = "absolute";
            gantt_scale_cell.style.height = this.config.subscale_height + "px";
            gantt_scale_cell.style.width =
              this.date_diff("D", temp_first, temp_end) *
                this.config.min_column_width +
              "px";
            gantt_scale_cell.style.left =
              this.date_diff("D", start_date, temp_first) *
                this.config.min_column_width +
              "px"; // n_day * cell_width

            let gantt_scale_cell_text = document.createTextNode(
              d_year.getFullYear() + "年",
            );
            gantt_scale_cell.appendChild(gantt_scale_cell_text);
            gantt_scale_line_year.appendChild(gantt_scale_cell);

            if (d_year >= end_date) break;
            d_year = this.date_add(
              "D",
              temp_first,
              this.date_diff("D", temp_first, temp_end) + 1,
            );
          }

          gantt_task_scale.appendChild(gantt_scale_line_year);
          break;

        case "M":
        case "MONTH":
          let gantt_scale_line_month = document.createElement("div");
          gantt_scale_line_month.classList.add("gantt_scale_line");
          gantt_scale_line_month.style.position = "relative";
          gantt_scale_line_month.style.height =
            this.config.subscale_height + "px";
          gantt_scale_line_month.style.lineHeight =
            this.config.subscale_height + "px";

          start_date = new Date(this.config.start_date);
          end_date = new Date(this.config.end_date);

          d_month = new Date(
            start_date.getFullYear(),
            start_date.getMonth(),
            1,
          );
          while (true) {
            let temp_first = new Date(
              d_month.getFullYear(),
              d_month.getMonth(),
              1,
            ); //	월초
            let temp_end = new Date(
              d_month.getFullYear(),
              d_month.getMonth() + 1,
              0,
            ); //	월말

            if (temp_first < start_date) {
              temp_first = start_date;
            }
            if (temp_end > end_date) {
              temp_end = end_date;
            }

            let gantt_scale_cell = document.createElement("div");
            gantt_scale_cell.classList.add("gantt_scale_cell");
            gantt_scale_cell.style.position = "absolute";
            gantt_scale_cell.style.height = this.config.subscale_height + "px";
            gantt_scale_cell.style.width =
              this.date_diff("D", temp_first, temp_end) *
                this.config.min_column_width +
              "px";
            gantt_scale_cell.style.left =
              this.date_diff("D", start_date, temp_first) *
                this.config.min_column_width +
              "px"; // n_day * cell_width

            //let gantt_scale_cell_text = document.createTextNode(format_month[d_temp.getMonth()] + ', ' + d_temp.getFullYear());

            //let gantt_scale_cell_text = document.createTextNode(
            //  d_month.getMonth() + 1 + "月 " + d_month.getFullYear(),
            //);
            let gantt_scale_cell_text = document.createTextNode(
              d_month.getMonth() + 1 + "月 ",
            );
            if (this.config.min_column_width > 5) {
              gantt_scale_cell_text = document.createTextNode(
                d_month.getFullYear() +
                  "年 " +
                  (d_month.getMonth() + 1) +
                  "月 ",
              );
            }
            gantt_scale_cell.appendChild(gantt_scale_cell_text);
            gantt_scale_line_month.appendChild(gantt_scale_cell);

            if (d_month >= end_date) break;
            d_month = this.date_add(
              "D",
              temp_first,
              this.date_diff("D", temp_first, temp_end) + 1,
            );
          }
          gantt_task_scale.appendChild(gantt_scale_line_month);
          break;

        case "D":
        case "DAY":
          let gantt_scale_line_day = document.createElement("div");
          gantt_scale_line_day.classList.add("gantt_scale_line");
          gantt_scale_line_day.style.position = "relative";
          gantt_scale_line_day.style.height =
            this.config.subscale_height + "px";
          gantt_scale_line_day.style.lineHeight =
            this.config.subscale_height + "px";

          start_date = new Date(this.config.start_date);
          end_date = new Date(this.config.end_date);

          d_day = start_date;
          let n = 0;
          while (true) {
            let gantt_scale_cell = document.createElement("div");
            gantt_scale_cell.classList.add("gantt_scale_cell");
            gantt_scale_cell.style.position = "absolute";
            gantt_scale_cell.style.height = this.config.subscale_height + "px";
            gantt_scale_cell.style.width = this.config.min_column_width + "px";
            gantt_scale_cell.style.left =
              n * this.config.min_column_width + "px"; // n_day * cell_width

            let gantt_scale_cell_text = document.createTextNode(
              d_day.getDate(),
            );
            if (this.config.min_column_width < 5) {
              gantt_scale_cell_text = document.createTextNode("");
            }

            gantt_scale_cell.appendChild(gantt_scale_cell_text);
            gantt_scale_line_day.appendChild(gantt_scale_cell);

            if (d_day >= end_date) break;
            d_day = this.date_add("D", d_day, 1);
            n++;
          }
          gantt_task_scale.appendChild(gantt_scale_line_day);
          break;
      }
    });
  }
  draw_task(start_idx, end_idx) {
    //console.log("draw_task: ", this.name);
    let obj_gantt = document.getElementById(this.gantt_id);
    if (obj_gantt == null) {
      console.log("draw_task obj_gannt == null");
      return;
    }
    let left_menu_vscroll = obj_gantt.querySelector(".left_menu_vscroll");

    //let right_content_vscroll = obj_gantt
    //  .querySelector(".right_content_vscroll")
    //  .querySelector(".gantt_bars_area");

    let right_content_vscroll = obj_gantt // error fix
      .querySelector(".right_content_vscroll");

    if (right_content_vscroll == null) {
      console.log("draw_task right_content_vscroll == null");
      return;
    }

    //	clear tasks
    left_menu_vscroll
      .querySelectorAll(".gantt_row_task")
      .forEach((e) => e.parentNode.removeChild(e));
    right_content_vscroll
      .querySelectorAll(".gantt_task_line")
      .forEach((e) => e.parentNode.removeChild(e));

    //	clear memos
    right_content_vscroll
      .querySelectorAll(".gantt_task_memo")
      .forEach((e) => e.parentNode.removeChild(e));

    //	make left element
    for (let temp_idx = start_idx; temp_idx < end_idx; temp_idx++) {
      if (!this.not_show_left_panel) {
        if (this.is_show_grid()) {
          left_menu_vscroll.appendChild(this.draw_left_list(temp_idx)); // left pannel
        } else {
          let ele = obj_gantt.querySelector(".gantt_layout_content");
          ele.style.width = "36px";
          let ele2 = obj_gantt.querySelector(".grid_cell");
          ele2.style.width = "36px";
          let ele3 = obj_gantt.querySelector(".gantt_resizer_x");
          ele3.style.width = "0px";
          let ele4 = obj_gantt.querySelector(".timeline_cell");
          ele4.style.width = "100%";
        }
      } else {
        let ele = obj_gantt.querySelector(".gantt_layout_content");
        ele.style.width = "0px";
        let ele2 = obj_gantt.querySelector(".grid_cell");
        ele2.style.width = "0px";
        let ele3 = obj_gantt.querySelector(".gantt_resizer_x");
        ele3.style.width = "0px";
        let ele4 = obj_gantt.querySelector(".timeline_cell");
        ele4.style.width = "100%";
        //ele3.remove();
        //let ele3 = obj_gantt.querySelector(".gantt_layout_outer_scroll_horizontal");
        //let ele3 = obj_gantt.querySelector(".gantt_layout_outer_scroll_vertical");
        //ele3.style.width = "0px";
      }
      //right_content_vscroll.appendChild(this.draw_right_list(temp_idx)); // right panel
      //
       function adds( a, b ) {
	    console.log("a:",a);
	    console.log("b:",b);
            let n_a = parseInt(a.replace('px',''),10);
            let n_b = parseInt(b.replace('px',''),10);
            let ss = n_a + n_b;
	    let r = ss.toString() + 'px';
	    console.log(r);
	    return r;
       }

       let r_array = this.draw_right_list(temp_idx); // right panel
      right_content_vscroll.appendChild(r_array[0]); // right panel
      if (r_array[1] != null) {

	    //r_array[1].style.top  = r_array[0].style.top;
	    //r_array[1].style.left  = r_array[0].style.left;

             r_array[1].style.top  = adds(r_array[1].style.top, r_array[0].style.top);
             r_array[1].style.left  = adds(r_array[1].style.left, r_array[0].style.left);

         right_content_vscroll.appendChild(r_array[1]); // right panel

      }
    }

    // svg element clear

    let svg = this.gantt_data_area_svg;
    while (svg.firstChild !== null) {
      svg.removeChild(svg.firstChild);
    }

    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    var marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker",
    );
    marker.setAttribute("id", "Triangle");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerUnits", "strokeWidth");
    marker.setAttribute("markerWidth", "4");
    marker.setAttribute("markerHeight", "3");
    marker.setAttribute("orient", "auto");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    marker.appendChild(path);
    path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");

    var marker2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker",
    );
    marker2.setAttribute("id", "Triangle2");
    marker2.setAttribute("viewBox", "0 0 10 10");
    marker2.setAttribute("refX", "8");
    marker2.setAttribute("refY", "5");
    marker2.setAttribute("markerUnits", "strokeWidth");
    marker2.setAttribute("markerWidth", "8");
    marker2.setAttribute("markerHeight", "6");
    marker2.setAttribute("orient", "auto");
    var path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path2.setAttribute("fill", "red");
    marker2.appendChild(path2);
    path2.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");

    this.gantt_data_area_svg.appendChild(defs);
    defs.appendChild(marker);
    defs.appendChild(marker2);

    var instance = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    // todo set actual start and end
    instance.setAttribute("d", "M 0,10 L 90,10");
    instance.setAttribute("stroke-width", "9");
    instance.setAttribute("stroke", "red");
    instance.setAttribute("marker-end", "url(#Triangle)");

    this.gantt_data_area_svg.appendChild(instance);

    var obj = document.createElementNS("http://www.w3.org/2000/svg", "line");
    obj.setAttribute("x1", 50);
    obj.setAttribute("y1", 50);
    obj.setAttribute("x2", 50);
    obj.setAttribute("y2", 150);
    obj.setAttribute("stroke", "#ff0000");
    obj.setAttribute("stroke-width", 7);
    obj.setAttribute("marker-end", "url(#Triangle)");
    this.gantt_data_area_svg.appendChild(obj);

    // dependecy connect svg

    let child = right_content_vscroll.children;
    /*   
    for (let i = 0; i < child.length; i++) {
          //console.dir(child[i].getAttribute("n_id"));
	  if (child[i].classList.contains("gantt_bar_project")) {
              //let rect = child[i].getBoundingClientRect();
	      let sz = 5;
              let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");

              c.setAttribute("cx", child[i].offsetLeft);
              c.setAttribute("cy", child[i].offsetTop + child[i].offsetHeight/2);
              c.setAttribute("r", sz.toString());
              c.setAttribute("fill", "blue");
              this.gantt_data_area_svg.appendChild(c);

              let r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
              r.setAttribute("x", child[i].offsetLeft + child[i].offsetWidth - sz);
              r.setAttribute("y", child[i].offsetTop + child[i].offsetHeight/2 - sz );
              r.setAttribute("height", (sz*2).toString());
              r.setAttribute("width", (sz*2).toString());
              r.setAttribute("fill", "orange");
              this.gantt_data_area_svg.appendChild(r);

          } else if  (child[i].classList.contains("gantt_bar_task")) {
              //let rect = child[i].getBoundingClientRect();
	      let sz = 5;
              let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
              c.setAttribute("cx", child[i].offsetLeft);
              c.setAttribute("cy", child[i].offsetTop + child[i].offsetHeight/2);
              c.setAttribute("r", sz.toString());
              c.setAttribute("fill", "red");
              this.gantt_data_area_svg.appendChild(c);

              let r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
              r.setAttribute("x", child[i].offsetLeft + child[i].offsetWidth - sz);
              r.setAttribute("y", child[i].offsetTop + child[i].offsetHeight/2 - sz );
              r.setAttribute("height", (sz*2).toString());
              r.setAttribute("width", (sz*2).toString());
              r.setAttribute("fill", "green");
              this.gantt_data_area_svg.appendChild(r);
          }
	 
           //let depend_from = 'C.01';
           //let depend_to   = 'C.02';
        //this.draw_depend_connect(depend_from, depend_to, child);
    }
*/
    let depend_from = "C.01";
    let depend_to = "C.02";
    this.draw_depend_connect(depend_from, depend_to, child);

    depend_from = "C.22";
    depend_to = "C.21";
    this.draw_depend_connect(depend_from, depend_to, child);

    depend_from = "C.42";
    depend_to = "C.21";
    this.draw_depend_connect(depend_from, depend_to, child);

    depend_from = "C.12";
    depend_to = "C.131";
    this.draw_depend_connect(depend_from, depend_to, child);
  }

  draw_depend_connect(from, to, child) {
    let that = this;
    function serch(n_id) {
      for (let i = 0; i < child.length; i++) {
        if (child[i].getAttribute("n_id") == n_id) {
          return child[i];
        }
      }
    }

    function build_path_org(fx, fy, tx, ty) {
      let path =
        fx.toString() +
        "," +
        fy.toString() +
        " " +
        tx.toString() +
        "," +
        ty.toString();
      return path;
    }
    function build_path_prg2(fx, fy, tx, ty) {
      let path = "";
      let stack = [];
      if (fx < tx) {
        stack.push(fx.toString() + "," + fy.toString());
        stack.push((fx + (tx - fx) / 2).toString() + "," + fy.toString());
        stack.push((fx + (tx - fx) / 2).toString() + "," + ty.toString());
        stack.push(tx.toString() + "," + ty.toString());
      } else {
        stack.push(tx.toString() + "," + ty.toString());
        stack.push(fx.toString() + "," + fy.toString());
      }

      for (let i = 0; i < stack.length; i++) {
        path += stack[i] + " ";
      }
      return path;
    }
    function build_path(fx, fy, tx, ty) {
      let path = "";
      let stack = [];
      if (fx < tx) {
        //  [f]-----+
        //          |
        //          +------>[t]

        stack.push([fx, fy]);
        stack.push([fx + (tx - fx) / 2, fy]);
        stack.push([fx + (tx - fx) / 2, ty]);
        stack.push([tx, ty]);
      } else {
        //                       [f]----+
        //                              |
        //         +--------------------+
        //         |
        //         +---->[t]

        stack.push([fx, fy]);
        stack.push([fx + 20, fy]);
        if (fy < ty) {
          stack.push([fx + 20, fy + (ty - fy) / 2 + 1]);
          stack.push([tx - 30, fy + (ty - fy) / 2 + 1]);
        } else {
          stack.push([fx + 20, ty + (fy - ty) / 2 + 1]);
          stack.push([tx - 30, ty + (fy - ty) / 2 + 1]);
        }
        stack.push([tx - 30, ty]);
        stack.push([tx, ty]);
      }

      for (let i = 0; i < stack.length; i++) {
        path += stack[i][0].toString() + "," + stack[i][1].toString() + " ";
      }
      return path;
    }

    let from_task = serch(from);
    let to_task = serch(to);
    //console.log("from_task", from_task);
    //console.log("to_task", to_task);
    if (to_task == undefined) {
      return;
    }
    if (from_task == undefined) {
      return;
    }

    let from_x = from_task.offsetLeft + from_task.offsetWidth;
    let from_y = from_task.offsetTop + from_task.offsetHeight / 2;
    let to_x = to_task.offsetLeft;
    let to_y = to_task.offsetTop + to_task.offsetHeight / 2;

    /*
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1',from_x);
        line.setAttribute('y1',from_y);
        line.setAttribute('x2',to_x);
        line.setAttribute('y2',to_y);
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-width', 2);
        this.gantt_data_area_svg.appendChild(line);
        */

    //line path
    let path = build_path(from_x, from_y, to_x, to_y);
    //console.log("path",path);
    let line_path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    //line_path.setAttribute('d', 'M 20,20 70,180 120,20 170,180');
    line_path.setAttribute("d", "M " + path);
    line_path.setAttribute("fill", "none");
    line_path.setAttribute("stroke", "red");
    line_path.setAttribute("stroke-width", "2");
    line_path.setAttribute("stroke-dasharray", "none"); //10,10 etc
    line_path.setAttribute("stroke-linejoin", "round"); //miter round bevel inherit
    line_path.setAttribute("stroke-linecap", "round"); //butt round square inherit
    //line_path.setAttribute('opacity', 1);
    //line_path.setAttribute('fill-opacity', 1);
    //line_path.setAttribute('stroke-opacity', 1);
    //line_path.setAttribute('transform', "rotate(0)");
    line_path.setAttribute("marker-end", "url(#Triangle2)");
    this.gantt_data_area_svg.appendChild(line_path);
  }

  draw_left_list(index) {
    let animate = this.visible_order[index].open_animate;

    let that = this;

    /*
       open属性が存在すれば b_main = true      <=  要見直し

    */
    let b_main =
      this.tasks.data[this.visible_order[index].index].open != undefined;
    let b_open = this.tasks.data[this.visible_order[index].index].open || false;
    let gantt_row = document.createElement("div");
    if (this.visible_order[index].show) {
    }
    if (this.visible_order[index].hide) {
    }
    /*
if (animate) {
    gantt_row.animate(
  [
    { transform: 'translateY(0px)' },
    { transform: 'translateY(300px)' },
  ],
  {
    duration: 2000,
    easing: 'ease-in-out',
    iterations: 4,
    direction: 'alternate',
  }
    );
}
*/

    /*
gantt_row.animate(
  [
    {
      opacity: '0', // 透過０
      offset: 0, // キーフレームの設定
      easing: 'ease-in-out'
    },
    {
      opacity: '1', // 透過1
      offset: 0.5,
      easing: 'ease-in-out'
    },
    {
      opacity: '0', // 透過０
      offset: 1,
      easing: 'ease-in-out'
    }
  ],
  {
    duration: 2000, // アニメーションにかける時間をmsで指定
    fill: 'forwards',
  }
);
*/
    let _w = 0;
    gantt_row.classList.add("gantt_row");
    gantt_row.classList.add("gantt_row_task");
    gantt_row.setAttribute("task_idx", index);
    gantt_row.setAttribute("data-b_main", b_main);
    gantt_row.style.position = "absolute";
    gantt_row.style.height = this.config.min_column_height + "px";
    gantt_row.style.lineHeight = this.config.min_column_height + "px";
    gantt_row.style.top = this.config.min_column_height * index + "px";
    gantt_row.style.left = 0 + "px";
    gantt_row.setAttribute(
      "n_id",
      this.tasks.data[this.visible_order[index].index].n_id,
    );

    //	base element
    let cell, cell_inner, cell_inner_text, format_str;
    let format_str_date;
    if (
      this.tasks.data[this.visible_order[index].index].independent_type !=
      undefined
    ) {
      let arr_independent =
        this.tasks.data[this.visible_order[index].index].independent_type;
      for (let n = 0; n < arr_independent.length; n++) {
        cell = document.createElement("div");
        cell.classList.add("gantt_cell");
        this.set_multiple_style(cell, arr_independent[n].css);

        _w += parseInt(this.px_to_int(cell.style.width), 10);

        if (n == 0) {
          if (b_main) {
            let gantt_cell_base = document.createElement("div");
            gantt_cell_base.classList.add("gantt_tree_icon");
            cell.appendChild(gantt_cell_base);

            let gantt_tree_icon1 = document.createElement("div");
            gantt_tree_icon1.classList.add("gantt_tree_icon");
            if (b_open) {
              gantt_tree_icon1.classList.add("gantt_folder_open");
              gantt_cell_base.classList.add("gantt_close");

              gantt_cell_base.addEventListener("click", function () {
                that.tasks.data[that.visible_order[index].index].open = false;
                that.tasks.data[that.visible_order[index].index].open_animate =
                  false; // open animate
                //that.reset_visible(document.getElementById(that.gantt_id));
                that.reset(); /* fix */
              });
            } else {
              gantt_tree_icon1.classList.add("gantt_folder_closed");
              gantt_cell_base.classList.add("gantt_open");

              gantt_cell_base.addEventListener("click", function () {
                that.tasks.data[that.visible_order[index].index].open = true;
                that.tasks.data[that.visible_order[index].index].open_animate =
                  true; // open animate
                //that.reset_visible(document.getElementById(that.gantt_id));
                that.reset(); /* fix */
              });
            }
            cell.appendChild(gantt_tree_icon1);
          } else {
            for (
              let t = 0;
              t < this.tasks.data[this.visible_order[index].index].level;
              t++
            ) {
              let gantt_cell_base = document.createElement("div");
              gantt_cell_base.classList.add("gantt_tree_indent");
              cell.appendChild(gantt_cell_base);

              let gantt_tree_icon1 = document.createElement("div");
              gantt_tree_icon1.classList.add("gantt_tree_icon");
              gantt_tree_icon1.classList.add("gantt_blank");
              cell.appendChild(gantt_tree_icon1);
            }

            let gantt_tree_icon2 = document.createElement("div");
            gantt_tree_icon2.classList.add("gantt_tree_icon");
            gantt_tree_icon2.classList.add("gantt_file");
            cell.appendChild(gantt_tree_icon2);
          }
        }

        cell_inner = document.createElement("div");
        cell_inner.classList.add("gantt_tree_content");
        if (arr_independent[n].title == undefined) {
          format_str = "";
        } else {
          format_str = arr_independent[n].title;
        }
        //cell_inner_text = document.createTextNode(format_str);
        cell_inner_text = document.createElement("input");
        cell_inner_text.value = format_str;
        cell_inner.appendChild(cell_inner_text);
        cell.appendChild(cell_inner);

        gantt_row.appendChild(cell);
      }
    } else {
      for (let n = 0; n < this.config.left_type.length; n++) {
        cell = document.createElement("div");
        cell.classList.add("gantt_cell");
        cell.style.width = this.config.left_type[n].width + "px";
        cell.style.textAlign = this.config.left_type[n].align || "center";

        _w += parseInt(this.config.left_type[n].width, 10);

        if (n == 0) {
          if (b_main) {
            //GS start   level1 indent
            for (
              let t = 0;
              t < this.tasks.data[this.visible_order[index].index].level;
              t++
            ) {
              let gantt_cell_base = document.createElement("div");
              gantt_cell_base.classList.add("gantt_tree_indent");
              cell.appendChild(gantt_cell_base);

              let gantt_tree_icon1 = document.createElement("div");
              gantt_tree_icon1.classList.add("gantt_tree_icon");
              gantt_tree_icon1.classList.add("gantt_blank");
              cell.appendChild(gantt_tree_icon1);
            }
            //GS end
            let gantt_cell_base = document.createElement("div");
            gantt_cell_base.classList.add("gantt_tree_icon");
            cell.appendChild(gantt_cell_base);

            let gantt_tree_icon1 = document.createElement("div");
            gantt_tree_icon1.classList.add("gantt_tree_icon");
            if (b_open) {
              gantt_tree_icon1.classList.add("gantt_folder_open");
              gantt_cell_base.classList.add("gantt_close");

              gantt_cell_base.addEventListener("click", function () {
                that.tasks.data[that.visible_order[index].index].open = false;
                that.tasks.data[that.visible_order[index].index].open_animate =
                  false; // open animate
                //that.reset_visible(document.getElementById(that.gantt_id));
                that.reset(); /* fix */
              });
            } else {
              gantt_tree_icon1.classList.add("gantt_folder_closed");
              gantt_cell_base.classList.add("gantt_open");

              gantt_cell_base.addEventListener("click", function () {
                that.tasks.data[that.visible_order[index].index].open = true;
                that.tasks.data[that.visible_order[index].index].open_animate =
                  true; // open animate
                //that.reset_visible(document.getElementById(that.gantt_id));
                that.reset(); /* fix */
              });
            }
            cell.appendChild(gantt_tree_icon1);
          } else {
            for (
              let t = 0;
              t < this.tasks.data[this.visible_order[index].index].level;
              t++
            ) {
              let gantt_cell_base = document.createElement("div");
              gantt_cell_base.classList.add("gantt_tree_indent");
              cell.appendChild(gantt_cell_base);

              let gantt_tree_icon1 = document.createElement("div");
              gantt_tree_icon1.classList.add("gantt_tree_icon");
              gantt_tree_icon1.classList.add("gantt_blank");
              cell.appendChild(gantt_tree_icon1);
            }

            let gantt_tree_icon2 = document.createElement("div");
            gantt_tree_icon2.classList.add("gantt_tree_icon");
            gantt_tree_icon2.classList.add("gantt_file");
            cell.appendChild(gantt_tree_icon2);
          }
        }

        cell_inner = document.createElement("div");
        cell_inner.classList.add("gantt_tree_content");

        if (
          this.tasks.data[this.visible_order[index].index][
            this.config.left_type[n].content
          ] == undefined
        ) {
          format_str = "";
        } else {
          //format_str =
          //  this.tasks.data[this.visible_order[index].index][
          //    this.config.left_type[n].content
          //  ];

          if (
            this.config.left_type[n].title != "Start" &&
            this.config.left_type[n].title != "End"
          ) {
            format_str =
              this.tasks.data[this.visible_order[index].index][
                this.config.left_type[n].content
              ];
          } else {
            let d = new Date(
              this.tasks.data[this.visible_order[index].index][
                this.config.left_type[n].content
              ] + "T00:00:00",
            );
            //console.log(d);
            //console.log(d.getMonth());
            format_str = `${(d.getMonth() + 1).toString().padStart(2, "0")}/
                              ${d.getDate().toString().padStart(2, "0")}
                              `.replace(/\s|\n|\r/g, "");
            format_str_date =
              this.tasks.data[this.visible_order[index].index][
                this.config.left_type[n].content
              ];
          }
        }
        if (this.gantt_left_edit) {
          /* GS */
          if (
            this.config.left_type[n].title != "Start" &&
            this.config.left_type[n].title != "End"
          ) {
            cell_inner_text = document.createElement("input");
            cell_inner_text.value = format_str;
            cell_inner_text.style.border = "0";
            cell_inner_text.style.borderRadius = "0px";
            cell_inner.appendChild(cell_inner_text);
            cell.appendChild(cell_inner);
          } else {
            cell_inner_text = document.createElement("input");
            cell_inner_text.value = format_str_date;
            cell_inner_text.style.border = "0";
            cell_inner_text.style.borderRadius = "0px";
            cell_inner.appendChild(cell_inner_text);
            cell.appendChild(cell_inner);
          }
        } else {
          cell_inner_text = document.createTextNode(format_str);
          cell_inner.appendChild(cell_inner_text);
          cell.appendChild(cell_inner);
        }

        gantt_row.appendChild(cell);
      }
    }

    //	button element
    cell = document.createElement("div");
    cell.classList.add("gantt_cell");
    cell.classList.add("gantt_last_cell");
    cell.setAttribute("data-column-index", 3);
    cell.setAttribute("data-column-name", "add");

    let blank_width = this.left_width - _w;
    blank_width = blank_width < 0 ? 0 : blank_width;
    cell.style.width = blank_width + "px";
    if (this.tasks.data[this.visible_order[index].index].use_add) {
      cell_inner = document.createElement("div");
      if (b_main) {
        cell_inner.classList.add("gantt_add");
        cell.addEventListener("click", function () {
          if (that.config.fn_add_sub != null) {
            let obj = that.config.fn_add_sub(
              JSON.parse(
                JSON.stringify(
                  that.tasks.data[that.visible_order[index].index],
                ),
              ),
            );
            if (typeof obj == "object") {
              that.tasks.data.push(obj);
              //that.reset_visible(document.getElementById(that.gantt_id));
              that.reset(); /* fix */
            }
          }
        });
      }
      cell.appendChild(cell_inner);
    }

    gantt_row.appendChild(cell); //	add button

    gantt_row.addEventListener("dblclick", function (e) {
      if (that.config.fn_load_info != null) {
        that.config.fn_load_info(
          JSON.parse(
            JSON.stringify(that.tasks.data[that.visible_order[index].index]),
          ),
          e,
        );
      }
    });
    return gantt_row;
  }
  add_drag_event(element, range) {
    let range_left = range.getBoundingClientRect().left;
    let step = this.config.min_column_width;

    let that = this;

    element.addEventListener("mousedown", onMouseDown);

    function onMouseDown(event) {
      //event.stopPropagation();  /*GS*/
      let obj_gantt = document.getElementById(that.gantt_id);
      that.target_gantt = event.target.closest(".gantt_task_line");

      let b_project = that.target_gantt.classList.contains("gantt_bar_project");
      let b_drag = that.target_gantt.getAttribute("use_drag") == "true";
      let b_resize = that.target_gantt.getAttribute("use_resize") == "true";

      if (
        event.target.classList.contains("gantt_task_content") &&
        !b_project &&
        b_drag
      ) {
        that.is_gantt_move = true;
        that.mouse_x =
          event.clientX -
          range_left +
          obj_gantt.querySelector(".right_content_hscroll").scrollLeft -
          that.px_to_int(that.target_gantt.style.left);
        event.stopPropagation(); /*GS*/
      } else if (
        event.target.classList.contains("task_left") &&
        !b_project &&
        b_resize
      ) {
        that.is_gantt_resize_left = true;
        that.mouse_x =
          event.clientX -
          range_left +
          obj_gantt.querySelector(".right_content_hscroll").scrollLeft -
          that.px_to_int(that.target_gantt.style.left);
        that.gantt_x = event.clientX;
        that.gantt_width = that.target_gantt.offsetWidth;
        event.stopPropagation(); /*GS*/
      } else if (
        event.target.classList.contains("task_right") &&
        !b_project &&
        b_resize
      ) {
        that.is_gantt_resize_right = true;
        that.mouse_x = event.clientX;
        that.gantt_width = that.target_gantt.offsetWidth;
        event.stopPropagation(); /*GS*/
      } else if (event.target.classList.contains("gantt_task_progress_drag")) {
        that.is_gantt_progress = true;
        that.mouse_x = event.clientX - that.px_to_int(event.target.style.left);
        //event.stopPropagation();  /*GS*/
      }
    }
  }

  draw_right_list(index) {
    let that = this;
    let gantt_row = document.createElement("div");
    //let gantt_row = document.createElement("textarea");
    let b_main =
      this.tasks.data[this.visible_order[index].index].open != undefined;
    if (
      this.tasks.data[this.visible_order[index].index].start_date ==
        undefined ||
      this.tasks.data[this.visible_order[index].index].skip_gantt != undefined
    ) {
      return gantt_row;
    }

    gantt_row.classList.add("gantt_task_line");

    if (b_main) {
      gantt_row.classList.add("gantt_bar_project");
    } else {
      gantt_row.classList.add("gantt_bar_task");
    }

    gantt_row.setAttribute("task_idx", index);
    gantt_row.setAttribute(
      "use_drag",
      this.tasks.data[this.visible_order[index].index].use_drag == undefined
        ? true
        : this.tasks.data[this.visible_order[index].index].use_drag,
    );
    gantt_row.setAttribute(
      "use_resize",
      this.tasks.data[this.visible_order[index].index].use_resize == undefined
        ? true
        : this.tasks.data[this.visible_order[index].index].use_resize,
    );
    gantt_row.setAttribute(
      "n_id",
      this.tasks.data[this.visible_order[index].index].n_id,
    );

    if (
      this.tasks.data[this.visible_order[index].index].bar_color != undefined
    ) {
      gantt_row.style.backgroundColor =
        this.tasks.data[this.visible_order[index].index].bar_color;
      gantt_row.style.border =
        "1px solid " +
        this.tasks.data[this.visible_order[index].index].progress_color;
    }

    gantt_row.style.height =
      this.config.min_column_height - this.config.gantt_padding * 2 + "px";
    gantt_row.style.lineHeight =
      this.config.min_column_height - this.config.gantt_padding * 2 + "px";
    gantt_row.style.width =
      this.date_diff(
        "D",
        this.tasks.data[this.visible_order[index].index].start_date,
        this.tasks.data[this.visible_order[index].index].end_date,
      ) *
        this.config.min_column_width +
      "px";
    gantt_row.style.top =
      this.config.min_column_height * index + this.config.gantt_padding + "px";
    gantt_row.style.left =
      (this.date_diff(
        "D",
        this.config.start_date,
        this.tasks.data[this.visible_order[index].index].start_date,
      ) -
        1) *
        this.config.min_column_width +
      "px";

    //	add drag
    let obj_gantt = document.getElementById(this.gantt_id);
    this.add_drag_event(gantt_row, obj_gantt.querySelector(".gantt_task"));

    let wrapper, progress, darg, content, task_left, task_right;

    let progress_value =
      this.tasks.data[this.visible_order[index].index].progress || 0;

    wrapper = document.createElement("div");
    wrapper.classList.add("gantt_task_progress_wrapper");

    progress = document.createElement("div");
    progress.classList.add("gantt_task_progress");
    progress.style.width =
      (progress_value / 100) * this.px_to_int(gantt_row.style.width) + "px";

    if (
      this.tasks.data[this.visible_order[index].index].progress_color !=
      undefined
    ) {
      progress.style.backgroundColor =
        this.tasks.data[this.visible_order[index].index].progress_color;
    }

    wrapper.appendChild(progress);
    gantt_row.appendChild(wrapper);

    if (this.config.use_gantt_progress) {
      darg = document.createElement("div");
      darg.classList.add("gantt_task_progress_drag");
      darg.style.left =
        (progress_value / 100) * this.px_to_int(gantt_row.style.width) + "px";
      gantt_row.appendChild(darg);
    }

    content = document.createElement("div");
    content.classList.add("gantt_task_content");
    if (
      this.tasks.data[this.visible_order[index].index].font_color != undefined
    ) {
      content.style.color =
        this.tasks.data[this.visible_order[index].index].font_color;
    }
    content.innerHTML = this.tasks.data[this.visible_order[index].index].text;
    gantt_row.appendChild(content);

    /* MEMO Label*/
    let memo_div = null;
    if (this.tasks.data[this.visible_order[index].index].memo != undefined) {
      let memo = this.tasks.data[this.visible_order[index].index].memo;
      //content = document.createElement("input");
      
      memo_div = document.createElement("div");
      memo_div.id = "memo_div";
      memo_div.style.position = "absolute";
      memo_div.style.zIndex = "1000";
/*
      function callback(event) {
        event.stopPropagation();
      }
      memo_div.classList.add("gantt_task_memo");
      memo_div.addEventListener("click", callback);
      memo_div.addEventListener("mousemove", callback);
      memo_div.addEventListener("mousedown", callback);
      memo_div.addEventListener("mouseup", callback);
*/
      //----------------------------------------------  memo drag

      let content_div = document.createElement("div");
      content_div.id = "pad";
      let center = document.createElement("center");
       //center.textContent  = "TEST";
       center.textContent  = 
        this.tasks.data[this.visible_order[index].index].n_id + ' : ' +
        this.tasks.data[this.visible_order[index].index].text;

      let content_memo = document.createElement("textarea");
      content_memo.id = "memoeditor";

//      let content_memo = document.createElement("div");
//
//pell.init({
//  element: content_memo,
//  });

      content_div.appendChild(center);
      content_div.appendChild(content_memo);

      content_div.classList.add("gantt_task_memo");
      content_div.style.color = "#000000";
      content_div.style.zIndex = 3000;
      console.log(memo);
      memo_div.style.top = memo["top"];
      memo_div.style.left = memo["left"];
      //content_div.style.position = "relative";
      //console.log("content_div top",content_div.style.top);
      //console.log("content_div left",content_div.style.left);

      //content_div.style.width = memo.width;
      //content_div.style.height = memo.height;
      //content_memo.value = "MEMO TEXT"
      //
      content_memo.value = memo["text"];
      content_memo.addEventListener("change", (event) => {
        this.tasks.data[this.visible_order[index].index].memo = {
          text: content_memo.value,
          top: content_memo.style.top,
          left: content_memo.style.left,
          width: content_memo.style.width,
          height: content_memo.style.height,
        };
      });

      content_memo.addEventListener("resize", (event) => {});

      //dragElement(content_div);
      dragElement(memo_div);
      let that = this;

      function dragElement(elmnt) {
        var pos1 = 0,
          pos2 = 0,
          pos3 = 0,
          pos4 = 0;
        elmnt.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.stopPropagation();
          if (e.shiftKey) {
            return;
          }
          //e = e || window.event;
          //e.preventDefault();
          // get the mouse cursor position at startup:
          pos3 = e.clientX;
          pos4 = e.clientY;
          memo_div.onmouseup = closeDragElement;
          // call a function whenever the cursor moves:
          memo_div.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.stopPropagation();
          if (e.shiftKey) {
            return;
          }
          //e = e || window.event;
          //e.preventDefault();
          // calculate the new cursor position:
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          // set the element's new position:
          elmnt.style.top = elmnt.offsetTop - pos2 + "px";
          elmnt.style.left = elmnt.offsetLeft - pos1 + "px";

          that.tasks.data[that.visible_order[index].index].memo = {
            text: content_memo.value,
            top: content_memo.style.top,
            left: content_memo.style.left,
            width: content_memo.style.width,
            height: content_memo.style.height,
          };
        }

        function closeDragElement() {
          // stop moving when mouse button is released:
          memo_div.onmouseup = null;
          memo_div.onmousemove = null;
        }
      }
      //memo_div.appendChild(content_memo);
      memo_div.appendChild(content_div);
      //gantt_row.appendChild(memo_div);

      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          that.tasks.data[that.visible_order[index].index].memo = {
            text: content_memo.value,
            top: content_memo.style.top,
            left: content_memo.style.left,
            width: content_memo.style.width,
            height: content_memo.style.height,
          };
        }
      });

      //オブザーバーの observe() メソッドに監視対象の要素を指定して監視を開始
      observer.observe(content_memo);

      // SVG PATH
      /*
    let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    c.setAttribute("cx", "30");
    c.setAttribute("cy", "30");
    c.setAttribute("r", "10");
    c.setAttribute("fill", "blue");
    this.gantt_data_area_svg.appendChild(c);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
line.setAttribute('x1',gantt_row.offsetTop);
line.setAttribute('y1',gantt_row.offsetLeft);
line.setAttribute('x2',180);
line.setAttribute('y2',180);
line.setAttribute('stroke', '#008080');
line.setAttribute('stroke-width', 5);
line.setAttribute('stroke-dasharray', "none");//破線 10,10 etc
line.setAttribute('stroke-linejoin', 'miter'); //角 miter round bevel inherit
line.setAttribute('stroke-linecap', 'butt'); //切れ目 butt round square inherit
line.setAttribute("opacity", 1);
line.setAttribute('fill-opacity', 1);
line.setAttribute('stroke-opacity', 1);
line.setAttribute('transform', "rotate(0)");
    this.gantt_data_area_svg.appendChild(line);


*/
    }

    if (!b_main) {
      task_left = document.createElement("div");
      task_left.classList.add("gantt_task_drag");
      task_left.classList.add("task_left");
      task_left.classList.add("task_start_date");
      gantt_row.appendChild(task_left);

      task_right = document.createElement("div");
      task_right.classList.add("gantt_task_drag");
      task_right.classList.add("task_right");
      task_right.classList.add("task_end_date");
      gantt_row.appendChild(task_right);
    }

    gantt_row.addEventListener("dblclick", function (e) {
      if (that.config.fn_load_info != null) {
        that.config.fn_load_info(
          JSON.parse(
            JSON.stringify(that.tasks.data[that.visible_order[index].index]),
          ),
          e,
        );
      }
    });

    //return gantt_row;
    return [gantt_row, memo_div];
    //return [gantt_row, content_div];
  }
  event_wheel(event) {
    if (event.deltaY < 0) {
      document
        .getElementById(this.gantt_id)
        .querySelector(".vertical_scroll").scrollTop -= 100;
    }
    if (event.deltaY > 0) {
      document
        .getElementById(this.gantt_id)
        .querySelector(".vertical_scroll").scrollTop += 100;
    }
  }
  event_vertical_scroll(event) {
    let _top = event.target.scrollTop;
    let obj_gantt = document.getElementById(this.gantt_id);
    obj_gantt.querySelector(".left_menu_vscroll").scrollTop = _top;
    obj_gantt.querySelector(".right_content_vscroll").scrollTop = _top;

    let start_idx = Math.floor(_top / this.config.min_column_height);
    let end_idx = start_idx + this.show_vertical_count - 1;

    if (end_idx < this.list_length) end_idx += 1;
    this.draw_task(start_idx, end_idx);

    this.last_vscroll_position = _top;
  }
  event_horizontal_scroll(event) {
    let obj_gantt = document.getElementById(this.gantt_id);
    let _hscroll = obj_gantt.querySelector(".right_content_hscroll");
    _hscroll.scrollLeft =
      (event.target.scrollLeft /
        (event.target.scrollWidth - event.target.offsetWidth)) *
      (_hscroll.scrollWidth - _hscroll.offsetWidth);
    this.last_hscroll_position = _hscroll.scrollLeft;

    if (this.config.fn_scroll_horizon != null) {
      this.config.fn_scroll_horizon({
        left_width: this.left_width,
        min_column_width: this.config.min_column_width,
        min_column_height: this.config.min_column_height,
        total_width: this.total_width,
        date_count: this.date_count,
        scroll_left: this.last_hscroll_position,
      });
    }
  }

  resize() {
    //console.log("resize:", this.name, this.v_split_gantt.length, this.h_split_gantt.length);
    this.resize_visible(document.getElementById(this.gantt_id));
    for (let i = 0; i < this.v_split_gantt.length; i++) {
      this.v_split_gantt[i].resize_unsync(this);
    }
    for (let i = 0; i < this.h_split_gantt.length; i++) {
      this.h_split_gantt[i].resize_unsync(this);
    }
  }

  resize_unsync(from) {
    //console.log("resize_unsync:", this.name, this.v_split_gantt.length, this.h_split_gantt.length);
    this.resize_visible(document.getElementById(this.gantt_id));

    /* v split 3  sync ng bug fix 9/4 */
    for (let i = 0; i < this.v_split_gantt.length; i++) {
      if (this.v_split_gantt[i] != from) {
        this.v_split_gantt[i].resize_unsync(this);
      }
    }
    for (let i = 0; i < this.h_split_gantt.length; i++) {
      if (this.h_split_gantt[i] != from) {
        this.h_split_gantt[i].resize_unsync(this);
      }
    }
  }
  resize_visible(obj_gantt) {
    //	calc width, height
    this.calc_size(obj_gantt);

    //	define show_vertical_count & show_horizontal_count
    this.show_vertical_count =
      Math.ceil(
        (this.total_height - 2 - this.scroll_size - this.subscales_height - 2) /
          this.config.min_column_height,
      ) + 1;
    this.show_horizontal_count =
      Math.ceil(
        (this.total_width - 2 - this.left_width) / this.config.min_column_width,
      ) + 1;

    this.draw_task(0, this.list_length);
  }
}

// end class
