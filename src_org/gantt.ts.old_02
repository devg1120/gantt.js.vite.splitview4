export default class CubicGantt {
  /*
   *		tasks.data -> 상위노드 parent 값은 무조건 0
   *		main - sub 구조시 main 순서대로 정렬되어야 빠름.
   */
  constructor() {
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
  }
  init_gantt(gantt_id) {
    if (document.getElementById("divRTMCContent")) {
      document.getElementById("divRTMCContent").style.padding = 0;
    }

    let obj_gantt = document.getElementById(gantt_id);
    this.gantt_id = gantt_id;

    if (this.config.left_type.length == 0) {
      alert("config.left_type를 설정해주십시오.");
      return;
    }

    this.reset_visible(obj_gantt);
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

  sort_visible3() {

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
    }

    for (let i = 0; i < this.tasks.data.length; ++i) {
         if (this.tasks.data[i].start_date != undefined ) {
             this.tasks.data[i].d_start = 
                 format_date(this.tasks.data[i].start_date);
         }
         if (this.tasks.data[i].end_date != undefined ) {
             this.tasks.data[i].d_end = 
                 format_date(this.tasks.data[i].end_date);
         }
         if (this.tasks.data[i].open_animate == undefined ) {
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

    for ( let key in task_dict) {
      let child_task = task_dict[key];
      if (child_task.parent_id != undefined ) {
           let parent_task = task_dict[child_task.parent_id];
           parent_task.addchild( child_task );
 
      }
    };

   //-------------------------------------------
    function task_dfs_org(task , data ) {
       for (let i = 0; i < task.children.length; ++i) {
         let r = task_dfs(task.children[i] , data );
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
       if ( task.open == undefined ) {
           return [ task.data.start_date, task.data.end_date];
       } else {
           return [ task.data.start_date, task.data.end_date];
       }
   } // end func

  function format_date(d) {
      let month = "" + (d.getMonth() + 1);
     let  day = "" + d.getDate();
    let   year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

    function task_dfs(task , data ) {
       let min_start_date = null;
       let max_end_date   = null;

       for (let i = 0; i < task.children.length; ++i) {
         let r = task_dfs(task.children[i] , data );

         if ( min_start_date == null) {
               min_start_date = new Date(r[0]);
         } else {
               if (min_start_date.getTime() > new Date(r[0]).getTime()) {
                       min_start_date = new Date(r[0]);
               }
         }
         if ( max_end_date == null) {
               max_end_date = new Date(r[1]);
         } else {
               if (max_end_date.getTime() < new Date(r[1]).getTime()) {
                       max_end_date = new Date(r[1]);
               }
         }

       }

       if ( min_start_date != null && max_end_date != null) {
        data[task.copy_idx].start_date = new Date(min_start_date);
        data[task.copy_idx].end_date = new Date(max_end_date);
        data[task.copy_idx].d_start = format_date(new Date(min_start_date));
        data[task.copy_idx].d_end   = format_date(new Date(max_end_date));
        task.data.start_date = min_start_date;
        task.data.end_date = max_end_date;

       }

       return [ task.data.start_date, task.data.end_date];

   } // end func

   for (let i = 0; i < top_level.length; ++i) {
       let task = top_level[i];
       let r = task_dfs(task , this.tasks.data );
    };


   //-------------------------------------------
    function task_walk(task,  visible_order ) {

        visible_order.push({
          n_id: task.id,
          parent: 0,
          index: task.copy_idx,
          open: task.open,
          n_children: 0,
          open_animate: task.open_animate,
        });
       if (task.open == false ){
          return;
       }
       for (let i = 0; i < task.children.length; ++i) {
         task_walk(task.children[i],  visible_order );
       }
   }

   this.visible_order = [];
   for (let i = 0; i < top_level.length; ++i) {
       let task = top_level[i];
       task_walk(task,  this.visible_order );
    };



/*
    copy_data.forEach(function(data){
      switch (data.level) {
         case 0:
               console.log("* LEVEL;", data.level);
                break;
         default:
               console.log("LEVEL;", data.level);

      }
    });
*/

   }

  task_visible() {
    this.sort_visible3();

    this.draw_task(0, this.list_length);
    //this.reset_visible(document.getElementById(this.gantt_id));

  }

  reset_visible(obj_gantt) {
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
    this.draw_menu(obj_gantt);

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
      e.preventDefault(); //  drag로 인한 highlight 해제시켜줌.
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
      if (that.is_div_resize) {
        div_resizer.querySelector(".gantt_resizer_stick").style.left =
          event.clientX - div_resizer.getBoundingClientRect().left + "px";
      }
    });
    content_wrapper.addEventListener("mouseup", function (event) {
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

    //	gantt_data_area drag
    gantt_data_area.addEventListener("mouseleave", onMouseUp);
    gantt_data_area.addEventListener("mouseup", onMouseUp);

    let step = this.config.min_column_width;

    function onMouseUp(event) {
       function format_date(d) {
           let month = "" + (d.getMonth() + 1);
          let  day = "" + d.getDate();
         let   year = d.getFullYear();

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
             format_date(that.tasks.data[that.visible_order[task_idx].index].start_date);
        that.tasks.data[that.visible_order[task_idx].index].d_end =
             format_date(that.tasks.data[that.visible_order[task_idx].index].end_date);

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
             format_date(that.tasks.data[that.visible_order[task_idx].index].start_date);
        that.tasks.data[that.visible_order[task_idx].index].d_end =
             format_date(that.tasks.data[that.visible_order[task_idx].index].end_date);

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
             format_date(that.tasks.data[that.visible_order[task_idx].index].start_date);
        that.tasks.data[that.visible_order[task_idx].index].d_end =
             format_date(that.tasks.data[that.visible_order[task_idx].index].end_date);

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
    this.total_height = obj_gantt.offsetHeight;
    this.total_width = obj_gantt.offsetWidth;

    let inner_height = this.total_height - this.scroll_size - 3; //	580

    let main_content = obj_gantt.children[0];
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
        "linear-gradient(#e5e5e5 1px, transparent 1px),linear-gradient(90deg, #e5e5e5 1px, transparent 1px),linear-gradient(90deg, rgba(242, 222, 222, 0.3) " +
        this.config.min_column_width +
        "px, transparent " +
        this.config.min_column_width +
        "px),linear-gradient(90deg, rgba(217, 237, 247, 0.3) " +
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
    let obj_menu = obj_gantt.querySelector(".gantt_grid_scale");

    let cell, cell_inner, cell_inner_text, format_str;
    for (let el of this.config.left_type) {
      cell = document.createElement("div");
      cell.classList.add("gantt_grid_head_cell");
      cell.setAttribute("data-column-index", 1);
      cell.setAttribute("data-column-name", "start_date");
      cell.style.width = el.width + "px";
      cell.style.textAlign = el.align || "center";
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
        format_str = el.title ;
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
              d_year.getFullYear(),
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
            let gantt_scale_cell_text = document.createTextNode(
              d_month.getMonth() + 1 + "월, " + d_month.getFullYear(),
            );
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
    let obj_gantt = document.getElementById(this.gantt_id);
    let left_menu_vscroll = obj_gantt.querySelector(".left_menu_vscroll");
    let right_content_vscroll = obj_gantt
      .querySelector(".right_content_vscroll")
      .querySelector(".gantt_bars_area");

    //	clear tasks
    left_menu_vscroll
      .querySelectorAll(".gantt_row_task")
      .forEach((e) => e.parentNode.removeChild(e));
    right_content_vscroll
      .querySelectorAll(".gantt_task_line")
      .forEach((e) => e.parentNode.removeChild(e));

    //	make left element
    for (let temp_idx = start_idx; temp_idx < end_idx; temp_idx++) {
      left_menu_vscroll.appendChild(this.draw_left_list(temp_idx));           // left pannel
      right_content_vscroll.appendChild(this.draw_right_list(temp_idx));      // right panel
    }
  }
  draw_left_list(index) {
    //console.log("draw_left_list");
    //console.dir(this.visible_order);

    let animate = this.visible_order[index].open_animate;

    let that = this;

    /*
       open属性が存在すれば b_main = true      <=  要見直し

    */
    let b_main =
      this.tasks.data[this.visible_order[index].index].open != undefined;
    let b_open = this.tasks.data[this.visible_order[index].index].open || false;
    let gantt_row = document.createElement("div");
    if (this.visible_order[index].show) {}
    if (this.visible_order[index].hide) {}
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
                that.tasks.data[that.visible_order[index].index].open_animate = false;      // open animate
                that.reset_visible(document.getElementById(that.gantt_id));
              });
            } else {
              gantt_tree_icon1.classList.add("gantt_folder_closed");
              gantt_cell_base.classList.add("gantt_open");

              gantt_cell_base.addEventListener("click", function () {
                that.tasks.data[that.visible_order[index].index].open = true;
                that.tasks.data[that.visible_order[index].index].open_animate = true;      // open animate
                that.reset_visible(document.getElementById(that.gantt_id));
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
          format_str =  arr_independent[n].title;
        }
        cell_inner_text = document.createTextNode(format_str);
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
                that.tasks.data[that.visible_order[index].index].open_animate = false;      // open animate
                that.reset_visible(document.getElementById(that.gantt_id));
              });
            } else {
              gantt_tree_icon1.classList.add("gantt_folder_closed");
              gantt_cell_base.classList.add("gantt_open");

              gantt_cell_base.addEventListener("click", function () {
                that.tasks.data[that.visible_order[index].index].open = true;
                that.tasks.data[that.visible_order[index].index].open_animate = true;      // open animate
                that.reset_visible(document.getElementById(that.gantt_id));
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
          format_str =                                                   /* tree content */
              this.tasks.data[this.visible_order[index].index][
              this.config.left_type[n].content
            ];
        }
        cell_inner_text = document.createTextNode(format_str);
        cell_inner.appendChild(cell_inner_text);
        cell.appendChild(cell_inner);

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
              that.reset_visible(document.getElementById(that.gantt_id));
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
      } else if (
        event.target.classList.contains("task_right") &&
        !b_project &&
        b_resize
      ) {
        that.is_gantt_resize_right = true;
        that.mouse_x = event.clientX;
        that.gantt_width = that.target_gantt.offsetWidth;
      } else if (event.target.classList.contains("gantt_task_progress_drag")) {
        that.is_gantt_progress = true;
        that.mouse_x = event.clientX - that.px_to_int(event.target.style.left);
      }
    }
  }
  draw_right_list(index) {
    let that = this;
    let gantt_row = document.createElement("div");
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

    return gantt_row;
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
}

// end class
