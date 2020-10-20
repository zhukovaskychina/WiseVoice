
import Recorder from 'recorderjs';
let audio_context;
let recorder;
const tools= {
  /**
   * 存储localStorage
   */
  setStore:(name, content) =>{
    if (!name) return;
    if (typeof content !== 'string') {
      content = JSON.stringify(content);
    }
    window.localStorage.setItem(name, content);
  },
  /**
   * 获取localStorage
   */
  getStore:(name) => {
    if (!name) return;
    return window.localStorage.getItem(name);
  },
  /**
   * 清除localStorage
   */
  clearStore:() => {
    window.localStorage.clear();
  },

  getQueryStringByName: function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    var context = "";
    if (r != null)
      context = r[2];
    reg = null;
    r = null;
    return context == null || context == "" || context == "undefined" ? "" : context;
  },


  startUserMedia:function(stream) {

      var input = audio_context.createMediaStreamSource(stream);
      recorder = new Recorder(input);
  }
}
export default tools;
