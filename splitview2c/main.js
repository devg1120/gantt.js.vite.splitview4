import './SplitView.css'
import  SplitView  from './SplitViewClass.js'


document.addEventListener("DOMContentLoaded", function () {

    let splitview = new SplitView();
    splitview.activate(document.getElementById("main"))
    //SplitView.activate(document.getElementById("main"))


    document.getElementById("layoutChangeButton").addEventListener("click", (e) => {
      const viewA = document.getElementById("hack-me-a")
      const viewB = document.getElementById("hack-me-b")
      const splitView = viewA.parentNode

      if (splitView.classList.contains("vertical")) {
        splitView.classList.replace("vertical", "horizontal")
        viewA.style.height = ""
        viewB.style.height = ""

      }
      else {
        splitView.classList.replace("horizontal", "vertical")
        viewA.style.width = ""
        viewB.style.width = ""
      }
    })

});


